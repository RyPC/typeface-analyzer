import { Box, Table, Tbody } from "@chakra-ui/react";
import PhotoTableHeader from "./PhotoTableHeader";
import PhotoTableRow from "./PhotoTableRow";

export default function PhotoTable({
    data,
    sortOrder,
    onSortToggle,
    onRowClick,
    actionButtons = null,
    showActions = false,
    showInitials = true,
}) {
    return (
        <Box overflowX="auto">
            <Table variant="simple">
                <PhotoTableHeader
                    sortOrder={sortOrder}
                    onSortToggle={onSortToggle}
                    showActions={showActions}
                    showInitials={showInitials}
                />
                <Tbody>
                    {data.map((item) => (
                        <PhotoTableRow
                            key={item._id || item.custom_id}
                            photo={item}
                            onRowClick={onRowClick}
                            actionButtons={
                                actionButtons ? actionButtons(item) : null
                            }
                            showInitials={showInitials}
                        />
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
}
