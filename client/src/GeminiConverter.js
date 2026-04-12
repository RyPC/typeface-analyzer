import { Button, Input } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { useRef } from "react";

export default function GeminiConverter({ size = "md", ...buttonProps }) {
    const fileInputRef = useRef();

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => convertAndDownload(reader.result, file.name);
        reader.readAsText(file);
        event.target.value = "";
    };

    const convertAndDownload = (content, originalName) => {
        const lines = content.split("\n").filter((l) => l.trim());
        const outputLines = [];

        for (const line of lines) {
            try {
                const raw = JSON.parse(line);

                // Extract the text from the Gemini response
                const parts = raw?.response?.candidates?.[0]?.content?.parts;
                const text = parts?.find((p) => p.text)?.text ?? "";

                // Strip ```json ... ``` fences if present
                const jsonText = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

                // Parse the bounding box array Gemini returns
                let boxes = [];
                try {
                    boxes = JSON.parse(jsonText);
                } catch {
                    // If parsing fails, leave typefaces empty
                }

                // Map each detected label to a typeface entry
                const typefaces = Array.isArray(boxes)
                    ? boxes.map((box) => ({
                          typefaceStyle: [],
                          copy: box.label ?? "",
                          letteringOntology: [],
                          messageFunction: [],
                          covidRelated: false,
                          additionalNotes: "",
                      }))
                    : [];

                const substrates = [
                    {
                        placement: "",
                        additionalNotes: "",
                        thisIsntReallyASign: false,
                        notASignDescription: "",
                        typefaces,
                        confidence: 3,
                        confidenceReasoning: "",
                        additionalInfo: "",
                    },
                ];

                const converted = {
                    custom_id: raw.key,
                    response: {
                        body: {
                            choices: [
                                {
                                    message: {
                                        content: `|||${JSON.stringify({ substrates })}|||`,
                                    },
                                },
                            ],
                        },
                    },
                };

                outputLines.push(JSON.stringify(converted));
            } catch (err) {
                console.error("Skipping malformed line:", err);
            }
        }

        const baseName = originalName.replace(/\.jsonl$/i, "");
        const blob = new Blob([outputLines.join("\n")], { type: "application/jsonl" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseName}_converted.jsonl`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Input
                type="file"
                ref={fileInputRef}
                accept=".jsonl"
                onChange={handleFileUpload}
                style={{ display: "none" }}
            />
            <Button
                leftIcon={<RepeatIcon />}
                size={size}
                colorScheme="blue"
                onClick={() => fileInputRef.current.click()}
                {...buttonProps}
            >
                Convert Gemini JSONL
            </Button>
        </>
    );
}
