const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { Readable } = require("stream");
const multer = require("multer");
const Photo = require("../models/Photo");
const { findPhotosSortedByLastUpdated } = require("../utils/photoListSort");

const upload = multer({ storage: multer.memoryStorage() });

function parseRawBatchRecord(rawData) {
    // Gemini format: { key, response: { candidates: [...] } }
    if (rawData.key && rawData.response?.candidates) {
        const text = rawData.response.candidates[0].content.parts.find(p => p.text)?.text;
        return { custom_id: rawData.key, contentText: text };
    }
    // OpenAI/Claude format: { custom_id, response: { body: { choices: [...] } } }
    const text = rawData.response?.body?.choices?.[0]?.message?.content;
    return { custom_id: rawData.custom_id, contentText: text };
}

function extractBalancedJson(text) {
    const start = text.indexOf("{");
    if (start < 0) return null;
    let depth = 0, inString = false, escaped = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escaped) { escaped = false; continue; }
        if (ch === "\\" && inString) { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") depth++;
        else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
    return null;
}

function extractParsedData(contentText) {
    if (!contentText) throw new Error("No content text found in record");
    // Try |||...||| markers (OpenAI/Claude format)
    const pipeMatch = contentText.match(/\|\|\|([\s\S]*?)\|\|\|/);
    if (pipeMatch) {
        const s = pipeMatch[1].trim();
        const jsonStr = extractBalancedJson(s) ?? s;
        return JSON.parse(jsonStr);
    }
    // Try any code fence block — extract balanced JSON within it
    const codeMatch = contentText.match(/```[^\n]*\n([\s\S]*?)\n?```/);
    const searchIn = codeMatch ? codeMatch[1] : contentText;
    const jsonStr = extractBalancedJson(searchIn);
    if (jsonStr) return JSON.parse(jsonStr);
    throw new Error("Could not find JSON content in record");
}

router.get("/next", async (req, res) => {
    try {
        const batchDataDir = path.join(__dirname, "../batch_data");
        const files = await fs.readdir(batchDataDir);
        if (files.length === 0) {
            return res.status(404).json({ message: "No batch data available" });
        }
        const filePath = path.join(batchDataDir, files[0]);
        const fileContent = await fs.readFile(filePath, "utf8");
        const lines = fileContent.split("\n").filter((line) => line.trim());
        if (lines.length === 0) {
            return res.status(404).json({ message: "No data available in file" });
        }
        const rawData = JSON.parse(lines[0]);
        const { custom_id, contentText } = parseRawBatchRecord(rawData);
        rawData.custom_id = custom_id;
        const parsedData = extractParsedData(contentText);
        const transformedData = {
            imageUrl: `/images/${rawData.custom_id}`,
            formData: {
                placement: parsedData.substrates[0].placement,
                additionalNotes: parsedData.substrates[0].additionalNotes,
                trueSign: !parsedData.substrates[0].thisIsntReallyASign,
                confidence: parsedData.substrates[0].confidence,
                confidenceReasoning: parsedData.substrates[0].confidenceReasoning,
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
        res.json(transformedData);
    } catch (error) {
        console.error("Error reading batch data:", error);
        res.status(500).json({ message: "Error reading batch data" });
    }
});

router.post("/import", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const stream = Readable.from(
            req.file.buffer.toString().split("\n").filter((line) => line.trim())
        );

        const results = [];
        let processedCount = 0;
        const batchSize = 100;

        for await (const line of stream) {
            let rawData;
            try {
                rawData = JSON.parse(line);
                const { custom_id, contentText } = parseRawBatchRecord(rawData);
                rawData.custom_id = custom_id;
                const existingDoc = await Photo.findOne({
                    $or: [
                        { custom_id: { $regex: new RegExp(`^${custom_id}$`, "i") } },
                        { id: { $regex: new RegExp(`^${custom_id}$`, "i") } },
                    ],
                });
                if (existingDoc) {
                    results.push({
                        success: false,
                        error: `Document with custom_id ${custom_id} already exists (case insensitive match)`,
                        custom_id,
                    });
                    continue;
                }
                const parsedData = extractParsedData(contentText);
                const photo = new Photo({
                    id: rawData.custom_id,
                    custom_id: rawData.custom_id,
                    lastUpdated: new Date(),
                    submissionStarted: new Date(),
                    status: "unclaimed",
                    initials: "BATCH",
                    municipality: "Unknown",
                    substrates: parsedData.substrates.map((substrate) => ({
                        placement: substrate.placement,
                        additionalNotes: substrate.additionalNotes,
                        thisIsntReallyASign: substrate.thisIsntReallyASign,
                        notASignDescription: substrate.notASignDescription,
                        typefaces: substrate.typefaces.map((typeface) => ({
                            typefaceStyle: typeface.typefaceStyle,
                            copy: typeface.copy,
                            letteringOntology: typeface.letteringOntology,
                            messageFunction: typeface.messageFunction,
                            covidRelated: typeface.covidRelated,
                            additionalNotes: typeface.additionalNotes,
                        })),
                        confidence: substrate.confidence,
                        confidenceReasoning: substrate.confidenceReasoning,
                        additionalInfo: substrate.additionalInfo,
                    })),
                });
                await photo.save();
                results.push({ success: true, id: photo._id, custom_id: rawData.custom_id });
                processedCount++;
                if (processedCount % batchSize === 0) {
                    res.write(JSON.stringify({ type: "progress", processed: processedCount, results: results.slice(-batchSize) }) + "\n");
                }
            } catch (error) {
                results.push({ success: false, error: error.message, custom_id: rawData?.custom_id || "unknown" });
            }
        }

        res.write(JSON.stringify({ type: "complete", message: "Batch import completed", results }));
        res.end();
    } catch (error) {
        console.error("Error processing batch import:", error);
        res.status(500).json({ message: "Error processing batch import" });
    }
});

