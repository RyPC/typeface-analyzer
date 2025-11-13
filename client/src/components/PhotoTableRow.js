import { Tr, Td, Badge } from "@chakra-ui/react";
import { getStatusColor, getSubstrateCount, getTypefaceCount } from "../utils/photoUtils";

export default function PhotoTableRow({ 
    photo, 
    onRowClick, 
    actionButtons = null
}) {
    const handleClick = (e) => {
        // Don't trigger row click if clicking on action buttons or their children
        if (e.target.closest('button, [role="button"], a')) {
            return;
        }
        if (onRowClick) {
            onRowClick(photo);
        }
    };

    return (
        <Tr
            cursor={onRowClick ? "pointer" : "default"}
            _hover={onRowClick ? { bg: "gray.50" } : {}}
            onClick={handleClick}
        >
            <Td>
                <Badge colorScheme={getStatusColor(photo.status)}>
                    {photo.status || "Active"}
                </Badge>
            </Td>
            <Td>{photo.municipality || "-"}</Td>
            <Td>{photo.initials || "-"}</Td>
            <Td>
                {new Date(photo.lastUpdated).toLocaleDateString()}
            </Td>
            <Td>
                <Badge
                    colorScheme={
                        getSubstrateCount(photo) > 1 ? "orange" : "gray"
                    }
                >
                    {getSubstrateCount(photo)}
                </Badge>
            </Td>
            <Td>
                <Badge
                    colorScheme={
                        getTypefaceCount(photo) > 1 ? "purple" : "gray"
                    }
                >
                    {getTypefaceCount(photo)}
                </Badge>
            </Td>
            <Td>{photo.custom_id}</Td>
            {actionButtons && <Td>{actionButtons}</Td>}
        </Tr>
    );
}

