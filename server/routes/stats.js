const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Photo = require("../models/Photo");

router.get(["/typeface", "/typeface/:muni"], async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pipeline = [
            ...(req.params.muni ? [{ $match: { municipality: req.params.muni } }] : []),
            { $unwind: "$substrates" },
            { $unwind: "$substrates.typefaces" },
            { $unwind: "$substrates.typefaces.typefaceStyle" },
            { $group: { _id: "$substrates.typefaces.typefaceStyle", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ];
        const result = await db.collection("photos").aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error("Error getting typeface statistics:", error);
        res.status(500).json({ message: "Error getting typeface statistics" });
    }
});

router.get(["/lettering-ontology", "/lettering-ontology/:muni"], async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pipeline = [
            ...(req.params.muni ? [{ $match: { municipality: req.params.muni } }] : []),
            { $unwind: "$substrates" },
            { $unwind: "$substrates.typefaces" },
            { $unwind: "$substrates.typefaces.letteringOntology" },
            {
                $addFields: {
                    "substrates.typefaces.letteringOntology": {
                        $trim: { input: "$substrates.typefaces.letteringOntology" },
                    },
                },
            },
            { $group: { _id: "$substrates.typefaces.letteringOntology", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ];
        const result = await db.collection("photos").aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error("Error getting lettering ontology statistics:", error);
        res.status(500).json({ message: "Error getting lettering ontology statistics" });
    }
});

router.get(["/message-function", "/message-function/:muni"], async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pipeline = [
            ...(req.params.muni ? [{ $match: { municipality: req.params.muni } }] : []),
            { $unwind: "$substrates" },
            { $unwind: "$substrates.typefaces" },
            { $unwind: "$substrates.typefaces.messageFunction" },
            {
                $addFields: {
                    "substrates.typefaces.messageFunction": {
                        $trim: { input: "$substrates.typefaces.messageFunction" },
                    },
                },
            },
            { $group: { _id: "$substrates.typefaces.messageFunction", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ];
        const result = await db.collection("photos").aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error("Error getting message function statistics:", error);
        res.status(500).json({ message: "Error getting message function statistics" });
    }
});

router.get(["/placement", "/placement/:muni"], async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pipeline = [
            ...(req.params.muni ? [{ $match: { municipality: req.params.muni } }] : []),
            { $unwind: "$substrates" },
            { $group: { _id: "$substrates.placement", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ];
        const result = await db.collection("photos").aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error("Error getting placement statistics:", error);
        res.status(500).json({ message: "Error getting placement statistics" });
    }
});

router.get(["/covid", "/covid/:muni"], async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pipeline = [
            ...(req.params.muni ? [{ $match: { municipality: req.params.muni } }] : []),
            { $unwind: "$substrates" },
            { $unwind: "$substrates.typefaces" },
            { $group: { _id: "$substrates.typefaces.covidRelated", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ];
        const result = await db.collection("photos").aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error("Error getting COVID-related statistics:", error);
        res.status(500).json({ message: "Error getting COVID-related statistics" });
    }
});

router.get("/count", async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const count = await db.collection("photos").countDocuments();
        res.json({ count });
    } catch (error) {
        console.error("Error getting document count:", error);
        res.status(500).json({ message: "Error getting document count" });
    }
});

router.get("/map-data", async (req, res) => {
    try {
        const { feature, subFeature } = req.query;
        const db = mongoose.connection.db;

        const pipeline = [
            { $unwind: "$substrates" },
            { $unwind: "$substrates.typefaces" },
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
                                                case: { $eq: [feature, "typeface"] },
                                                then: {
                                                    $cond: [
                                                        { $isArray: "$substrates.typefaces.typefaceStyle" },
                                                        { $in: [subFeature, "$substrates.typefaces.typefaceStyle"] },
                                                        { $eq: ["$substrates.typefaces.typefaceStyle", subFeature] },
                                                    ],
                                                },
                                            },
                                            {
                                                case: { $eq: [feature, "lettering"] },
                                                then: {
                                                    $cond: [
                                                        { $isArray: "$substrates.typefaces.letteringOntology" },
                                                        { $in: [subFeature, "$substrates.typefaces.letteringOntology"] },
                                                        { $eq: ["$substrates.typefaces.letteringOntology", subFeature] },
                                                    ],
                                                },
                                            },
                                            {
                                                case: { $eq: [feature, "message"] },
                                                then: {
                                                    $cond: [
                                                        { $isArray: "$substrates.typefaces.messageFunction" },
                                                        { $in: [subFeature, "$substrates.typefaces.messageFunction"] },
                                                        { $eq: ["$substrates.typefaces.messageFunction", subFeature] },
                                                    ],
                                                },
                                            },
                                            {
                                                case: { $eq: [feature, "placement"] },
                                                then: { $eq: ["$substrates.placement", subFeature] },
                                            },
                                            {
                                                case: { $eq: [feature, "covid"] },
                                                then: {
                                                    $cond: [
                                                        { $eq: [subFeature, "COVID-Related"] },
                                                        "$substrates.typefaces.covidRelated",
                                                        { $not: "$substrates.typefaces.covidRelated" },
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
            { $sort: { _id: 1 } },
        ];

        const result = await db.collection("photos").aggregate(pipeline).toArray();
        const transformedData = result.reduce((acc, item) => {
            acc[item._id] = { total: item.total, selected: item.selected };
            return acc;
        }, {});
        res.json(transformedData);
    } catch (error) {
        console.error("Error getting map data:", error);
        res.status(500).json({ message: "Error getting map data" });
    }
});

router.get("/municipalities", async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pipeline = [
            { $group: { _id: "$municipality" } },
            { $sort: { _id: 1 } },
        ];
        const result = await db.collection("photos").aggregate(pipeline).toArray();
        const municipalities = result
            .map((item) => item._id)
            .filter((m) => m && m !== "Unknown" && m.trim() !== "");
        res.json(municipalities);
    } catch (error) {
        console.error("Error getting municipalities:", error);
        res.status(500).json({ message: "Error getting municipalities" });
    }
});

module.exports = router;
