const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Sample route
app.get("/", (req, res) => {
    res.send("Hello from the backend!");
});

// Route to get next photo from batch data
app.get("/api/batch/next", async (req, res) => {
    try {
        const batchDataDir = path.join(__dirname, "batch_data");
        const files = await fs.readdir(batchDataDir);

        if (files.length === 0) {
            return res.status(404).json({ message: "No batch data available" });
        }

        // Get the first file
        const filePath = path.join(batchDataDir, files[0]);
        const fileContent = await fs.readFile(filePath, "utf8");

        // Split into lines and filter out empty lines
        const lines = fileContent.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
            return res
                .status(404)
                .json({ message: "No data available in file" });
        }

        // Get the first line and parse it as JSON
        const rawData = JSON.parse(lines[0]);

        // Extract the content between ||| markers
        const contentMatch =
            rawData.response.body.choices[0].message.content.match(
                /\|\|\|(.*?)\|\|\|/s
            );
        if (!contentMatch) {
            throw new Error("Could not find content between ||| markers");
        }

        // Parse the content as JSON
        const parsedData = JSON.parse(contentMatch[1]);

        // Transform the data to match the expected format
        const transformedData = {
            imageUrl: `/images/${rawData.custom_id}`, // Assuming images are served from /images directory
            formData: {
                placement: parsedData.substrates[0].placement,
                additionalNotes: parsedData.substrates[0].additionalNotes,
                trueSign: !parsedData.substrates[0].thisIsntReallyASign,
                confidence: parsedData.substrates[0].confidence,
                confidenceReasoning:
                    parsedData.substrates[0].confidenceReasoning,
                additionalInfo: parsedData.substrates[0].additionalInfo,
                typefaces: parsedData.substrates[0].typefaces.map((t) => ({
                    typefaceStyle: t.typefaceStyle,
                    text: t.copy,
                    letteringOntology: t.letteringOntology,
                    messageFunction: t.messageFunction,
                    covidRelated: t.covidRelated,
                    additionalNotes: t.additionalNotes,
                })),
            },
        };

        // Return the transformed data
        res.json(transformedData);
    } catch (error) {
        console.error("Error reading batch data:", error);
        res.status(500).json({ message: "Error reading batch data" });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
