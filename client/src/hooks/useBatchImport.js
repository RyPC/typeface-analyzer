import { useState } from "react";
import { useToast, Box, Text, Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton } from "@chakra-ui/react";
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

                            const failures = data.results.filter((r) => !r.success);
                            const errorSummary = {};
                            failures.forEach((f) => {
                                const msg = f.error || "Unknown error";
                                errorSummary[msg] = (errorSummary[msg] || 0) + 1;
                            });
                            const errorLines = Object.entries(errorSummary)
                                .map(([msg, count]) => `${count}x: ${msg}`)
                                .join("\n");

                            if (errorLines) {
                                console.warn("Batch import failures:\n" + errorLines);
                            }

                            const status = successCount > 0 ? "success" : "error";
                            const colorScheme = status === "success" ? "green" : "red";

                            toast({
                                duration: 15000,
                                isClosable: true,
                                render: ({ onClose }) => (
                                    <Alert
                                        status={status}
                                        variant="solid"
                                        borderRadius="md"
                                        flexDirection="column"
                                        alignItems="flex-start"
                                        p={3}
                                        gap={1}
                                    >
                                        <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <AlertIcon m={0} />
                                                <AlertTitle>Batch Import Complete</AlertTitle>
                                            </Box>
                                            <CloseButton onClick={onClose} size="sm" />
                                        </Box>
                                        <AlertDescription fontSize="sm">
                                            {successCount} imported, {errorCount} failed.
                                        </AlertDescription>
                                        {errorLines && (
                                            <Box as="details" width="100%" mt={1}>
                                                <Box
                                                    as="summary"
                                                    fontSize="xs"
                                                    cursor="pointer"
                                                    opacity={0.85}
                                                    _hover={{ opacity: 1 }}
                                                    userSelect="none"
                                                >
                                                    Show failure reasons
                                                </Box>
                                                <Box
                                                    as="pre"
                                                    mt={2}
                                                    p={2}
                                                    fontSize="xs"
                                                    bg="blackAlpha.300"
                                                    borderRadius="sm"
                                                    whiteSpace="pre-wrap"
                                                    wordBreak="break-word"
                                                    maxH="200px"
                                                    overflowY="auto"
                                                >
                                                    {errorLines}
                                                </Box>
                                            </Box>
                                        )}
                                    </Alert>
                                ),
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
