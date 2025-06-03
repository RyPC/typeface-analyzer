import { Button, FormLabel, Input } from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import Papa from "papaparse";

export default function CsvToJsonConverter() {
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const csvContent = reader.result;
                parseCSV(csvContent);
            };
            reader.readAsText(file);
        }
    };

    const downloadJson = (data) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "processed_data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const parseCSV = (csvContent) => {
        Papa.parse(csvContent, {
            complete: (result) => {
                const rows = result.data;
                const header = rows[0];
                const rawData = rows.slice(1);

                // Go through data and include non-empty entries
                const data = [];
                rawData.forEach((row) => {
                    const photo = {};

                    let currentSubstrate = null;
                    let currentTypeface = null;

                    // Go through all photo data and add to photo object
                    for (let i = 0; i < header.length; i++) {
                        const key = header[i];
                        const value = row[i];

                        // Initial photo data conditions
                        if (key === "Submission ID") {
                            photo["id"] = value;
                        } else if (key === "Last updated") {
                            photo["lastUpdated"] = value;
                        } else if (key === "Submission started") {
                            photo["submissionStarted"] = value;
                        } else if (key === "Status") {
                            photo["status"] = value;
                        } else if (key === "Initials") {
                            photo["initials"] = value;
                        } else if (key === "Municipality") {
                            photo["municipality"] = value.trim();
                        } else if (key === "Photo name") {
                            photo["custom_id"] = value;
                        } else if (key === "Number of substrates") {
                            photo["substrateCount"] = parseInt(value);
                            photo["substrates"] = [];
                        } else if (key === "Photo link") {
                            photo["photoLink"] = value;
                        }

                        // Multiple substrate conditions
                        else if (/^Placement/.test(key)) {
                            if (currentSubstrate) {
                                photo["substrates"].push(currentSubstrate);
                            }
                            if (value) {
                                currentSubstrate = {};
                                currentSubstrate["placement"] = value;
                            } else {
                                currentSubstrate = null;
                            }
                        } else if (
                            /^Substrate Notes/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["additionalNotes"] = value;
                        } else if (
                            /^This isn't really a sign/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["thisIsntReallyASign"] =
                                value === "true" ? true : false;
                        } else if (
                            /^What is is?/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["notASignDescription"] = value;
                        } else if (
                            /^Number of typefaces on this substrate/.test(
                                key
                            ) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["typefaces"] = [];
                        }

                        // Multiple typeface conditions
                        else if (/^Typeface Style/.test(key)) {
                            if (currentTypeface) {
                                currentSubstrate["typefaces"].push(
                                    currentTypeface
                                );
                            }
                            if (value) {
                                currentTypeface = {};
                                currentTypeface["typefaceStyle"] = value
                                    ? value.split(",").map((s) => s.trim())
                                    : [];
                            } else {
                                currentTypeface = null;
                            }
                        } else if (/^Copy/.test(key) && currentTypeface) {
                            currentTypeface["copy"] = value;
                        } else if (
                            /^Lettering Ontology/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["letteringOntology"] = value
                                ? value.split(",").map((s) => s.trim())
                                : [];
                        } else if (
                            /^Message Function/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["messageFunction"] = value
                                ? value.split(",").map((s) => s.trim())
                                : [];
                        } else if (
                            /^Covid related/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["covidRelated"] = value === "true";
                        } else if (
                            /^Text Notes(?!\?)\b.*/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["additionalNotes"] = value;
                        }

                        // Extra substrate data conditions
                        else if (
                            /^Overall confidence/.test(key) &&
                            currentSubstrate
                        ) {
                            if (currentTypeface) {
                                currentSubstrate["typefaces"].push(
                                    currentTypeface
                                );
                                currentTypeface = null;
                            }
                            currentSubstrate["confidence"] = parseInt(value);
                        } else if (
                            /^Explain your reasoning/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["confidenceReasoning"] = value;
                        } else if (
                            /^Any additional information/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["additionalInfo"] = value;
                        }
                    }

                    if (currentSubstrate) {
                        photo["substrates"].push(currentSubstrate);
                        currentSubstrate = null;
                    }

                    data.push(photo);
                });

                downloadJson(data);
            },
            header: false,
        });
    };

    return (
        <>
            <Input
                type="file"
                id="csv_upload"
                name="csv_upload"
                accept=".csv"
                onChange={handleFileUpload}
                hidden
            />
            <FormLabel htmlFor="csv_upload">
                <Button
                    as="span"
                    colorScheme="blue"
                    cursor="pointer"
                    leftIcon={<DownloadIcon />}
                >
                    Convert CSV to JSON
                </Button>
            </FormLabel>
        </>
    );
}
