import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Flex,
    Text,
    Spinner,
    useToast,
    Select,
    HStack,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    Progress,
    VStack,
    Input,
    InputGroup,
    InputLeftElement,
} from "@chakra-ui/react";
import { AttachmentIcon, SearchIcon } from "@chakra-ui/icons";
import PhotoDetailsModal from "./PhotoDetailsModal";
import PhotoTable from "./components/PhotoTable";
import Pagination from "./components/Pagination";

const API_URL = process.env.REACT_APP_API_URL;

const FILTER_TYPES = [
    { value: "status", label: "Status" },
    { value: "municipality", label: "Municipality" },
    { value: "initials", label: "Initials" },
];

export default function TableView({ onOpen }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortOrder, setSortOrder] = useState("asc");
    const [filterType, setFilterType] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const {
        isOpen: isModalOpen,
        onOpen: onModalOpen,
        onClose: onModalClose,
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
    }, []);

    const fetchData = async (page) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page,
                limit: 20,
                sortOrder,
                ...(filterType && filterValue && { filterType, filterValue }),
                ...(searchTerm && { search: searchTerm }),
            });

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
    }, [currentPage, sortOrder, filterType, filterValue, searchTerm]);

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

    const handleFilterTypeChange = (e) => {
        setFilterType(e.target.value);
        setFilterValue("");
        setCurrentPage(1);
    };

    const handleFilterValueChange = (e) => {
        setFilterValue(e.target.value);
        setCurrentPage(1);
    };

    const getFilterOptions = () => {
        switch (filterType) {
            case "municipality":
                return filterOptions.municipalities;
            case "initials":
                return filterOptions.initials;
            case "status":
                return filterOptions.statuses;
            default:
                return [];
        }
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

    if (loading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        <Box p={4}>
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

            <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="2xl">Photo Table View</Text>
            </Flex>

            <Text fontSize="md" color="gray.600" mb={4}>
                {totalCount} {totalCount === 1 ? "photo" : "photos"} found
                {filterType &&
                    filterValue &&
                    ` with ${filterType} "${filterValue}"`}
                {searchTerm && ` matching "${searchTerm}"`}
            </Text>

            <VStack spacing={4} mb={4} align="stretch">
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

                <HStack spacing={4}>
                    <Select
                        placeholder="Filter by"
                        value={filterType}
                        onChange={handleFilterTypeChange}
                        width="200px"
                    >
                        {FILTER_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Select>
                    {filterType && (
                        <Select
                            placeholder="Select value"
                            value={filterValue}
                            onChange={handleFilterValueChange}
                            width="200px"
                        >
                            {getFilterOptions().map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </Select>
                    )}
                </HStack>
            </VStack>

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

            <PhotoDetailsModal
                isOpen={isModalOpen}
                onClose={onModalClose}
                photo={selectedPhoto}
            />
        </Box>
    );
}
