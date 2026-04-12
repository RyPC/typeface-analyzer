import {
    Alert,
    AlertIcon,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Box,
    Button,
    Center,
    Divider,
    FormControl,
    FormLabel,
    HStack,
    Image,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Text,
    VStack,
    Badge,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import React, { useState, useEffect } from "react";
import ImageFullscreenViewer from "./ImageFullscreenViewer";
import TypefaceForm, { normalizeMessageFunction } from "./components/TypefaceForm";
import SubstrateSection from "./components/SubstrateSection";
import { apiUrl } from "./api";

export default function AddModal({
    isOpen,
    onClose,
    isEditMode = false,
    selectedPhoto = null,
    onPhotoUpdated,
}) {
    const toast = useToast();
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [municipality, setMunicipality] = useState("");
    const [municipalities, setMunicipalities] = useState([]);
    const {
        isOpen: isFinishOpen,
        onOpen: onFinishOpen,
        onClose: onFinishClose,
    } = useDisclosure();
    const {
        isOpen: isImageViewerOpen,
        onOpen: onImageViewerOpen,
        onClose: onImageViewerClose,
    } = useDisclosure();
    const {
        isOpen: isUnsavedOpen,
        onOpen: onUnsavedOpen,
        onClose: onUnsavedClose,
    } = useDisclosure();
    const cancelRef = React.useRef();

    // Changed to support multiple substrates
    const [substrates, setSubstrates] = useState([
        {
            placement: "",
            additionalNotes: "",
            trueSign: false,
            confidence: "",
            confidenceReasoning: "",
            additionalInfo: "",
            typefaces: [],
        },
    ]);

    // Track which typeface is being edited (substrateIndex, typefaceIndex)
    const [editingTypeface, setEditingTypeface] = useState(null);

    // Store current typeface form data for each substrate
    const [typefaceForms, setTypefaceForms] = useState({});

    // Fetch municipalities when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchMunicipalities = async () => {
                try {
                    const response = await fetch(
                        apiUrl("/api/stats/municipalities")
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch municipalities");
                    }
                    const data = await response.json();
                    // Filter out "Unknown" from the list
                    const filteredMunicipalities = data.filter(
                        (m) => m && m !== "Unknown"
                    );
                    setMunicipalities(filteredMunicipalities);
                } catch (error) {
                    console.error("Error fetching municipalities:", error);
                    setError("Failed to load municipalities");
                }
            };
            fetchMunicipalities();
        }
    }, [isOpen]);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedPhoto) {
                // Set municipality from selected photo
                setMunicipality(selectedPhoto.municipality || "");

                // Pre-populate form with all substrates from existing photo data
                if (
                    selectedPhoto.substrates &&
                    selectedPhoto.substrates.length > 0
                ) {
                    const loadedSubstrates = selectedPhoto.substrates.map(
                        (substrate) => ({
                            placement: substrate.placement || "",
                            additionalNotes: substrate.additionalNotes || "",
                            trueSign: !substrate.thisIsntReallyASign,
                            confidence: substrate.confidence || "",
                            confidenceReasoning:
                                substrate.confidenceReasoning || "",
                            additionalInfo: substrate.additionalInfo || "",
                            typefaces: (substrate.typefaces || []).map(
                                (tf) => ({
                                    typefaceStyle: tf.typefaceStyle || [],
                                    text: tf.copy || "",
                                    letteringOntology:
                                        tf.letteringOntology || [],
                                    messageFunction: normalizeMessageFunction(
                                        tf.messageFunction
                                    ),
                                    covidRelated: tf.covidRelated || false,
                                    additionalNotes: tf.additionalNotes || "",
                                })
                            ),
                        })
                    );
                    setSubstrates(loadedSubstrates);
                    // Initialize typeface forms for all existing typefaces
                    const initialTypefaceForms = {};
                    loadedSubstrates.forEach((substrate, sIdx) => {
                        substrate.typefaces.forEach((tf, tIdx) => {
                            const key = `${sIdx}-${tIdx}`;
                            initialTypefaceForms[key] = {
                                typefaceStyle: tf.typefaceStyle || [],
                                text: tf.text || "",
                                letteringOntology: tf.letteringOntology || [],
                                messageFunction: normalizeMessageFunction(
                                    tf.messageFunction
                                ),
                                covidRelated: tf.covidRelated || false,
                                additionalNotes: tf.additionalNotes || "",
                            };
                        });
                    });
                    setTypefaceForms(initialTypefaceForms);
                } else {
                    // Initialize with one empty substrate if none exist
                    setSubstrates([
                        {
                            placement: "",
                            additionalNotes: "",
                            trueSign: false,
                            confidence: "",
                            confidenceReasoning: "",
                            additionalInfo: "",
                            typefaces: [],
                        },
                    ]);
                }

                // Always set photo preview and photo object for edit mode
                // This ensures we skip the upload step and go directly to the form
                // Always construct S3 URL from custom_id
                const s3Url = `https://typeface-s3-photo-bucket.s3.us-west-1.amazonaws.com/Font+Census+Data/${selectedPhoto.custom_id}`;
                setPhotoPreview(s3Url);
                setPhoto({ name: selectedPhoto.custom_id || "photo.jpg" });
            } else {
                // For new photo mode, reset municipality and fetch from batch data
                setMunicipality("");
                fetchNextPhoto();
            }
        }
    }, [isOpen, isEditMode, selectedPhoto]);

    const fetchNextPhoto = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(apiUrl("/api/batch/next"));
            if (!response.ok) {
                throw new Error("Failed to fetch photo data");
            }
            const data = await response.json();

            // Set the photo and form data from the response
            if (data.imageUrl) {
                setPhotoPreview(data.imageUrl);
                setPhoto({ name: "batch-image.jpg" }); // Dummy file object
            }

            // Pre-fill form data if available
            if (data.formData) {
                // Handle batch data - it might have substrates array or single substrate
                if (
                    data.formData.substrates &&
                    Array.isArray(data.formData.substrates)
                ) {
                    const loadedSubstrates = data.formData.substrates.map(
                        (substrate) => ({
                            placement: substrate.placement || "",
                            additionalNotes: substrate.additionalNotes || "",
                            trueSign: substrate.trueSign !== false,
                            confidence: substrate.confidence || "",
                            confidenceReasoning:
                                substrate.confidenceReasoning || "",
                            additionalInfo: substrate.additionalInfo || "",
                            typefaces: (substrate.typefaces || []).map(
                                (tf) => ({
                                    typefaceStyle: tf.typefaceStyle || [],
                                    text: tf.text || tf.copy || "",
                                    letteringOntology:
                                        tf.letteringOntology || [],
                                    messageFunction: normalizeMessageFunction(
                                        tf.messageFunction
                                    ),
                                    covidRelated: tf.covidRelated || false,
                                    additionalNotes: tf.additionalNotes || "",
                                })
                            ),
                        })
                    );
                    setSubstrates(
                        loadedSubstrates.length > 0
                            ? loadedSubstrates
                            : [
                                  {
                                      placement: "",
                                      additionalNotes: "",
                                      trueSign: false,
                                      confidence: "",
                                      confidenceReasoning: "",
                                      additionalInfo: "",
                                      typefaces: [],
                                  },
                              ]
                    );
                } else {
                    // Legacy single substrate format
                    setSubstrates([
                        {
                            placement: data.formData.placement || "",
                            additionalNotes:
                                data.formData.additionalNotes || "",
                            trueSign: data.formData.trueSign || false,
                            confidence: data.formData.confidence || "",
                            confidenceReasoning:
                                data.formData.confidenceReasoning || "",
                            additionalInfo: data.formData.additionalInfo || "",
                            typefaces: (data.formData.typefaces || []).map(
                                (tf) => ({
                                    typefaceStyle: tf.typefaceStyle || [],
                                    text: tf.text || "",
                                    letteringOntology:
                                        tf.letteringOntology || [],
                                    messageFunction: normalizeMessageFunction(
                                        tf.messageFunction
                                    ),
                                    covidRelated: tf.covidRelated || false,
                                    additionalNotes: tf.additionalNotes || "",
                                })
                            ),
                        },
                    ]);
                }
            }
        } catch (err) {
            setError(err.message);
            console.error("Error fetching photo:", err);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        resetForm();
        onClose();
    };

    const handleCloseRequest = () => {
        if (isEditMode) {
            onUnsavedOpen();
        } else {
            closeModal();
        }
    };

    const resetForm = () => {
        setSubstrates([
            {
                placement: "",
                additionalNotes: "",
                trueSign: false,
                confidence: "",
                confidenceReasoning: "",
                additionalInfo: "",
                typefaces: [],
            },
        ]);
        setEditingTypeface(null);
        setTypefaceForms({});
        setPhoto(null);
        setPhotoPreview(null);
        setMunicipality("");
    };

    const handlePhotoUpload = (e) => {
        setPhoto(e.target.files[0]);
        setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    };

    const handleAddSubstrate = () => {
        setSubstrates([
            ...substrates,
            {
                placement: "",
                additionalNotes: "",
                trueSign: false,
                confidence: "",
                confidenceReasoning: "",
                additionalInfo: "",
                typefaces: [],
            },
        ]);
    };

    const handleRemoveSubstrate = (index) => {
        if (substrates.length > 1) {
            const newSubstrates = substrates.filter((_, i) => i !== index);
            setSubstrates(newSubstrates);

            // Clear editing state if we're editing a typeface in the removed substrate
            if (editingTypeface && editingTypeface.substrateIndex === index) {
                setEditingTypeface(null);
                setTypefaceForms({});
            } else if (
                editingTypeface &&
                editingTypeface.substrateIndex > index
            ) {
                // Adjust editing index if substrate was removed before it
                setEditingTypeface({
                    ...editingTypeface,
                    substrateIndex: editingTypeface.substrateIndex - 1,
                });
            }

            // Clear typeface forms for removed substrate
            const newTypefaceForms = { ...typefaceForms };
            delete newTypefaceForms[index];
            // Adjust indices for substrates after the removed one
            const adjustedForms = {};
            Object.keys(newTypefaceForms).forEach((key) => {
                const keyNum = parseInt(key);
                if (keyNum > index) {
                    adjustedForms[keyNum - 1] = newTypefaceForms[key];
                } else if (keyNum < index) {
                    adjustedForms[keyNum] = newTypefaceForms[key];
                }
            });
            setTypefaceForms(adjustedForms);
        }
    };

    const handleUpdateSubstrate = (index, field, value) => {
        const newSubstrates = [...substrates];
        newSubstrates[index] = { ...newSubstrates[index], [field]: value };
        setSubstrates(newSubstrates);
    };

    const getTypefaceForm = (substrateIndex, typefaceIndex = null) => {
        if (typefaceIndex !== null) {
            const key = `${substrateIndex}-${typefaceIndex}`;
            if (typefaceForms[key]) {
                return typefaceForms[key];
            }
            // Fallback to typeface data from substrates
            const typeface =
                substrates[substrateIndex]?.typefaces[typefaceIndex];
            if (typeface) {
                return {
                    typefaceStyle: typeface.typefaceStyle || [],
                    text: typeface.text || "",
                    letteringOntology: typeface.letteringOntology || [],
                    messageFunction: normalizeMessageFunction(
                        typeface.messageFunction
                    ),
                    covidRelated: typeface.covidRelated || false,
                    additionalNotes: typeface.additionalNotes || "",
                };
            }
        }
        // For new typeface form
        return (
            typefaceForms[substrateIndex] || {
                typefaceStyle: [],
                text: "",
                letteringOntology: [],
                messageFunction: [],
                covidRelated: false,
                additionalNotes: "",
            }
        );
    };

    const setTypefaceForm = (
        substrateIndex,
        formData,
        typefaceIndex = null
    ) => {
        if (typefaceIndex !== null) {
            // Update existing typeface form
            const key = `${substrateIndex}-${typefaceIndex}`;
            setTypefaceForms({
                ...typefaceForms,
                [key]: formData,
            });
            // Also update the typeface in substrates array directly
            const newSubstrates = [...substrates];
            newSubstrates[substrateIndex] = {
                ...newSubstrates[substrateIndex],
                typefaces: newSubstrates[substrateIndex].typefaces.map(
                    (tf, i) => (i === typefaceIndex ? formData : tf)
                ),
            };
            setSubstrates(newSubstrates);
        } else {
            // For new typeface form
            setTypefaceForms({
                ...typefaceForms,
                [substrateIndex]: formData,
            });
        }
    };

    const handleAddTypeface = (substrateIndex) => {
        const formData = getTypefaceForm(substrateIndex);
        const newSubstrates = [...substrates];
        newSubstrates[substrateIndex] = {
            ...newSubstrates[substrateIndex],
            typefaces: [...newSubstrates[substrateIndex].typefaces, formData],
        };
        setSubstrates(newSubstrates);
        // Clear the form for this substrate (only if not editing)
        if (
            !editingTypeface ||
            editingTypeface.substrateIndex !== substrateIndex
        ) {
            setTypefaceForm(substrateIndex, {
                typefaceStyle: [],
                text: "",
                letteringOntology: [],
                messageFunction: [],
                covidRelated: false,
                additionalNotes: "",
            });
        }
    };

    const handleRemoveTypeface = (substrateIndex, typefaceIndex) => {
        const newSubstrates = [...substrates];
        newSubstrates[substrateIndex] = {
            ...newSubstrates[substrateIndex],
            typefaces: newSubstrates[substrateIndex].typefaces.filter(
                (_, i) => i !== typefaceIndex
            ),
        };
        setSubstrates(newSubstrates);
        // Clean up typefaceForms for removed typeface and adjust indices
        const key = `${substrateIndex}-${typefaceIndex}`;
        const newTypefaceForms = { ...typefaceForms };
        delete newTypefaceForms[key];
        // Adjust keys for typefaces after the removed one
        const adjustedForms = {};
        Object.keys(newTypefaceForms).forEach((formKey) => {
            const [sIdx, tIdx] = formKey.split("-").map(Number);
            if (sIdx === substrateIndex && tIdx > typefaceIndex) {
                adjustedForms[`${sIdx}-${tIdx - 1}`] =
                    newTypefaceForms[formKey];
            } else {
                adjustedForms[formKey] = newTypefaceForms[formKey];
            }
        });
        setTypefaceForms(adjustedForms);
    };

    const handleEditTypeface = (substrateIndex, typefaceIndex) => {
        const typeface = substrates[substrateIndex].typefaces[typefaceIndex];
        setEditingTypeface({ substrateIndex, typefaceIndex });
        setTypefaceForm(substrateIndex, {
            typefaceStyle: typeface.typefaceStyle || [],
            text: typeface.text || "",
            letteringOntology: typeface.letteringOntology || [],
            messageFunction: normalizeMessageFunction(typeface.messageFunction),
            covidRelated: typeface.covidRelated || false,
            additionalNotes: typeface.additionalNotes || "",
        });
    };

    const handleUpdateTypeface = (substrateIndex, typefaceIndex) => {
        const formData = getTypefaceForm(substrateIndex);
        const newSubstrates = [...substrates];
        newSubstrates[substrateIndex] = {
            ...newSubstrates[substrateIndex],
            typefaces: newSubstrates[substrateIndex].typefaces.map((tf, i) =>
                i === typefaceIndex ? formData : tf
            ),
        };
        setSubstrates(newSubstrates);
        // Clear editing state
        setEditingTypeface(null);
        setTypefaceForm(substrateIndex, {
            typefaceStyle: [],
            text: "",
            letteringOntology: [],
            messageFunction: [],
            covidRelated: false,
            additionalNotes: "",
        });
    };

    const handleCancelEdit = (substrateIndex) => {
        setEditingTypeface(null);
        setTypefaceForm(substrateIndex, {
            typefaceStyle: [],
            text: "",
            letteringOntology: [],
            messageFunction: [],
            covidRelated: false,
            additionalNotes: "",
        });
    };

    const handleSubmit = async (setFinished = false) => {
        try {
            setLoading(true);
            setError(null);

            // Validate municipality is selected
            if (
                !municipality ||
                municipality === "" ||
                municipality === "Unknown"
            ) {
                setError(
                    "Please select a municipality. Municipality is required and cannot be 'Unknown'."
                );
                setLoading(false);
                return;
            }

            if (isEditMode && selectedPhoto) {
                // Update existing photo with all substrates
                const updateData = {
                    municipality: municipality,
                    substrates: substrates.map((substrate) => ({
                        placement: substrate.placement,
                        additionalNotes: substrate.additionalNotes,
                        thisIsntReallyASign: !substrate.trueSign,
                        typefaces: substrate.typefaces.map((tf) => ({
                            typefaceStyle: tf.typefaceStyle,
                            copy: tf.text,
                            letteringOntology: tf.letteringOntology,
                            messageFunction: Array.isArray(tf.messageFunction)
                                ? tf.messageFunction.filter(mf => mf && mf.trim() !== "")
                                : tf.messageFunction && tf.messageFunction.trim() !== ""
                                ? [tf.messageFunction]
                                : [],
                            covidRelated: tf.covidRelated,
                            additionalNotes: tf.additionalNotes,
                        })),
                        confidence: parseInt(substrate.confidence) || 0,
                        confidenceReasoning: substrate.confidenceReasoning,
                        additionalInfo: substrate.additionalInfo,
                    })),
                };

                // Only set status to finished if finishing
                if (setFinished) {
                    updateData.status = "finished";
                }

                const response = await fetch(
                    apiUrl(`/api/photos/${selectedPhoto._id}/update`),
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updateData),
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Failed to update photo");
                }

                toast({
                    title: setFinished ? "Photo finished" : "Photo updated",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });

                // Call the callback to refresh the parent component
                if (onPhotoUpdated) {
                    onPhotoUpdated();
                }
            } else {
                // For new photos, keep the existing behavior (batch data)
                // This would typically create a new photo entry
            }

            closeModal();
        } catch (err) {
            setError(err.message);
            console.error("Error submitting photo:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Modal size="6xl" isOpen={isOpen} onClose={handleCloseRequest}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {loading
                        ? "Loading..."
                        : isEditMode
                        ? `Edit Photo Labelling${
                              selectedPhoto?.custom_id
                                  ? ` - ${selectedPhoto.custom_id}`
                                  : ""
                          }`
                        : photo === null
                        ? "Upload Photo"
                        : "Label Photo Details"}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {error && (
                        <Alert status="error" mb={4}>
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Center>
                            <Spinner size="xl" />
                        </Center>
                    ) : photo === null ? (
                        <FormControl>
                            <FormLabel>Photo Upload</FormLabel>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </FormControl>
                    ) : (
                        <HStack spacing={6} align="flex-start" maxH="80vh">
                            {/* Left Side - Image */}
                            <Box
                                flex="0 0 40%"
                                position="sticky"
                                top={0}
                                alignSelf="flex-start"
                                maxH="80vh"
                                overflowY="auto"
                            >
                                <Image
                                    src={photoPreview}
                                    alt="Photo preview"
                                    maxH="50vh"
                                    maxW="100%"
                                    objectFit="contain"
                                    cursor="pointer"
                                    onClick={onImageViewerOpen}
                                    _hover={{ opacity: 0.9 }}
                                    transition="opacity 0.2s"
                                    onError={(e) => {
                                        console.error(
                                            "Failed to load image:",
                                            photoPreview
                                        );
                                        e.target.style.display = "none";
                                    }}
                                />
                                
                                {/* Photo Details Display */}
                                {photo && (
                                    <VStack spacing={4} align="stretch" mt={4}>
                                        <Divider />
                                        
                                        {/* Basic Info */}
                                        <Box>
                                            <Text fontWeight="bold" mb={2}>
                                                Basic Information
                                            </Text>
                                            {isEditMode && selectedPhoto && (
                                                <>
                                                    <HStack spacing={4}>
                                                        <Badge colorScheme="blue">
                                                            {selectedPhoto.status || "Unknown status"}
                                                        </Badge>
                                                        <Text>ID: {selectedPhoto.custom_id}</Text>
                                                    </HStack>
                                                    {selectedPhoto.initials && (
                                                        <Text mt={2}>Initials: {selectedPhoto.initials}</Text>
                                                    )}
                                                    <Text>
                                                        Last Updated:{" "}
                                                        {selectedPhoto.lastUpdated
                                                            ? new Date(selectedPhoto.lastUpdated).toLocaleString()
                                                            : "N/A"}
                                                    </Text>
                                                </>
                                            )}
                                            <Text mt={isEditMode && selectedPhoto ? 2 : 0}>
                                                Municipality: {municipality || "Not set"}
                                            </Text>
                                        </Box>

                                        <Divider />

                                        {/* Substrates */}
                                        {substrates &&
                                            substrates.map((substrate, index) => (
                                                <Box key={index}>
                                                    <Text fontWeight="bold" mb={2}>
                                                        Substrate {index + 1}
                                                    </Text>
                                                    <Text>
                                                        Placement: {substrate.placement || "Not set"}
                                                    </Text>
                                                    {substrate.additionalNotes && (
                                                        <Text whiteSpace="pre-wrap">
                                                            Notes: {substrate.additionalNotes}
                                                        </Text>
                                                    )}
                                                    <Text>
                                                        True Sign:{" "}
                                                        {substrate.trueSign ? "Yes" : "No"}
                                                    </Text>

                                                    {substrate.additionalInfo && (
                                                        <Text whiteSpace="pre-wrap">
                                                            Additional Info:{" "}
                                                            {substrate.additionalInfo}
                                                        </Text>
                                                    )}

                                                    {/* Typefaces */}
                                                    {substrate.typefaces &&
                                                        substrate.typefaces.map(
                                                            (typeface, tIndex) => (
                                                                <Box
                                                                    key={tIndex}
                                                                    mt={2}
                                                                    pl={4}
                                                                    borderLeft="2px solid"
                                                                    borderColor="gray.200"
                                                                >
                                                                    <Text fontWeight="bold">
                                                                        Typeface {tIndex + 1}
                                                                    </Text>
                                                                    <Text>
                                                                        Style:{" "}
                                                                        {Array.isArray(
                                                                            typeface.typefaceStyle
                                                                        )
                                                                            ? typeface.typefaceStyle.join(
                                                                                  ", "
                                                                              )
                                                                            : typeface.typefaceStyle || "Not set"}
                                                                    </Text>
                                                                    <Text>
                                                                        Text:{" "}
                                                                        <Text
                                                                            as="span"
                                                                            fontStyle="italic"
                                                                            fontWeight="medium"
                                                                            whiteSpace="pre-wrap"
                                                                            display="block"
                                                                        >
                                                                            "{typeface.text || "Not set"}"
                                                                        </Text>
                                                                    </Text>
                                                                    <Text>
                                                                        Lettering Ontology:{" "}
                                                                        {Array.isArray(
                                                                            typeface.letteringOntology
                                                                        )
                                                                            ? typeface.letteringOntology.join(
                                                                                  ", "
                                                                              )
                                                                            : typeface.letteringOntology || "Not set"}
                                                                    </Text>
                                                                    <Text>
                                                                        Message Function:{" "}
                                                                        {Array.isArray(
                                                                            typeface.messageFunction
                                                                        )
                                                                            ? typeface.messageFunction.join(
                                                                                  ", "
                                                                              )
                                                                            : typeface.messageFunction || "Not set"}
                                                                    </Text>
                                                                    <Text>
                                                                        COVID Related:{" "}
                                                                        {typeface.covidRelated
                                                                            ? "Yes"
                                                                            : "No"}
                                                                    </Text>
                                                                    {typeface.additionalNotes && (
                                                                        <Text whiteSpace="pre-wrap">
                                                                            Notes:{" "}
                                                                            {
                                                                                typeface.additionalNotes
                                                                            }
                                                                        </Text>
                                                                    )}
                                                                </Box>
                                                            )
                                                        )}
                                                    <br />
                                                    {substrate.confidence && (
                                                        <Text>
                                                            Confidence: {substrate.confidence}
                                                        </Text>
                                                    )}
                                                    {substrate.confidenceReasoning && (
                                                        <Text whiteSpace="pre-wrap">
                                                            Confidence Reasoning:{" "}
                                                            {substrate.confidenceReasoning}
                                                        </Text>
                                                    )}
                                                </Box>
                                            ))}
                                    </VStack>
                                )}
                            </Box>

                            {/* Right Side - Form */}
                            <Box flex="1" maxH="80vh" overflowY="auto" pr={2}>
                                <VStack spacing={4} align="stretch">
                                    {/* Municipality Selection */}
                                    <FormControl isRequired>
                                        <FormLabel>Municipality</FormLabel>
                                        <Select
                                            value={municipality}
                                            onChange={(e) =>
                                                setMunicipality(e.target.value)
                                            }
                                            placeholder="Select a municipality"
                                            isInvalid={
                                                !municipality ||
                                                municipality === "" ||
                                                municipality === "Unknown"
                                            }
                                        >
                                            {municipalities.map((muni) => (
                                                <option key={muni} value={muni}>
                                                    {muni}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* Substrates List */}
                                    <VStack spacing={4} align="stretch">
                                        {substrates.map(
                                            (substrate, substrateIndex) => (
                                                <SubstrateSection
                                                    key={substrateIndex}
                                                    substrate={substrate}
                                                    substrateIndex={substrateIndex}
                                                    substrates={substrates}
                                                    onUpdateSubstrate={handleUpdateSubstrate}
                                                    onRemoveSubstrate={handleRemoveSubstrate}
                                                    getTypefaceForm={getTypefaceForm}
                                                    setTypefaceForm={setTypefaceForm}
                                                    onAddTypeface={handleAddTypeface}
                                                    onRemoveTypeface={handleRemoveTypeface}
                                                />
                                            )
                                        )}
                                        <Button
                                            leftIcon={<AddIcon />}
                                            colorScheme="green"
                                            onClick={handleAddSubstrate}
                                        >
                                            Add Substrate
                                        </Button>
                                    </VStack>
                                </VStack>
                            </Box>
                        </HStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    {isEditMode ? (
                        <>
                            <Button
                                colorScheme="blue"
                                variant="outline"
                                mr={3}
                                onClick={() => handleSubmit(false)}
                                isLoading={loading}
                            >
                                Update
                            </Button>
                            {selectedPhoto?.status !== "finished" && (
                                <Button
                                    colorScheme="teal"
                                    mr={3}
                                    onClick={onFinishOpen}
                                    isLoading={loading}
                                >
                                    Finish
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button
                            colorScheme="blue"
                            mr={3}
                            onClick={() => handleSubmit(false)}
                            isLoading={loading}
                        >
                            Submit
                        </Button>
                    )}
                    <Button variant="ghost" onClick={handleCloseRequest}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>

            {/* Finish Dialog */}
            <AlertDialog
                isOpen={isFinishOpen}
                leastDestructiveRef={cancelRef}
                onClose={onFinishClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Finish Completion
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to mark this photo as
                            finished? This will set the status to "finished" and
                            complete the labeling process.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onFinishClose}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="teal"
                                onClick={() => {
                                    onFinishClose();
                                    handleSubmit(true);
                                }}
                                ml={3}
                            >
                                Finish
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Fullscreen Image Viewer */}
            {photoPreview && (
                <ImageFullscreenViewer
                    imageUrl={photoPreview}
                    isOpen={isImageViewerOpen}
                    onClose={onImageViewerClose}
                />
            )}
        </Modal>

        {/* Unsaved Changes Dialog */}
        <AlertDialog
            isOpen={isUnsavedOpen}
            leastDestructiveRef={cancelRef}
            onClose={onUnsavedClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Unsaved Changes
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        Your changes will not be saved.
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            ref={cancelRef}
                            onClick={() => {
                                onUnsavedClose();
                                closeModal();
                            }}
                        >
                            Discard
                        </Button>
                        <Button
                            colorScheme="blue"
                            ml={3}
                            isLoading={loading}
                            onClick={() => {
                                onUnsavedClose();
                                handleSubmit(false);
                            }}
                        >
                            Save
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
        </>
    );
}
