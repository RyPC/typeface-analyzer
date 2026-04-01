import { useToast } from "@chakra-ui/react";
import { apiUrl } from "../api";

export default function usePhotoActions({ onRefreshUnclaimed, onRefreshClaimed, onRefreshSkipped } = {}) {
    const toast = useToast();

    const authHeader = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
    });

    const handleClaimPhoto = async (photoId) => {
        try {
            const response = await fetch(apiUrl(`/api/photos/${photoId}/claim`), {
                method: "PATCH",
                headers: authHeader(),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to claim photo");
            }
            toast({ title: "Success", description: "Photo claimed successfully!", status: "success", duration: 3000, isClosable: true });
            await Promise.all([onRefreshUnclaimed?.(), onRefreshClaimed?.()]);
        } catch (error) {
            toast({ title: "Error", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleBatchClaim = async (selectedPhotos, onClearSelection) => {
        if (selectedPhotos.length === 0) {
            toast({ title: "No Selection", description: "Please select photos to claim", status: "warning", duration: 3000, isClosable: true });
            return;
        }
        try {
            const response = await fetch(apiUrl("/api/photos/batch-claim"), {
                method: "PATCH",
                headers: authHeader(),
                body: JSON.stringify({ photoIds: selectedPhotos }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to batch claim photos");
            }
            const result = await response.json();
            toast({ title: "Success", description: result.message, status: "success", duration: 5000, isClosable: true });
            onClearSelection?.();
            await Promise.all([onRefreshUnclaimed?.(), onRefreshClaimed?.()]);
        } catch (error) {
            toast({ title: "Error", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleUnclaimPhoto = async (photoId) => {
        try {
            const response = await fetch(apiUrl(`/api/photos/${photoId}/unclaim`), {
                method: "PATCH",
                headers: authHeader(),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to unclaim photo");
            }
            toast({ title: "Released", description: "Photo returned to unclaimed pool", status: "success", duration: 3000, isClosable: true });
            await Promise.all([onRefreshUnclaimed?.(), onRefreshClaimed?.()]);
        } catch (error) {
            toast({ title: "Error", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleSkipPhoto = async (photoId) => {
        try {
            const response = await fetch(apiUrl(`/api/photos/${photoId}/skip`), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to skip photo");
            }
            toast({ title: "Skipped", description: "Photo released to the global skipped list", status: "info", duration: 3000, isClosable: true });
            await Promise.all([onRefreshClaimed?.(), onRefreshSkipped?.()]);
        } catch (error) {
            toast({ title: "Error", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleReclaimPhoto = async (photoId) => {
        try {
            const response = await fetch(apiUrl(`/api/photos/${photoId}/reclaim`), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to reclaim photo");
            }
            toast({ title: "Reclaimed", description: "Photo moved back to your claimed list", status: "success", duration: 3000, isClosable: true });
            await Promise.all([onRefreshClaimed?.(), onRefreshSkipped?.()]);
        } catch (error) {
            toast({ title: "Error", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    return { handleClaimPhoto, handleBatchClaim, handleUnclaimPhoto, handleSkipPhoto, handleReclaimPhoto };
}
