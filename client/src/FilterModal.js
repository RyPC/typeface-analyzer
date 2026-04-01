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
    FormLabel,
    Checkbox,
    CheckboxGroup,
    Badge,
    Text,
    Box,
    Divider,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

export default function FilterModal({
    isOpen,
    onClose,
    filters,
    onApplyFilters,
    filterOptions,
}) {
    const [statusFilters, setStatusFilters] = useState([]);
    const [municipalityFilters, setMunicipalityFilters] = useState([]);
    const [initialsFilters, setInitialsFilters] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setStatusFilters([]);
            setMunicipalityFilters([]);
            setInitialsFilters([]);

            filters.forEach((filter) => {
                const vals = filter.values || (filter.value ? [filter.value] : []);
                if (filter.type === "status") setStatusFilters(vals);
                else if (filter.type === "municipality") setMunicipalityFilters(vals);
                else if (filter.type === "initials") setInitialsFilters(vals);
            });
        }
    }, [isOpen, filters]);

    const handleApply = () => {
        const activeFilters = [];
        if (statusFilters.length > 0)
            activeFilters.push({ type: "status", values: statusFilters });
        if (municipalityFilters.length > 0)
            activeFilters.push({ type: "municipality", values: municipalityFilters });
        if (initialsFilters.length > 0)
            activeFilters.push({ type: "initials", values: initialsFilters });
        onApplyFilters(activeFilters);
        onClose();
    };

    const handleClear = () => {
        setStatusFilters([]);
        setMunicipalityFilters([]);
        setInitialsFilters([]);
        onApplyFilters([]);
    };

    const handleRemoveValue = (filterType, value) => {
        if (filterType === "status")
            setStatusFilters((prev) => prev.filter((v) => v !== value));
        else if (filterType === "municipality")
            setMunicipalityFilters((prev) => prev.filter((v) => v !== value));
        else if (filterType === "initials")
            setInitialsFilters((prev) => prev.filter((v) => v !== value));
    };

    const activeFilterCount =
        statusFilters.length + municipalityFilters.length + initialsFilters.length;

    const allActiveBadges = [
        ...statusFilters.map((v) => ({ type: "status", value: v })),
        ...municipalityFilters.map((v) => ({ type: "municipality", value: v })),
        ...initialsFilters.map((v) => ({ type: "initials", value: v })),
    ];

    const CheckboxSection = ({ label, options, value, onChange }) => (
        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200">
            <FormLabel fontWeight="medium" mb={2}>
                {label}
            </FormLabel>
            <Box maxH="130px" overflowY="auto">
                <CheckboxGroup value={value} onChange={onChange}>
                    <VStack align="start" spacing={1}>
                        {(options || []).map((opt) => (
                            <Checkbox key={opt} value={opt}>
                                <Text fontSize="sm">{opt}</Text>
                            </Checkbox>
                        ))}
                    </VStack>
                </CheckboxGroup>
            </Box>
        </Box>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Apply Filters</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="sm" color="gray.600">
                            Select one or more values per field. All selected
                            filters are combined with AND logic; multiple values
                            within a field use OR logic.
                        </Text>

                        <CheckboxSection
                            label="Status"
                            options={filterOptions.statuses}
                            value={statusFilters}
                            onChange={setStatusFilters}
                        />

                        <CheckboxSection
                            label="Municipality"
                            options={filterOptions.municipalities}
                            value={municipalityFilters}
                            onChange={setMunicipalityFilters}
                        />

                        <CheckboxSection
                            label="Initials"
                            options={filterOptions.initials}
                            value={initialsFilters}
                            onChange={setInitialsFilters}
                        />

                        {activeFilterCount > 0 && (
                            <Box mt={2}>
                                <Text fontSize="sm" fontWeight="medium" mb={2}>
                                    Active Filters ({activeFilterCount}):
                                </Text>
                                <HStack wrap="wrap" spacing={2}>
                                    {allActiveBadges.map(({ type, value }) => (
                                        <Badge
                                            key={`${type}-${value}`}
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
                                                handleRemoveValue(type, value)
                                            }
                                            transition="all 0.2s"
                                            _hover={{
                                                bg: "gray.400",
                                                color: "white",
                                            }}
                                            aria-label={`Remove ${type}: ${value} filter`}
                                        >
                                            {type}: {value}
                                            <CloseIcon w={2} h={2} ml={1} />
                                        </Badge>
                                    ))}
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
