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
    ArrowForwardIcon,
    RepeatIcon,
} from "@chakra-ui/icons";
import AddModal from "./AddModal";
import PhotoDetailsModal from "./PhotoDetailsModal";
import FilterModal from "./FilterModal";
import FilterBar from "./components/FilterBar";
import CsvToJsonConverter from "./csvToJson";
import GeminiConverter from "./GeminiConverter";
import PhotoTable from "./components/PhotoTable";
import Pagination from "./components/Pagination";
import PageHeader from "./components/PageHeader";
import usePhotoActions from "./hooks/usePhotoActions";
import useBatchImport from "./hooks/useBatchImport";
import { apiUrl } from "./api";

export default function LabelingPage({ user }) {
    const [unclaimedData, setUnclaimedData] = useState([]);
    const [claimedData, setClaimedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unclaimedPage, setUnclaimedPage] = useState(1);
    const [claimedPage, setClaimedPage] = useState(1);
    const [skippedPage, setSkippedPage] = useState(1);
    const [unclaimedTotalPages, setUnclaimedTotalPages] = useState(1);
    const [claimedTotalPages, setClaimedTotalPages] = useState(1);
    const [skippedTotalPages, setSkippedTotalPages] = useState(1);
    const [unclaimedTotalCount, setUnclaimedTotalCount] = useState(0);
    const [claimedTotalCount, setClaimedTotalCount] = useState(0);
    const [skippedTotalCount, setSkippedTotalCount] = useState(0);
    const [skippedData, setSkippedData] = useState([]);
    const [sortOrder, setSortOrder] = useState("asc");
    const [unclaimedFilters, setUnclaimedFilters] = useState([]);
    const [claimedFilters, setClaimedFilters] = useState([{ type: "status", values: ["claimed"] }]);
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
    const {
        isOpen: isUnclaimedFilterOpen,
        onOpen: onUnclaimedFilterOpen,
        onClose: onUnclaimedFilterClose,
    } = useDisclosure();
    const {
        isOpen: isClaimedFilterOpen,
        onOpen: onClaimedFilterOpen,
        onClose: onClaimedFilterClose,
    } = useDisclosure();
    const [filterOptions, setFilterOptions] = useState({
        municipalities: [],
        initials: [],
        statuses: [],
    });
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(0);
    const [selectedPhotos, setSelectedPhotos] = useState([]);

    // Add file input reference
    const fileInputRef = React.useRef();

    const { handleClaimPhoto, handleBatchClaim, handleUnclaimPhoto, handleSkipPhoto, handleReclaimPhoto } = usePhotoActions({
        onRefreshUnclaimed: () => fetchUnclaimedData(unclaimedPage),
        onRefreshClaimed: () => fetchClaimedData(claimedPage),
        onRefreshSkipped: () => fetchSkippedData(skippedPage),
    });

    const { isImporting, handleBatchImport } = useBatchImport({
        onComplete: () => Promise.all([
            fetchUnclaimedData(unclaimedPage),
            fetchClaimedData(claimedPage),
            fetchSkippedData(skippedPage),
        ]),
    });

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await fetch(apiUrl("/api/batch/filter-options"));
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
            const queryParams = new URLSearchParams({ page, limit: 10, sortOrder });
            if (unclaimedFilters.length > 0) queryParams.set("filters", JSON.stringify(unclaimedFilters));

            const response = await fetch(
                `${apiUrl("/api/photos/unclaimed")}?${queryParams}`,
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
            const queryParams = new URLSearchParams({ page, limit: 10, sortOrder });
            if (claimedFilters.length > 0) queryParams.set("filters", JSON.stringify(claimedFilters));

            const response = await fetch(
                `${apiUrl("/api/photos/my-claimed")}?${queryParams}`,
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

    const fetchSkippedData = async (page) => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                sortOrder,
            });

            const response = await fetch(
                `${apiUrl("/api/photos/my-skipped")}?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch skipped data");

            const result = await response.json();
            setSkippedData(result.data);
            setSkippedTotalPages(result.pagination.totalPages);
            setSkippedTotalCount(result.pagination.total);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch skipped photos",
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
                fetchSkippedData(skippedPage),
            ]);
            setLoading(false);
        };
        fetchData();
    }, [unclaimedPage, claimedPage, skippedPage, sortOrder, unclaimedFilters, claimedFilters]);


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
        } else if (tab === 2 && skippedPage > 1) {
            setSkippedPage(skippedPage - 1);
        }
    };

    const handleNextPage = (tab) => {
        if (tab === 0 && unclaimedPage < unclaimedTotalPages) {
            setUnclaimedPage(unclaimedPage + 1);
        } else if (tab === 1 && claimedPage < claimedTotalPages) {
            setClaimedPage(claimedPage + 1);
        } else if (tab === 2 && skippedPage < skippedTotalPages) {
            setSkippedPage(skippedPage + 1);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        setUnclaimedPage(1);
        setClaimedPage(1);
        setSkippedPage(1);
    };

    const handleApplyUnclaimedFilters = (newFilters) => {
        setUnclaimedFilters(newFilters);
        setUnclaimedPage(1);
    };

    const handleRemoveUnclaimedFilter = (type, value) => {
        setUnclaimedFilters((prev) =>
            prev.map((f) => {
                if (f.type !== type) return f;
                const values = (f.values || []).filter((v) => v !== value);
                return values.length > 0 ? { ...f, values } : null;
            }).filter(Boolean)
        );
        setUnclaimedPage(1);
    };

    const handleApplyClaimedFilters = (newFilters) => {
        setClaimedFilters(newFilters);
        setClaimedPage(1);
    };

    const handleRemoveClaimedFilter = (type, value) => {
        setClaimedFilters((prev) =>
            prev.map((f) => {
                if (f.type !== type) return f;
                const values = (f.values || []).filter((v) => v !== value);
                return values.length > 0 ? { ...f, values } : null;
            }).filter(Boolean)
        );
        setClaimedPage(1);
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

                <Divider
                    orientation="vertical"
                    height="40px"
                    borderColor="gray.300"
                />

                {/* Gemini JSONL Converter */}
                <HStack spacing={2}>
                    <GeminiConverter size="sm" colorScheme="blue" />
                </HStack>
            </PageHeader>

            {/* Content Area */}
            <Tabs
                index={activeTab}
                onChange={setActiveTab}
                display="flex"
                flexDirection="column"
                flex={1}
                overflow="hidden"
            >
                <TabList
                    px={4}
                    pt={2}
                    flexShrink={0}
                    backgroundColor="rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(10px)"
                >
                    <Tab>Browse Unclaimed ({unclaimedTotalCount})</Tab>
                    <Tab>My Photos ({claimedTotalCount})</Tab>
                    <Tab>Skipped Phototos ({skippedTotalCount})</Tab>
                </TabList>

                <Box
                    flex={1}
                    overflowY="auto"
                    p={4}
                    backgroundColor="rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(10px)"
                    boxShadow="inset 0 4px 12px rgba(0, 0, 0, 0.05)"
                >

                <TabPanels>
                    {/* Browse Unclaimed Tab */}
                    <TabPanel>
                        <Flex justify="space-between" align="center" mb={4}>
                            <Text fontSize="md" color="gray.600">
                                {unclaimedTotalCount} unclaimed photos available
                            </Text>
                            <HStack spacing={2}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSelectAll}
                                    isDisabled={unclaimedData.length === 0}
                                >
                                    {selectedPhotos.length === unclaimedData.length
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    onClick={() => handleBatchClaim(selectedPhotos, () => setSelectedPhotos([]))}
                                    isDisabled={selectedPhotos.length === 0}
                                >
                                    Claim Selected ({selectedPhotos.length})
                                </Button>
                            </HStack>
                        </Flex>

                        <Box mb={4}>
                            <FilterBar
                                filters={unclaimedFilters}
                                onOpenModal={onUnclaimedFilterOpen}
                                onRemoveFilter={handleRemoveUnclaimedFilter}
                            />
                        </Box>

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
                        </Text>

                        <Box mb={4}>
                            <FilterBar
                                filters={claimedFilters}
                                onOpenModal={onClaimedFilterOpen}
                                onRemoveFilter={handleRemoveClaimedFilter}
                            />
                        </Box>

                        <PhotoTable
                            data={claimedData}
                            sortOrder={sortOrder}
                            onSortToggle={toggleSortOrder}
                            onRowClick={(photo) => handleEditPhoto(photo)}
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
                                    <Tooltip label="Skip photo">
                                        <IconButton
                                            icon={<ArrowForwardIcon />}
                                            colorScheme="yellow"
                                            size="sm"
                                            ml={2}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSkipPhoto(item._id);
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
                    {/* Skipped Tab */}
                    <TabPanel>
                        <Text fontSize="md" color="gray.600" mb={4}>
                            {skippedTotalCount} skipped phototos
                        </Text>

                        <PhotoTable
                            data={skippedData}
                            sortOrder={sortOrder}
                            onSortToggle={toggleSortOrder}
                            onRowClick={handleViewPhoto}
                            showInitials={false}
                            actionButtons={(item) => (
                                <Tooltip label="Claim this photo for yourself">
                                    <IconButton
                                        icon={<RepeatIcon />}
                                        colorScheme="green"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReclaimPhoto(item._id);
                                        }}
                                    />
                                </Tooltip>
                            )}
                            showActions={true}
                        />

                        <Pagination
                            currentPage={skippedPage}
                            totalPages={skippedTotalPages}
                            onPrevious={() => handlePreviousPage(2)}
                            onNext={() => handleNextPage(2)}
                        />
                    </TabPanel>
                </TabPanels>

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
                <FilterModal
                    isOpen={isUnclaimedFilterOpen}
                    onClose={onUnclaimedFilterClose}
                    filters={unclaimedFilters}
                    onApplyFilters={handleApplyUnclaimedFilters}
                    filterOptions={filterOptions}
                    fields={["municipality", "initials"]}
                />
                <FilterModal
                    isOpen={isClaimedFilterOpen}
                    onClose={onClaimedFilterClose}
                    filters={claimedFilters}
                    onApplyFilters={handleApplyClaimedFilters}
                    filterOptions={filterOptions}
                    fields={["municipality", "status"]}
                />
                </Box>
            </Tabs>
        </VStack>
    );
}
