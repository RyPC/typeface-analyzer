import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Select,
    Badge,
    Text,
    Box,
    Divider,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const FILTER_TYPES = [
    { value: "status", label: "Status" },
    { value: "municipality", label: "Municipality" },
    { value: "initials", label: "Initials" },
];

export default function FilterModal({
    isOpen,
    onClose,
    filters,
    onApplyFilters,
    filterOptions,
}) {
    // Initialize state for each filter type
    const [statusFilter, setStatusFilter] = useState("");
    const [municipalityFilter, setMunicipalityFilter] = useState("");
    const [initialsFilter, setInitialsFilter] = useState("");

    // Initialize filters when modal opens
    useEffect(() => {
        if (isOpen) {
            // Reset all filters
            setStatusFilter("");
            setMunicipalityFilter("");
            setInitialsFilter("");

            // Populate from existing filters
            filters.forEach((filter) => {
                if (filter.type === "status") {
                    setStatusFilter(filter.value);
                } else if (filter.type === "municipality") {
                    setMunicipalityFilter(filter.value);
                } else if (filter.type === "initials") {
                    setInitialsFilter(filter.value);
                }
            });
        }
    }, [isOpen, filters]);

    const handleApply = () => {
        // Build array of active filters
        const activeFilters = [];
        if (statusFilter) {
            activeFilters.push({ type: "status", value: statusFilter });
        }
        if (municipalityFilter) {
            activeFilters.push({
                type: "municipality",
                value: municipalityFilter,
            });
        }
        if (initialsFilter) {
            activeFilters.push({ type: "initials", value: initialsFilter });
        }
        onApplyFilters(activeFilters);
        onClose();
    };

    const handleClear = () => {
        setStatusFilter("");
        setMunicipalityFilter("");
        setInitialsFilter("");
        onApplyFilters([]);
    };

    const handleRemoveFilter = (filterType) => {
        if (filterType === "status") {
            setStatusFilter("");
        } else if (filterType === "municipality") {
            setMunicipalityFilter("");
        } else if (filterType === "initials") {
            setInitialsFilter("");
        }
    };

    const activeFilterCount = [
        statusFilter,
        municipalityFilter,
        initialsFilter,
    ].filter(Boolean).length;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Apply Filters</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="sm" color="gray.600">
                            Select values for any combination of filters. All
                            selected filters are combined with AND logic.
                        </Text>

                        {/* Status Filter */}
                        <Box
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor="gray.200"
                        >
                            <FormControl>
                                <FormLabel fontWeight="medium">
                                    Status
                                </FormLabel>
                                <Select
                                    placeholder="Select status (optional)"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                >
                                    {(filterOptions.statuses || []).map(
                                        (value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        )
                                    )}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Municipality Filter */}
                        <Box
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor="gray.200"
                        >
                            <FormControl>
                                <FormLabel fontWeight="medium">
                                    Municipality
                                </FormLabel>
                                <Select
                                    placeholder="Select municipality (optional)"
                                    value={municipalityFilter}
                                    onChange={(e) =>
                                        setMunicipalityFilter(e.target.value)
                                    }
                                >
                                    {(filterOptions.municipalities || []).map(
                                        (value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        )
                                    )}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Initials Filter */}
                        <Box
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor="gray.200"
                        >
                            <FormControl>
                                <FormLabel fontWeight="medium">
                                    Initials
                                </FormLabel>
                                <Select
                                    placeholder="Select initials (optional)"
                                    value={initialsFilter}
                                    onChange={(e) =>
                                        setInitialsFilter(e.target.value)
                                    }
                                >
                                    {(filterOptions.initials || []).map(
                                        (value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        )
                                    )}
                                </Select>
                            </FormControl>
                        </Box>

                        {activeFilterCount > 0 && (
                            <Box mt={2}>
                                <Text fontSize="sm" fontWeight="medium" mb={2}>
                                    Active Filters ({activeFilterCount}):
                                </Text>
                                <HStack wrap="wrap" spacing={2}>
                                    {statusFilter && (
                                        <Badge
                                            as="button"
                                            colorScheme="gray"
                                            px={2}
                                            py={1}
                                            fontSize="xs"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                            cursor="pointer"
                                            onClick={() =>
                                                handleRemoveFilter("status")
                                            }
                                            transition="all 0.2s"
                                            _hover={{
                                                bg: "gray.400",
                                                color: "white",
                                            }}
                                            aria-label="Remove status filter"
                                        >
                                            status: {statusFilter}
                                            <CloseIcon w={2} h={2} ml={1} />
                                        </Badge>
                                    )}
                                    {municipalityFilter && (
                                        <Badge
                                            as="button"
                                            colorScheme="gray"
                                            px={2}
                                            py={1}
                                            fontSize="xs"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                            cursor="pointer"
                                            onClick={() =>
                                                handleRemoveFilter(
                                                    "municipality"
                                                )
                                            }
                                            transition="all 0.2s"
                                            _hover={{
                                                bg: "gray.400",
                                                color: "white",
                                            }}
                                            aria-label="Remove municipality filter"
                                        >
                                            municipality: {municipalityFilter}
                                            <CloseIcon w={2} h={2} ml={1} />
                                        </Badge>
                                    )}
                                    {initialsFilter && (
                                        <Badge
                                            as="button"
                                            colorScheme="gray"
                                            px={2}
                                            py={1}
                                            fontSize="xs"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                            cursor="pointer"
                                            onClick={() =>
                                                handleRemoveFilter("initials")
                                            }
                                            transition="all 0.2s"
                                            _hover={{
                                                bg: "gray.400",
                                                color: "white",
                                            }}
                                            aria-label="Remove initials filter"
                                        >
                                            initials: {initialsFilter}
                                            <CloseIcon w={2} h={2} ml={1} />
                                        </Badge>
                                    )}
                                </HStack>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={handleClear} mr={2}>
                        Clear All
                    </Button>
                    <Button variant="ghost" onClick={onClose} mr={2}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleApply}>
                        Apply Filters
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
