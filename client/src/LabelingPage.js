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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    IconButton,
    Tooltip,
    Divider,
} from "@chakra-ui/react";
import {
    AttachmentIcon,
    EditIcon,
    CheckIcon,
} from "@chakra-ui/icons";
import AddModal from "./AddModal";
import PhotoDetailsModal from "./PhotoDetailsModal";
import CsvToJsonConverter from "./csvToJson";
import PhotoTable from "./components/PhotoTable";
import Pagination from "./components/Pagination";
import PageHeader from "./components/PageHeader";

const API_URL = process.env.REACT_APP_API_URL;

const FILTER_TYPES = [
    { value: "municipality", label: "Municipality" },
    { value: "initials", label: "Initials" },
];

const MY_PHOTOS_FILTER_TYPES = [
    { value: "municipality", label: "Municipality" },
    { value: "status", label: "Status" },
];

export default function LabelingPage({ user }) {
    const [unclaimedData, setUnclaimedData] = useState([]);
    const [claimedData, setClaimedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unclaimedPage, setUnclaimedPage] = useState(1);
    const [claimedPage, setClaimedPage] = useState(1);
    const [unclaimedTotalPages, setUnclaimedTotalPages] = useState(1);
    const [claimedTotalPages, setClaimedTotalPages] = useState(1);
    const [unclaimedTotalCount, setUnclaimedTotalCount] = useState(0);
    const [claimedTotalCount, setClaimedTotalCount] = useState(0);
    const [sortOrder, setSortOrder] = useState("asc");
    const [filterType, setFilterType] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewPhoto, setViewPhoto] = useState(null);
    const {
        isOpen: isModalOpen,
        onOpen: onModalOpen,
        onClose: onModalClose,
    } = useDisclosure();
    const {
        isOpen: isViewModalOpen,
        onOpen: onViewModalOpen,
        onClose: onViewModalClose,
    } = useDisclosure();
    const [filterOptions, setFilterOptions] = useState({
        municipalities: [],
        initials: [],
        statuses: [],
    });
    const toast = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedPhotos, setSelectedPhotos] = useState([]);

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

    const fetchUnclaimedData = async (page) => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                sortOrder,
                ...(filterType && filterValue && { filterType, filterValue }),
            });

            const response = await fetch(
                `${API_URL}/api/photos/unclaimed?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch unclaimed data");

            const result = await response.json();
            setUnclaimedData(result.data);
            setUnclaimedTotalPages(result.pagination.totalPages);
            setUnclaimedTotalCount(result.pagination.total);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch unclaimed photos",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const fetchClaimedData = async (page) => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                sortOrder,
                ...(filterType && filterValue && { filterType, filterValue }),
            });

            const response = await fetch(
                `${API_URL}/api/photos/my-claimed?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch claimed data");

            const result = await response.json();
            setClaimedData(result.data);
            setClaimedTotalPages(result.pagination.totalPages);
            setClaimedTotalCount(result.pagination.total);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch your claimed photos",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([
                fetchUnclaimedData(unclaimedPage),
                fetchClaimedData(claimedPage),
            ]);
            setLoading(false);
        };
        fetchData();
    }, [unclaimedPage, claimedPage, sortOrder, filterType, filterValue]);

    const handleClaimPhoto = async (photoId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/photos/${photoId}/claim`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to claim photo");
            }

            toast({
                title: "Success",
                description: "Photo claimed successfully!",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Refresh both tabs
            await Promise.all([
                fetchUnclaimedData(unclaimedPage),
                fetchClaimedData(claimedPage),
            ]);
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleBatchClaim = async () => {
        if (selectedPhotos.length === 0) {
            toast({
                title: "No Selection",
                description: "Please select photos to claim",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/photos/batch-claim`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ photoIds: selectedPhotos }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || "Failed to batch claim photos"
                );
            }

            const result = await response.json();
            toast({
                title: "Success",
                description: result.message,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            // Clear selection and refresh both tabs
            setSelectedPhotos([]);
            await Promise.all([
                fetchUnclaimedData(unclaimedPage),
                fetchClaimedData(claimedPage),
            ]);
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUnclaimPhoto = async (photoId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/photos/${photoId}/unclaim`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to unclaim photo");
            }

            toast({
                title: "Released",
                description: "Photo returned to unclaimed pool",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await Promise.all([
                fetchUnclaimedData(unclaimedPage),
                fetchClaimedData(claimedPage),
            ]);
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleSelectPhoto = (photoId) => {
        setSelectedPhotos((prev) =>
            prev.includes(photoId)
                ? prev.filter((id) => id !== photoId)
                : [...prev, photoId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPhotos.length === unclaimedData.length) {
            setSelectedPhotos([]);
        } else {
            setSelectedPhotos(unclaimedData.map((photo) => photo._id));
        }
    };

    const handleEditPhoto = (photo, e) => {
        if (e) {
            e.stopPropagation(); // Prevent row click from firing
        }
        setSelectedPhoto(photo);
        setIsEditMode(true);
        onModalOpen();
    };

    const handleViewPhoto = (photo) => {
        setViewPhoto(photo);
        onViewModalOpen();
    };

    const handlePreviousPage = (tab) => {
        if (tab === 0 && unclaimedPage > 1) {
            setUnclaimedPage(unclaimedPage - 1);
        } else if (tab === 1 && claimedPage > 1) {
            setClaimedPage(claimedPage - 1);
        }
    };

    const handleNextPage = (tab) => {
        if (tab === 0 && unclaimedPage < unclaimedTotalPages) {
            setUnclaimedPage(unclaimedPage + 1);
        } else if (tab === 1 && claimedPage < claimedTotalPages) {
            setClaimedPage(claimedPage + 1);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    };

    const handleFilterTypeChange = (e) => {
        setFilterType(e.target.value);
        setFilterValue("");
        setUnclaimedPage(1);
        setClaimedPage(1);
    };

    const handleFilterValueChange = (e) => {
        setFilterValue(e.target.value);
        setUnclaimedPage(1);
        setClaimedPage(1);
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

                            // Refresh both tabs
                            await Promise.all([
                                fetchUnclaimedData(unclaimedPage),
                                fetchClaimedData(claimedPage),
                            ]);
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
            <PageHeader title="Photo Labeling">
                {/* Import Batch Button */}
                <HStack spacing={2}>
                    <input
                        type="file"
                        accept=".jsonl"
                        onChange={handleBatchImport}
                        style={{ display: "none" }}
                        ref={fileInputRef}
                    />
                    <Button
                        leftIcon={<AttachmentIcon />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => fileInputRef.current.click()}
                    >
                        Import Batch
                    </Button>
                </HStack>

                <Divider
                    orientation="vertical"
                    height="40px"
                    borderColor="gray.300"
                />

                {/* CSV Converter */}
                <HStack spacing={2}>
                    <CsvToJsonConverter 
                        size="sm"
                        colorScheme="blue"
                    />
                </HStack>
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

            <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                    <Tab>Browse Unclaimed ({unclaimedTotalCount})</Tab>
                    <Tab>My Photos ({claimedTotalCount})</Tab>
                </TabList>

                <TabPanels>
                    {/* Browse Unclaimed Tab */}
                    <TabPanel>
                        <Flex justify="space-between" align="center" mb={4}>
                            <Text fontSize="md" color="gray.600">
                                {unclaimedTotalCount} unclaimed photos available
                                {filterType &&
                                    filterValue &&
                                    ` with ${filterType} "${filterValue}"`}
                            </Text>
                            <HStack spacing={2}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSelectAll}
                                    isDisabled={unclaimedData.length === 0}
                                >
                                    {selectedPhotos.length ===
                                    unclaimedData.length
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    onClick={handleBatchClaim}
                                    isDisabled={selectedPhotos.length === 0}
                                >
                                    Claim Selected ({selectedPhotos.length})
                                </Button>
                            </HStack>
                        </Flex>

                        <HStack spacing={4} mb={4}>
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

                        <PhotoTable
                            data={unclaimedData}
                            sortOrder={sortOrder}
                            onSortToggle={toggleSortOrder}
                            onRowClick={handleViewPhoto}
                            actionButtons={(item) => (
                                <Tooltip label="Claim this photo">
                                    <IconButton
                                        icon={<CheckIcon />}
                                        colorScheme="green"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClaimPhoto(item._id);
                                        }}
                                    />
                                </Tooltip>
                            )}
                            showActions={true}
                        />

                        <Pagination
                            currentPage={unclaimedPage}
                            totalPages={unclaimedTotalPages}
                            onPrevious={() => handlePreviousPage(0)}
                            onNext={() => handleNextPage(0)}
                        />
                    </TabPanel>

                    {/* My Photos Tab */}
                    <TabPanel>
                        <Text fontSize="md" color="gray.600" mb={4}>
                            {claimedTotalCount} photos claimed by you
                            {filterType &&
                                filterValue &&
                                ` with ${filterType} "${filterValue}"`}
                        </Text>

                        <HStack spacing={4} mb={4}>
                            <Select
                                placeholder="Filter by"
                                value={filterType}
                                onChange={handleFilterTypeChange}
                                width="200px"
                            >
                                {MY_PHOTOS_FILTER_TYPES.map((type) => (
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

                        <PhotoTable
                            data={claimedData}
                            sortOrder={sortOrder}
                            onSortToggle={toggleSortOrder}
                            onRowClick={handleViewPhoto}
                            actionButtons={(item) => (
                                <>
                                    <Tooltip label="Edit/Label this photo">
                                        <IconButton
                                            icon={<EditIcon />}
                                            colorScheme="blue"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditPhoto(item, e);
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip label="Release this photo (unclaim)">
                                        <Button
                                            ml={2}
                                            colorScheme="red"
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnclaimPhoto(item._id);
                                            }}
                                        >
                                            Give Up
                                        </Button>
                                    </Tooltip>
                                </>
                            )}
                            showActions={true}
                        />

                        <Pagination
                            currentPage={claimedPage}
                            totalPages={claimedTotalPages}
                            onPrevious={() => handlePreviousPage(1)}
                            onNext={() => handleNextPage(1)}
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <AddModal
                isOpen={isModalOpen}
                onClose={onModalClose}
                isEditMode={isEditMode}
                selectedPhoto={selectedPhoto}
                onPhotoUpdated={() => {
                    fetchClaimedData(claimedPage);
                    fetchUnclaimedData(unclaimedPage);
                }}
            />
            <PhotoDetailsModal
                isOpen={isViewModalOpen}
                onClose={onViewModalClose}
                photo={viewPhoto}
            />
            </Box>
        </VStack>
    );
}
