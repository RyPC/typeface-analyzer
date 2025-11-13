// Utility functions for photo-related operations

export const getStatusColor = (status) => {
    switch (status) {
        case "unclaimed":
            return "gray";
        case "claimed":
            return "blue";
        case "in_progress":
            return "orange";
        case "finished":
            return "green";
        default:
            return "gray";
    }
};

export const getSubstrateCount = (photo) => {
    if (!photo.substrates) return 0;
    return photo.substrates.length;
};

export const getTypefaceCount = (photo) => {
    if (!photo.substrates) return 0;
    return photo.substrates.reduce((total, substrate) => {
        return total + (substrate.typefaces?.length || 0);
    }, 0);
};

