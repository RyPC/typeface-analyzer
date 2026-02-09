import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Flex,
    Text,
    Spinner,
    useToast,
    HStack,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    VStack,
    Input,
    InputGroup,
    InputLeftElement,
    Badge,
    Divider,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import PhotoDetailsModal from "./PhotoDetailsModal";
import PhotoTable from "./components/PhotoTable";
import Pagination from "./components/Pagination";
import FilterModal from "./FilterModal";
import PageHeader from "./components/PageHeader";

const API_URL = process.env.REACT_APP_API_URL;

export default function TableView({ onOpen }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortOrder, setSortOrder] = useState("asc");
    const [filters, setFilters] = useState([]); // Array of {type, value} objects
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const {
        isOpen: isModalOpen,
        onOpen: onModalOpen,
        onClose: onModalClose,
    } = useDisclosure();
    const {
        isOpen: isFilterModalOpen,
        onOpen: onFilterModalOpen,
        onClose: onFilterModalClose,
    } = useDisclosure();
    const [filterOptions, setFilterOptions] = useState({
        municipalities: [],
        initials: [],
        statuses: [],
    });
    const toast = useToast();
    const [isImporting, setIsImporting] = useState(false);

    // Add file input reference
    const fileInputRef = React.useRef();

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await fetch(`${API_URL}/api/filter-options`);
                if (!response.ok)
                    throw new Error("Failed to fetch filter options");
                const options = await response.json();
                setFilterOptions(options);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch filter options",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        };

        fetchFilterOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchData = async (page) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page,
                limit: 20,
                sortOrder,
                ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
            });

            // Add filters as JSON-encoded string
            if (filters.length > 0) {
                const activeFilters = filters.filter((f) => f.type && f.value);
                if (activeFilters.length > 0) {
                    queryParams.append(
                        "filters",
                        JSON.stringify(activeFilters)
                    );
                }
            }

            const response = await fetch(
                `${API_URL}/api/table-data?${queryParams}`
            );
            if (!response.ok) throw new Error("Failed to fetch data");

            const result = await response.json();
            setData(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotalCount(result.pagination.total);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch data",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, sortOrder, filters, debouncedSearchTerm]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleRemoveFilter = (filterToRemove) => {
        const newFilters = filters.filter(
            (f) =>
                !(
                    f.type === filterToRemove.type &&
                    f.value === filterToRemove.value
                )
        );
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleRowClick = (photo) => {
        setSelectedPhoto(photo);
        onModalOpen();
    };

    const handleBatchImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);

        try {
            // Create FormData and append the file
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${API_URL}/api/batch-import`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to import batch");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let successCount = 0;
            let errorCount = 0;
            let processedCount = 0;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter((line) => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.type === "progress") {
                            const batchResults = data.results;
                            successCount += batchResults.filter(
                                (r) => r.success
                            ).length;
                            errorCount += batchResults.filter(
                                (r) => !r.success
                            ).length;
                        } else if (data.type === "complete") {
                            // Final results
                            successCount = data.results.filter(
                                (r) => r.success
                            ).length;
                            errorCount = data.results.filter(
                                (r) => !r.success
                            ).length;

                            toast({
                                title: "Batch Import Complete",
                                description: `Successfully imported ${successCount} photos. ${errorCount} failed.`,
                                status: successCount > 0 ? "success" : "error",
                                duration: 5000,
                                isClosable: true,
                            });

                            // Refresh the table data
                            fetchData(currentPage);
                        }
                    } catch (error) {
                        console.error("Error parsing response chunk:", error);
                    }
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to import batch: " + error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsImporting(false);
        }

        // Reset the file input
        event.target.value = "";
    };

    return (
        <VStack align="stretch" w="full" h="100%" spacing={0} overflow="hidden">
            {/* Import Progress Modal */}
            <Modal
                isOpen={isImporting}
                onClose={() => {}}
                closeOnOverlayClick={false}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalBody p={6}>
                        <VStack spacing={4}>
                            <Text fontSize="xl" fontWeight="bold">
                                Importing Photos
                            </Text>
                            <Spinner size="xl" />
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Top Bar */}
            <PageHeader title="Photo Table View">
                {/* Search Input */}
                <Box flex={1} minW="250px">
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search photos by ID, municipality, initials..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </InputGroup>
                </Box>

                <Divider
                    orientation="vertical"
                    height="40px"
                    borderColor="gray.300"
                />

                {/* Filter Button */}
                <HStack spacing={2}>
                    <Button
                        onClick={onFilterModalOpen}
                        size="sm"
                        variant={filters.length > 0 ? "solid" : "outline"}
                        colorScheme={filters.length > 0 ? "blue" : "gray"}
                    >
                        Filters
                        {filters.length > 0 && (
                            <Badge ml={2} colorScheme="gray">
                                {filters.length}
                            </Badge>
                        )}
                    </Button>
                </HStack>

                {/* Active Filter Badges */}
                {filters.length > 0 && (
                    <>
                        <Divider
                            orientation="vertical"
                            height="40px"
                            borderColor="gray.300"
                        />
                        <HStack wrap="wrap" spacing={2}>
                            {filters.map((filter, index) => (
                                <Badge
                                    key={index}
                                    as="button"
                                    colorScheme="gray"
                                    px={2}
                                    py={1}
                                    fontSize="xs"
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    cursor="pointer"
                                    onClick={() => handleRemoveFilter(filter)}
                                    transition="all 0.2s"
                                    _hover={{
                                        bg: "gray.400",
                                        color: "white",
                                    }}
                                    aria-label={`Remove ${filter.type} filter`}
                                >
                                    {filter.type}: {filter.value}
                                    <CloseIcon w={2} h={2} ml={1} />
                                </Badge>
                            ))}
                        </HStack>
                    </>
                )}
            </PageHeader>

            {/* Content Area */}
            <Box
                flex={1}
                overflowY="auto"
                p={4}
                backgroundColor="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                boxShadow="inset 0 4px 12px rgba(0, 0, 0, 0.05)"
            >
                {loading ? (
                    <Flex justify="center" align="center" h="400px">
                        <Spinner size="xl" />
                    </Flex>
                ) : (
                    <>
                        <Text fontSize="md" color="gray.600" mb={4}>
                            {totalCount} {totalCount === 1 ? "photo" : "photos"} found
                            {filters.length > 0 &&
                                ` with ${filters.length} filter${
                                    filters.length !== 1 ? "s" : ""
                                } applied`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </Text>

                        <PhotoTable
                            data={data}
                            sortOrder={sortOrder}
                            onSortToggle={toggleSortOrder}
                            onRowClick={handleRowClick}
                            showActions={false}
                        />

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrevious={handlePreviousPage}
                            onNext={handleNextPage}
                        />
                    </>
                )}

            <PhotoDetailsModal
                isOpen={isModalOpen}
                onClose={onModalClose}
                photo={selectedPhoto}
            />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={onFilterModalClose}
                filters={filters}
                onApplyFilters={handleApplyFilters}
                filterOptions={filterOptions}
            />
            </Box>
        </VStack>
    );
}
