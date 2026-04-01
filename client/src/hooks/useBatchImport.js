import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { apiUrl } from "../api";

export default function useBatchImport({ onComplete } = {}) {
    const [isImporting, setIsImporting] = useState(false);
    const toast = useToast();

    const handleBatchImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(apiUrl("/api/batch/import"), {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to import batch");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let successCount = 0;
            let errorCount = 0;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter((line) => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.type === "progress") {
                            successCount += data.results.filter((r) => r.success).length;
                            errorCount += data.results.filter((r) => !r.success).length;
                        } else if (data.type === "complete") {
                            successCount = data.results.filter((r) => r.success).length;
                            errorCount = data.results.filter((r) => !r.success).length;

                            toast({
                                title: "Batch Import Complete",
                                description: `Successfully imported ${successCount} photos. ${errorCount} failed.`,
                                status: successCount > 0 ? "success" : "error",
                                duration: 5000,
                                isClosable: true,
                            });

                            if (onComplete) await onComplete();
                        }
                    } catch (err) {
                        console.error("Error parsing response chunk:", err);
                    }
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to import batch: " + error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsImporting(false);
        }

        event.target.value = "";
    };

    return { isImporting, handleBatchImport };
}