router.get("/table-data", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const filterType = req.query.filterType;
        const filterValue = req.query.filterValue;

        let query = {};
        if (filterType && filterValue) {
            query[filterType] = filterValue;
        }
        if (req.query.filters) {
            try {
                const filters = JSON.parse(req.query.filters);
                if (Array.isArray(filters)) {
                    filters.forEach((filter) => {
                        if (filter.type) {
                            if (Array.isArray(filter.values) && filter.values.length > 0) {
                                query[filter.type] = { $in: filter.values };
                            } else if (filter.value) {
                                query[filter.type] = filter.value;
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Error parsing filters:", error);
            }
        }
        if (req.query.search) {
            const searchTerm = req.query.search.trim();
            if (searchTerm) {
                const searchRegex = new RegExp(searchTerm, "i");
                const searchConditions = {
                    $or: [
                        { id: searchRegex },
                        { custom_id: searchRegex },
                        { municipality: searchRegex },
                        { initials: searchRegex },
                    ],
                };
                const hasExistingFilters = Object.keys(query).length > 0;
                if (hasExistingFilters) {
                    const existingConditions = { ...query };
                    query = { $and: [existingConditions, searchConditions] };
                } else {
                    query = searchConditions;
                }
            }
        }

        const totalCount = await Photo.countDocuments(query);
        const data = await findPhotosSortedByLastUpdated(
            query,
            sortOrder,
            skip,
            limit
        );

        res.json({
            data,
            pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) },
        });
    } catch (error) {
        console.error("Error getting table data:", error);
        res.status(500).json({ message: "Error getting table data" });
    }
});

router.get("/filter-options", async (req, res) => {
    try {
        const municipalities = await Photo.distinct("municipality");
        const initials = await Photo.distinct("initials");
        const statuses = await Photo.distinct("status");
        const cleanAndSort = (arr) => arr.filter(Boolean).sort();
        res.json({
            municipalities: cleanAndSort(municipalities),
            initials: cleanAndSort(initials),
            statuses: cleanAndSort(statuses),
        });
    } catch (error) {
        console.error("Error getting filter options:", error);
        res.status(500).json({ message: "Error getting filter options" });
    }
});

module.exports = router;
