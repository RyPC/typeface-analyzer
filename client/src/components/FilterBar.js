import { Badge, Button, HStack, Divider } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

/**
 * Reusable filter bar: a "Filters" button that opens a modal,
 * plus clickable badge chips for each active filter value.
 *
 * Props:
 *   filters       – array of { type, values[] }
 *   onOpenModal   – called when the Filters button is clicked
 *   onRemoveFilter(type, value) – called when a badge is dismissed
 */
export default function FilterBar({ filters = [], onOpenModal, onRemoveFilter }) {
    const totalCount = filters.reduce((sum, f) => sum + (f.values || []).length, 0);

    return (
        <HStack spacing={2} wrap="wrap">
            <Button
                onClick={onOpenModal}
                size="sm"
                variant={totalCount > 0 ? "solid" : "outline"}
                colorScheme={totalCount > 0 ? "blue" : "gray"}
            >
                Filters
                {totalCount > 0 && (
                    <Badge ml={2} colorScheme="gray">
                        {totalCount}
                    </Badge>
                )}
            </Button>

            {totalCount > 0 && (
                <>
                    <Divider orientation="vertical" height="32px" borderColor="gray.300" />
                    <HStack wrap="wrap" spacing={2}>
                        {filters.flatMap((filter) =>
                            (filter.values || []).map((value) => (
                                <Badge
                                    key={`${filter.type}-${value}`}
                                    as="button"
                                    colorScheme="gray"
                                    px={2}
                                    py={1}
                                    fontSize="xs"
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    cursor="pointer"
                                    onClick={() => onRemoveFilter(filter.type, value)}
                                    transition="all 0.2s"
                                    _hover={{ bg: "gray.400", color: "white" }}
                                    aria-label={`Remove ${filter.type}: ${value} filter`}
                                >
                                    {filter.type}: {value}
                                    <CloseIcon w={2} h={2} ml={1} />
                                </Badge>
                            ))
                        )}
                    </HStack>
                </>
            )}
        </HStack>
    );
}
