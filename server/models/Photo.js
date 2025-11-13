// models/Photo.js
const mongoose = require("mongoose");

const typefaceSchema = new mongoose.Schema(
    {
        typefaceStyle: [String],
        copy: String,
        letteringOntology: [String],
        messageFunction: [String],
        covidRelated: Boolean,
        additionalNotes: String,
    },
    { _id: false }
);

const substrateSchema = new mongoose.Schema(
    {
        placement: String,
        additionalNotes: String,
        thisIsntReallyASign: Boolean,
        notASignDescription: String,
        typefaces: [typefaceSchema],
        confidence: Number,
        confidenceReasoning: String,
        additionalInfo: String,
    },
    { _id: false }
);

const photoSchema = new mongoose.Schema({
    id: { type: String, required: true },
    lastUpdated: { type: Date, required: true },
    submissionStarted: { type: Date, required: true },
    status: {
        type: String,
        enum: ["unclaimed", "claimed", "in_progress", "finished"],
        required: true,
    },
    initials: { 
        type: String, 
        required: function() {
            // Required only if status is not "unclaimed"
            return this.status !== "unclaimed";
        }
    },
    municipality: { type: String, required: true },
    custom_id: { type: String },
    photoLink: { type: String },
    substrateCount: { type: Number },
    substrates: [substrateSchema],
});

module.exports = mongoose.model("Photo", photoSchema);
