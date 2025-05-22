const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection URI
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectToMongo();

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

// Route to get typeface style statistics
app.get(
    ["/api/stats/typeface", "/api/stats/typeface/:muni"],
    async (req, res) => {
        try {
            const db = client.db("visualTextDB");
            const pipeline = [
                // Match by municipality if provided
                ...(req.params.muni
                    ? [{ $match: { municipality: req.params.muni } }]
                    : []),
                // Unwind the substrates array
                { $unwind: "$substrates" },
                // Unwind the typefaces array within each substrate
                { $unwind: "$substrates.typefaces" },
                // Unwind the typefaceStyle array within each typeface
                { $unwind: "$substrates.typefaces.typefaceStyle" },
                // Group by typefaceStyle and count occurrences
                {
                    $group: {
                        _id: "$substrates.typefaces.typefaceStyle",
                        count: { $sum: 1 },
                    },
                },
                // Sort by count in descending order
                { $sort: { count: -1 } },
            ];

            const result = await db
                .collection("photos")
                .aggregate(pipeline)
                .toArray();
            res.json(result);
        } catch (error) {
            console.error("Error getting typeface statistics:", error);
            res.status(500).json({
                message: "Error getting typeface statistics",
            });
        }
    }
);

// Route to get lettering ontology statistics
app.get(
    ["/api/stats/lettering-ontology", "/api/stats/lettering-ontology/:muni"],
    async (req, res) => {
        try {
            const db = client.db("visualTextDB");
            const pipeline = [
                // Match by municipality if provided
                ...(req.params.muni
                    ? [{ $match: { municipality: req.params.muni } }]
                    : []),
                { $unwind: "$substrates" },
                { $unwind: "$substrates.typefaces" },
                // Unwind the lettering ontology array
                { $unwind: "$substrates.typefaces.letteringOntology" },
                // Trim whitespace from each ontology value
                {
                    $addFields: {
                        "substrates.typefaces.letteringOntology": {
                            $trim: {
                                input: "$substrates.typefaces.letteringOntology",
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: "$substrates.typefaces.letteringOntology",
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ];

            const result = await db
                .collection("photos")
                .aggregate(pipeline)
                .toArray();
            res.json(result);
        } catch (error) {
            console.error(
                "Error getting lettering ontology statistics:",
                error
            );
            res.status(500).json({
                message: "Error getting lettering ontology statistics",
            });
        }
    }
);

// Route to get message function statistics
app.get(
    ["/api/stats/message-function", "/api/stats/message-function/:muni"],
    async (req, res) => {
        try {
            const db = client.db("visualTextDB");
            const pipeline = [
                // Match by municipality if provided
                ...(req.params.muni
                    ? [{ $match: { municipality: req.params.muni } }]
                    : []),
                { $unwind: "$substrates" },
                { $unwind: "$substrates.typefaces" },
                // Unwind the message function array
                { $unwind: "$substrates.typefaces.messageFunction" },
                // Trim whitespace from each message function value
                {
                    $addFields: {
                        "substrates.typefaces.messageFunction": {
                            $trim: {
                                input: "$substrates.typefaces.messageFunction",
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: "$substrates.typefaces.messageFunction",
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ];

            const result = await db
                .collection("photos")
                .aggregate(pipeline)
                .toArray();
            res.json(result);
        } catch (error) {
            console.error("Error getting message function statistics:", error);
            res.status(500).json({
                message: "Error getting message function statistics",
            });
        }
    }
);

// Route to get placement distribution statistics
app.get(
    ["/api/stats/placement", "/api/stats/placement/:muni"],
    async (req, res) => {
        try {
            const db = client.db("visualTextDB");
            const pipeline = [
                // Match by municipality if provided
                ...(req.params.muni
                    ? [{ $match: { municipality: req.params.muni } }]
                    : []),
                { $unwind: "$substrates" },
                {
                    $group: {
                        _id: "$substrates.placement",
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ];

            const result = await db
                .collection("photos")
                .aggregate(pipeline)
                .toArray();
            res.json(result);
        } catch (error) {
            console.error("Error getting placement statistics:", error);
            res.status(500).json({
                message: "Error getting placement statistics",
            });
        }
    }
);

// Route to get COVID-related statistics
app.get(["/api/stats/covid", "/api/stats/covid/:muni"], async (req, res) => {
    try {
        const db = client.db("visualTextDB");
        const pipeline = [
            // Match by municipality if provided
            ...(req.params.muni
                ? [{ $match: { municipality: req.params.muni } }]
                : []),
            { $unwind: "$substrates" },
            { $unwind: "$substrates.typefaces" },
            {
                $group: {
                    _id: "$substrates.typefaces.covidRelated",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ];

        const result = await db
            .collection("photos")
            .aggregate(pipeline)
            .toArray();
        res.json(result);
    } catch (error) {
        console.error("Error getting COVID-related statistics:", error);
        res.status(500).json({
            message: "Error getting COVID-related statistics",
        });
    }
});

// Route to get total document count
app.get("/api/stats/count", async (req, res) => {
    try {
        const db = client.db("visualTextDB");
        const count = await db.collection("photos").countDocuments();
        res.json({ count });
    } catch (error) {
        console.error("Error getting document count:", error);
        res.status(500).json({
            message: "Error getting document count",
        });
    }
});

// Route to get all unique municipalities
app.get("/api/municipalities", async (req, res) => {
    try {
        const db = client.db("visualTextDB");
        const pipeline = [
            // Group by municipality and get unique values
            {
                $group: {
                    _id: "$municipality",
                },
            },
            // Sort alphabetically
            {
                $sort: { _id: 1 },
            },
        ];

        const result = await db
            .collection("photos")
            .aggregate(pipeline)
            .toArray();

        // Transform the result to just return an array of municipality names
        const municipalities = result.map((item) => item._id);

        res.json(municipalities);
    } catch (error) {
        console.error("Error getting municipalities:", error);
        res.status(500).json({
            message: "Error getting municipalities",
        });
    }
});

// Route to get map data for a specific feature and subfeature
app.get("/api/map-data", async (req, res) => {
    try {
        const { feature, subFeature } = req.query;
        const db = client.db("visualTextDB");

        let pipeline = [
            // Unwind the substrates array
            { $unwind: "$substrates" },
            // Unwind the typefaces array within each substrate
            { $unwind: "$substrates.typefaces" },
            // Group by municipality and count occurrences
            {
                $group: {
                    _id: "$municipality",
                    total: { $sum: 1 },
                    selected: {
                        $sum: {
                            $cond: [
                                {
                                    $switch: {
                                        branches: [
                                            {
                                                case: {
                                                    $eq: [feature, "typeface"],
                                                },
                                                then: {
                                                    $cond: [
                                                        {
                                                            $isArray:
                                                                "$substrates.typefaces.typefaceStyle",
                                                        },
                                                        {
                                                            $in: [
                                                                subFeature,
                                                                "$substrates.typefaces.typefaceStyle",
                                                            ],
                                                        },
                                                        {
                                                            $eq: [
                                                                "$substrates.typefaces.typefaceStyle",
                                                                subFeature,
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                case: {
                                                    $eq: [feature, "lettering"],
                                                },
                                                then: {
                                                    $cond: [
                                                        {
                                                            $isArray:
                                                                "$substrates.typefaces.letteringOntology",
                                                        },
                                                        {
                                                            $in: [
                                                                subFeature,
                                                                "$substrates.typefaces.letteringOntology",
                                                            ],
                                                        },
                                                        {
                                                            $eq: [
                                                                "$substrates.typefaces.letteringOntology",
                                                                subFeature,
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                case: {
                                                    $eq: [feature, "message"],
                                                },
                                                then: {
                                                    $cond: [
                                                        {
                                                            $isArray:
                                                                "$substrates.typefaces.messageFunction",
                                                        },
                                                        {
                                                            $in: [
                                                                subFeature,
                                                                "$substrates.typefaces.messageFunction",
                                                            ],
                                                        },
                                                        {
                                                            $eq: [
                                                                "$substrates.typefaces.messageFunction",
                                                                subFeature,
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                case: {
                                                    $eq: [feature, "placement"],
                                                },
                                                then: {
                                                    $eq: [
                                                        "$substrates.placement",
                                                        subFeature,
                                                    ],
                                                },
                                            },
                                            {
                                                case: {
                                                    $eq: [feature, "covid"],
                                                },
                                                then: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                subFeature,
                                                                "COVID-Related",
                                                            ],
                                                        },
                                                        "$substrates.typefaces.covidRelated",
                                                        {
                                                            $not: "$substrates.typefaces.covidRelated",
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                        default: false,
                                    },
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            // Sort by municipality name
            { $sort: { _id: 1 } },
        ];

        const result = await db
            .collection("photos")
            .aggregate(pipeline)
            .toArray();

        // Transform the result to match the expected format
        const transformedData = result.reduce((acc, item) => {
            acc[item._id] = {
                total: item.total,
                selected: item.selected,
            };
            return acc;
        }, {});

        res.json(transformedData);
    } catch (error) {
        console.error("Error getting map data:", error);
        res.status(500).json({ message: "Error getting map data" });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
