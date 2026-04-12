const express = require("express");
const router = express.Router();
const Photo = require("../models/Photo");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");
const { constructS3Url } = require("../utils/s3");
const { findPhotosSortedByLastUpdated } = require("../utils/photoListSort");

function withPhotoLinks(photos) {
    return photos.map((photo) => ({
        ...photo,
        photoLink: constructS3Url(photo.custom_id),
    }));
}

router.patch("/batch-claim", verifyToken, async (req, res) => {
    try {
        const { photoIds } = req.body;
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return res
                .status(400)
                .json({ message: "Photo IDs array is required" });
        }
        const photos = await Photo.find({
            _id: { $in: photoIds },
            status: "unclaimed",
        });
        if (photos.length === 0) {
            return res
                .status(400)
                .json({
                    message: "No unclaimed photos found with the provided IDs",
                });
        }
        const updateResult = await Photo.updateMany(
            { _id: { $in: photos.map((p) => p._id) } },
            {
                $set: {
                    status: "claimed",
                    initials: user.initials,
                    lastUpdated: new Date(),
                },
            },
        );
        res.json({
            message: `Successfully claimed ${updateResult.modifiedCount} photos`,
            claimedCount: updateResult.modifiedCount,
            totalRequested: photoIds.length,
            totalFound: photos.length,
        });
    } catch (error) {
        console.error("Error batch claiming photos:", error);
        res.status(500).json({ message: "Error batch claiming photos" });
    }
});

router.patch("/:id/claim", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        const photo = await Photo.findById(id);
        if (!photo) return res.status(404).json({ message: "Photo not found" });
        if (photo.status !== "unclaimed") {
            return res
                .status(400)
                .json({ message: "Photo is already claimed or processed" });
        }
        photo.status = "claimed";
        photo.initials = user.initials;
        photo.lastUpdated = new Date();
        await photo.save();
        res.json({ message: "Photo claimed successfully", photo });
    } catch (error) {
        console.error("Error claiming photo:", error);
        res.status(500).json({ message: "Error claiming photo" });
    }
});

router.patch("/:id/unclaim", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        const photo = await Photo.findById(id);
        if (!photo) return res.status(404).json({ message: "Photo not found" });
        if (photo.initials !== user.initials) {
            return res
                .status(403)
                .json({
                    message: "You can only unclaim photos you have claimed",
                });
        }
        if (photo.status === "finished") {
            return res
                .status(400)
                .json({ message: "Finished photos cannot be unclaimed" });
        }
        photo.status = "unclaimed";
        photo.initials = undefined;
        photo.lastUpdated = new Date();
        await photo.save();
        res.json({ message: "Photo unclaimed successfully", photo });
    } catch (error) {
        console.error("Error unclaiming photo:", error);
        res.status(500).json({ message: "Error unclaiming photo" });
    }
});

router.patch("/:id/skip", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        const photo = await Photo.findById(id);
        if (!photo) return res.status(404).json({ message: "Photo not found" });
        if (photo.initials !== user.initials) {
            return res
                .status(403)
                .json({ message: "You can only skip photos you have claimed" });
        }
        if (photo.status !== "claimed" && photo.status !== "in_progress") {
            return res
                .status(400)
                .json({
                    message:
                        "Only claimed or in-progress photos can be skipped",
                });
        }
        photo.status = "skipped";
        photo.initials = undefined;
        photo.lastUpdated = new Date();
        await photo.save();
        res.json({ message: "Photo skipped successfully", photo });
    } catch (error) {
        console.error("Error skipping photo:", error);
        res.status(500).json({ message: "Error skipping photo" });
    }
});

router.patch("/:id/reclaim", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        const photo = await Photo.findById(id);
        if (!photo) return res.status(404).json({ message: "Photo not found" });
        if (photo.status !== "skipped") {
            return res
                .status(400)
                .json({ message: "Only skipped phototos can be reclaimed" });
        }
        photo.status = "claimed";
        photo.initials = user.initials;
        photo.lastUpdated = new Date();
        await photo.save();
        res.json({ message: "Photo reclaimed successfully", photo });
    } catch (error) {
        console.error("Error reclaiming photo:", error);
        res.status(500).json({ message: "Error reclaiming photo" });
    }
});

router.patch("/:id/update", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId).select("-password");
        const updateData = req.body;
        if (!user) return res.status(404).json({ message: "User not found" });
        const photo = await Photo.findById(id);
        if (!photo) return res.status(404).json({ message: "Photo not found" });
        if (photo.status !== "claimed" && photo.status !== "in_progress" && photo.status !== "finished") {
            return res
                .status(400)
                .json({ message: "Photo must be claimed to update" });
        }
        if (photo.initials !== user.initials) {
            return res
                .status(403)
                .json({
                    message: "You can only update photos you have claimed",
                });
        }
        if (updateData.municipality !== undefined) {
            if (
                !updateData.municipality ||
                updateData.municipality === "" ||
                updateData.municipality === "Unknown"
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Municipality is required and cannot be empty or 'Unknown'",
                    });
            }
        }
        Object.keys(updateData).forEach((key) => {
            if (key !== "_id" && key !== "id") {
                photo[key] = updateData[key];
            }
        });
        photo.lastUpdated = new Date();
        await photo.save();
        res.json({ message: "Photo updated successfully", photo });
    } catch (error) {
        console.error("Error updating photo:", error);
        res.status(500).json({ message: "Error updating photo" });
    }
});

router.get("/unclaimed", verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const filterType = req.query.filterType;
        const filterValue = req.query.filterValue;

        let query = { status: "unclaimed" };
        if (filterType && filterValue) {
            query[filterType] = filterValue;
        }

        const totalCount = await Photo.countDocuments(query);
        const data = await findPhotosSortedByLastUpdated(
            query,
            sortOrder,
            skip,
            limit
        );

        res.json({
            data: withPhotoLinks(data),
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error("Error getting unclaimed photos:", error);
        res.status(500).json({ message: "Error getting unclaimed photos" });
    }
});

router.get("/my-claimed", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const filterType = req.query.filterType;
        const filterValue = req.query.filterValue;

        let query = {
            initials: user.initials,
            status: { $in: ["claimed", "in_progress", "finished"] },
        };
        if (filterType && filterValue) {
            query[filterType] = filterValue;
        }

        const totalCount = await Photo.countDocuments(query);
        const data = await findPhotosSortedByLastUpdated(
            query,
            sortOrder,
            skip,
            limit
        );

        res.json({
            data: withPhotoLinks(data),
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error("Error getting user's claimed photos:", error);
        res.status(500).json({
            message: "Error getting user's claimed photos",
        });
    }
});

router.get("/my-skipped", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

        const query = { status: "skipped" };
        const totalCount = await Photo.countDocuments(query);
        const data = await findPhotosSortedByLastUpdated(
            query,
            sortOrder,
            skip,
            limit
        );

        res.json({
            data: withPhotoLinks(data),
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error("Error getting skipped phototos:", error);
        res.status(500).json({ message: "Error getting skipped phototos" });
    }
});

module.exports = router;
