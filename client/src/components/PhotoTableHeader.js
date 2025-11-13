import { Thead, Tr, Th, Flex } from "@chakra-ui/react";
import { TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";

export default function PhotoTableHeader({ 
    sortOrder, 
    onSortToggle, 
    showActions = false 
}) {
    return (
        <Thead>
            <Tr>
                <Th>Status</Th>
                <Th>Municipality</Th>
                <Th>Initials</Th>
                <Th>
                    <Flex
                        align="center"
                        cursor="pointer"
                        onClick={onSortToggle}
                    >
                        Last Updated
                        {sortOrder === "desc" ? (
                            <TriangleDownIcon ml={2} />
                        ) : (
                            <TriangleUpIcon ml={2} />
                        )}
                    </Flex>
                </Th>
                <Th>Substrates</Th>
                <Th>Typefaces</Th>
                <Th>ID</Th>
                {showActions && <Th>Actions</Th>}
            </Tr>
        </Thead>
    );
}

