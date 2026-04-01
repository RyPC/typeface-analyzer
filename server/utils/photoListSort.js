const Photo = require("../models/Photo");

/**
 * Paginated query sorted by lastUpdated. Coerces values to Date so documents
 * with string lastUpdated (e.g. legacy CSV imports) order correctly alongside Dates.
 */
async function findPhotosSortedByLastUpdated(query, sortOrderMongo, skip, limit) {
    return Photo.aggregate([
        { $match: query },
        {
            $addFields: {
                _sortLastUpdated: {
                    $convert: {
                        input: "$lastUpdated",
                        to: "date",
                        onError: new Date(0),
                        onNull: new Date(0),
                    },
                },
            },
        },
        { $sort: { _sortLastUpdated: sortOrderMongo } },
        { $skip: skip },
        { $limit: limit },
        { $project: { _sortLastUpdated: 0 } },
    ]).exec();
}

module.exports = { findPhotosSortedByLastUpdated };
