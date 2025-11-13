// import "./App.css";
import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
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
    Textarea,
    VStack,
    Alert,
    AlertIcon,
    Center,
    Spinner,
    IconButton,
    Divider,
    Badge,
    Text,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";

import React, { useState, useEffect } from "react";

import {
    TYPEFACE_STYLES,
    LETTERING_ONTOLOGIES,
    PLACEMENTS,
    MESSAGE_FUNCTIONS,
} from "./constants";

const API_URL = process.env.REACT_APP_API_URL;

// TypefaceForm component for adding/editing typefaces
function TypefaceForm({
    substrateIndex,
    typefaceIndex = null,
    formData,
    onUpdateFormData,
    onSave,
    onCancel,
    isAddMode = false,
}) {
    return (
        <VStack spacing={3} align="stretch">
            <FormControl>
                <FormLabel>Text</FormLabel>
                <Textarea
                    value={formData.text || ""}
                    onChange={(e) =>
                        onUpdateFormData({
                            ...formData,
                            text: e.target.value,
                        })
                    }
                    rows={4}
                    resize="vertical"
                />
            </FormControl>

            <FormControl>
                <FormLabel>Typeface Style</FormLabel>
                <CheckboxGroup
                    value={formData.typefaceStyle || []}
                    onChange={(val) =>
                        onUpdateFormData({
                            ...formData,
                            typefaceStyle: val,
                        })
                    }
                >
                    <HStack wrap="wrap">
                        {TYPEFACE_STYLES.map((style) => (
                            <Checkbox key={style} value={style}>
                                {style}
                            </Checkbox>
                        ))}
                    </HStack>
                </CheckboxGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Lettering Ontology</FormLabel>
                <CheckboxGroup
                    value={formData.letteringOntology || []}
                    onChange={(val) =>
                        onUpdateFormData({
                            ...formData,
                            letteringOntology: val,
                        })
                    }
                >
                    <HStack wrap="wrap">
                        {LETTERING_ONTOLOGIES.map((l) => (
                            <Checkbox key={l} value={l}>
                                {l}
                            </Checkbox>
                        ))}
                    </HStack>
                </CheckboxGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Message Function</FormLabel>
                <Select
                    value={formData.messageFunction || ""}
                    onChange={(e) =>
                        onUpdateFormData({
                            ...formData,
                            messageFunction: e.target.value,
                        })
                    }
                >
                    <option value="">Select...</option>
                    {MESSAGE_FUNCTIONS.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </Select>
            </FormControl>

            <FormControl>
                <Checkbox
                    isChecked={formData.covidRelated || false}
                    onChange={(e) =>
                        onUpdateFormData({
                            ...formData,
                            covidRelated: e.target.checked,
                        })
                    }
                >
                    Covid Related?
                </Checkbox>
            </FormControl>

            <FormControl>
                <FormLabel>Additional Notes</FormLabel>
                <Textarea
                    value={formData.additionalNotes || ""}
                    onChange={(e) =>
                        onUpdateFormData({
                            ...formData,
                            additionalNotes: e.target.value,
                        })
                    }
                />
            </FormControl>

            <HStack>
                <Button colorScheme="blue" onClick={onSave} size="sm">
                    {isAddMode ? "Add Typeface" : "Save Changes"}
                </Button>
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} size="sm">
                        Cancel
                    </Button>
                )}
            </HStack>
        </VStack>
    );
}

export default function AddModal({
    isOpen,
    onClose,
    isEditMode = false,
    selectedPhoto = null,
    onPhotoUpdated,
}) {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [municipality, setMunicipality] = useState("");
    const [municipalities, setMunicipalities] = useState([]);
    const {
        isOpen: isConfirmOpen,
        onOpen: onConfirmOpen,
        onClose: onConfirmClose,
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
                        `${API_URL}/api/municipalities`
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
                                    messageFunction: tf.messageFunction || "",
                                    covidRelated: tf.covidRelated || false,
                                    additionalNotes: tf.additionalNotes || "",
                                })
                            ),
                        })
                    );
                    setSubstrates(loadedSubstrates);
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
                console.log(
                    `Client: Constructing S3 URL from custom_id for ${selectedPhoto.custom_id}:`,
                    s3Url
                );
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
            const response = await fetch(`${API_URL}/api/batch/next`);
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
                                    messageFunction: tf.messageFunction || "",
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
                                    messageFunction: tf.messageFunction || "",
                                    covidRelated: tf.covidRelated || false,
                                    additionalNotes: tf.additionalNotes || "",
                                })
                            ),
                        },
                    ]);
                }

                console.log(data.formData);
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

    const getTypefaceForm = (substrateIndex) => {
        return (
            typefaceForms[substrateIndex] || {
                typefaceStyle: [],
                text: "",
                letteringOntology: [],
                messageFunction: "",
                covidRelated: false,
                additionalNotes: "",
            }
        );
    };

    const setTypefaceForm = (substrateIndex, formData) => {
        setTypefaceForms({
            ...typefaceForms,
            [substrateIndex]: formData,
        });
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
                messageFunction: "",
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
        // Clear editing state if we were editing this typeface
        if (
            editingTypeface &&
            editingTypeface.substrateIndex === substrateIndex &&
            editingTypeface.typefaceIndex === typefaceIndex
        ) {
            setEditingTypeface(null);
            setTypefaceForm(substrateIndex, {
                typefaceStyle: [],
                text: "",
                letteringOntology: [],
                messageFunction: "",
                covidRelated: false,
                additionalNotes: "",
            });
        }
    };

    const handleEditTypeface = (substrateIndex, typefaceIndex) => {
        const typeface = substrates[substrateIndex].typefaces[typefaceIndex];
        setEditingTypeface({ substrateIndex, typefaceIndex });
        setTypefaceForm(substrateIndex, {
            typefaceStyle: typeface.typefaceStyle || [],
            text: typeface.text || "",
            letteringOntology: typeface.letteringOntology || [],
            messageFunction: typeface.messageFunction || "",
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
            messageFunction: "",
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
            messageFunction: "",
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
                            messageFunction: tf.messageFunction,
                            covidRelated: tf.covidRelated,
                            additionalNotes: tf.additionalNotes,
                        })),
                        confidence: parseInt(substrate.confidence) || 0,
                        confidenceReasoning: substrate.confidenceReasoning,
                        additionalInfo: substrate.additionalInfo,
                    })),
                };

                // Only set status to finished if confirming
                if (setFinished) {
                    updateData.status = "finished";
                }

                const response = await fetch(
                    `${API_URL}/api/photos/${selectedPhoto._id}/update`,
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

                // Call the callback to refresh the parent component
                if (onPhotoUpdated) {
                    onPhotoUpdated();
                }
            } else {
                // For new photos, keep the existing behavior (batch data)
                // This would typically create a new photo entry
                console.log("New photo submission:", {
                    substrates: substrates,
                });
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
        <Modal size="6xl" isOpen={isOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {loading
                        ? "Loading..."
                        : isEditMode
                        ? `Edit Photo Details${
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
                            >
                                <Image
                                    src={photoPreview}
                                    alt="Photo preview"
                                    maxH="80vh"
                                    maxW="100%"
                                    objectFit="contain"
                                    onError={(e) => {
                                        console.error(
                                            "Failed to load image:",
                                            photoPreview
                                        );
                                        e.target.style.display = "none";
                                    }}
                                />
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
                                                <Box
                                                    key={substrateIndex}
                                                    borderWidth="2px"
                                                    borderRadius="lg"
                                                    p={4}
                                                    borderColor="gray.200"
                                                >
                                                    <HStack
                                                        justify="space-between"
                                                        mb={3}
                                                    >
                                                        <HStack>
                                                            <Text
                                                                fontWeight="bold"
                                                                fontSize="lg"
                                                            >
                                                                Substrate{" "}
                                                                {substrateIndex +
                                                                    1}
                                                            </Text>
                                                            <Badge colorScheme="orange">
                                                                {
                                                                    substrate
                                                                        .typefaces
                                                                        .length
                                                                }{" "}
                                                                typeface
                                                                {substrate
                                                                    .typefaces
                                                                    .length !==
                                                                1
                                                                    ? "s"
                                                                    : ""}
                                                            </Badge>
                                                        </HStack>
                                                        <HStack>
                                                            {substrates.length >
                                                                1 && (
                                                                <IconButton
                                                                    icon={
                                                                        <DeleteIcon />
                                                                    }
                                                                    colorScheme="red"
                                                                    size="sm"
                                                                    aria-label="Remove substrate"
                                                                    onClick={() =>
                                                                        handleRemoveSubstrate(
                                                                            substrateIndex
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </HStack>
                                                    </HStack>

                                                    <VStack
                                                        spacing={3}
                                                        align="stretch"
                                                    >
                                                        <FormControl>
                                                            <FormLabel>
                                                                Placement
                                                            </FormLabel>
                                                            <Select
                                                                value={
                                                                    substrate.placement
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSubstrate(
                                                                        substrateIndex,
                                                                        "placement",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            >
                                                                {PLACEMENTS.map(
                                                                    (p) => (
                                                                        <option
                                                                            key={
                                                                                p
                                                                            }
                                                                        >
                                                                            {p}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </Select>
                                                        </FormControl>

                                                        <FormControl>
                                                            <FormLabel>
                                                                Additional Notes
                                                            </FormLabel>
                                                            <Textarea
                                                                value={
                                                                    substrate.additionalNotes
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSubstrate(
                                                                        substrateIndex,
                                                                        "additionalNotes",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormControl>
                                                            <Checkbox
                                                                isChecked={
                                                                    substrate.trueSign
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSubstrate(
                                                                        substrateIndex,
                                                                        "trueSign",
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                            >
                                                                True Sign?
                                                            </Checkbox>
                                                        </FormControl>

                                                        <FormControl>
                                                            <FormLabel>
                                                                Confidence
                                                            </FormLabel>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    substrate.confidence
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSubstrate(
                                                                        substrateIndex,
                                                                        "confidence",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormControl>
                                                            <FormLabel>
                                                                Confidence
                                                                Reasoning
                                                            </FormLabel>
                                                            <Textarea
                                                                value={
                                                                    substrate.confidenceReasoning
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSubstrate(
                                                                        substrateIndex,
                                                                        "confidenceReasoning",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormControl>
                                                            <FormLabel>
                                                                Additional Info
                                                            </FormLabel>
                                                            <Textarea
                                                                value={
                                                                    substrate.additionalInfo
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSubstrate(
                                                                        substrateIndex,
                                                                        "additionalInfo",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>

                                                        {/* Typefaces for this substrate */}
                                                        <Divider />
                                                        <Box>
                                                            <Text
                                                                fontWeight="bold"
                                                                mb={2}
                                                            >
                                                                Typefaces:
                                                            </Text>
                                                            {substrate.typefaces
                                                                .length === 0 &&
                                                            (!editingTypeface ||
                                                                editingTypeface.substrateIndex !==
                                                                    substrateIndex) ? (
                                                                <Text
                                                                    color="gray.500"
                                                                    fontSize="sm"
                                                                >
                                                                    No typefaces
                                                                    added yet
                                                                </Text>
                                                            ) : (
                                                                <VStack
                                                                    spacing={2}
                                                                    align="stretch"
                                                                >
                                                                    {substrate.typefaces.map(
                                                                        (
                                                                            typeface,
                                                                            typefaceIndex
                                                                        ) => {
                                                                            const isEditing =
                                                                                editingTypeface &&
                                                                                editingTypeface.substrateIndex ===
                                                                                    substrateIndex &&
                                                                                editingTypeface.typefaceIndex ===
                                                                                    typefaceIndex;

                                                                            return (
                                                                                <Box
                                                                                    key={
                                                                                        typefaceIndex
                                                                                    }
                                                                                    p={
                                                                                        3
                                                                                    }
                                                                                    bg={
                                                                                        isEditing
                                                                                            ? "blue.50"
                                                                                            : "gray.50"
                                                                                    }
                                                                                    borderRadius="md"
                                                                                    borderWidth={
                                                                                        isEditing
                                                                                            ? "2px"
                                                                                            : "0px"
                                                                                    }
                                                                                    borderColor="blue.500"
                                                                                >
                                                                                    {isEditing ? (
                                                                                        <TypefaceForm
                                                                                            substrateIndex={
                                                                                                substrateIndex
                                                                                            }
                                                                                            typefaceIndex={
                                                                                                typefaceIndex
                                                                                            }
                                                                                            formData={getTypefaceForm(
                                                                                                substrateIndex
                                                                                            )}
                                                                                            onUpdateFormData={(
                                                                                                data
                                                                                            ) =>
                                                                                                setTypefaceForm(
                                                                                                    substrateIndex,
                                                                                                    data
                                                                                                )
                                                                                            }
                                                                                            onSave={() =>
                                                                                                handleUpdateTypeface(
                                                                                                    substrateIndex,
                                                                                                    typefaceIndex
                                                                                                )
                                                                                            }
                                                                                            onCancel={() =>
                                                                                                handleCancelEdit(
                                                                                                    substrateIndex
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    ) : (
                                                                                        <>
                                                                                            <HStack
                                                                                                justify="space-between"
                                                                                                mb={
                                                                                                    2
                                                                                                }
                                                                                            >
                                                                                                <Text
                                                                                                    fontWeight="medium"
                                                                                                    fontSize="sm"
                                                                                                >
                                                                                                    Typeface{" "}
                                                                                                    {typefaceIndex +
                                                                                                        1}
                                                                                                </Text>
                                                                                                <HStack>
                                                                                                    <Button
                                                                                                        size="xs"
                                                                                                        colorScheme="blue"
                                                                                                        variant="outline"
                                                                                                        onClick={() =>
                                                                                                            handleEditTypeface(
                                                                                                                substrateIndex,
                                                                                                                typefaceIndex
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        Edit
                                                                                                    </Button>
                                                                                                    <IconButton
                                                                                                        icon={
                                                                                                            <DeleteIcon />
                                                                                                        }
                                                                                                        colorScheme="red"
                                                                                                        size="xs"
                                                                                                        aria-label="Remove typeface"
                                                                                                        onClick={() =>
                                                                                                            handleRemoveTypeface(
                                                                                                                substrateIndex,
                                                                                                                typefaceIndex
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                </HStack>
                                                                                            </HStack>
                                                                                            <VStack
                                                                                                align="stretch"
                                                                                                spacing={
                                                                                                    1
                                                                                                }
                                                                                            >
                                                                                                <Text
                                                                                                    fontSize="xs"
                                                                                                    whiteSpace="pre-wrap"
                                                                                                >
                                                                                                    <strong>
                                                                                                        Text:
                                                                                                    </strong>{" "}
                                                                                                    {typeface.text ||
                                                                                                        "-"}
                                                                                                </Text>
                                                                                                <Text fontSize="xs">
                                                                                                    <strong>
                                                                                                        Style:
                                                                                                    </strong>{" "}
                                                                                                    {Array.isArray(
                                                                                                        typeface.typefaceStyle
                                                                                                    )
                                                                                                        ? typeface.typefaceStyle.join(
                                                                                                              ", "
                                                                                                          )
                                                                                                        : "-"}
                                                                                                </Text>
                                                                                                <Text fontSize="xs">
                                                                                                    <strong>
                                                                                                        COVID
                                                                                                        Related:
                                                                                                    </strong>{" "}
                                                                                                    {typeface.covidRelated
                                                                                                        ? "Yes"
                                                                                                        : "No"}
                                                                                                </Text>
                                                                                            </VStack>
                                                                                        </>
                                                                                    )}
                                                                                </Box>
                                                                            );
                                                                        }
                                                                    )}
                                                                </VStack>
                                                            )}

                                                            {/* Add/Edit Typeface Form for this substrate */}
                                                            {(!editingTypeface ||
                                                                editingTypeface.substrateIndex !==
                                                                    substrateIndex) && (
                                                                <Box
                                                                    mt={3}
                                                                    p={3}
                                                                    bg="blue.50"
                                                                    borderRadius="md"
                                                                >
                                                                    <Text
                                                                        fontWeight="bold"
                                                                        mb={2}
                                                                        fontSize="sm"
                                                                    >
                                                                        Add
                                                                        Typeface
                                                                        to
                                                                        Substrate{" "}
                                                                        {substrateIndex +
                                                                            1}
                                                                    </Text>
                                                                    <TypefaceForm
                                                                        substrateIndex={
                                                                            substrateIndex
                                                                        }
                                                                        formData={getTypefaceForm(
                                                                            substrateIndex
                                                                        )}
                                                                        onUpdateFormData={(
                                                                            data
                                                                        ) =>
                                                                            setTypefaceForm(
                                                                                substrateIndex,
                                                                                data
                                                                            )
                                                                        }
                                                                        onSave={() =>
                                                                            handleAddTypeface(
                                                                                substrateIndex
                                                                            )
                                                                        }
                                                                        isAddMode={
                                                                            true
                                                                        }
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </VStack>
                                                </Box>
                                            )
                                        )}

                                        {/* Add Substrate Button */}
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
                            <Button
                                colorScheme="teal"
                                mr={3}
                                onClick={onConfirmOpen}
                                isLoading={loading}
                            >
                                Confirm
                            </Button>
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
                    <Button variant="ghost" onClick={closeModal}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>

            {/* Confirmation Dialog */}
            <AlertDialog
                isOpen={isConfirmOpen}
                leastDestructiveRef={cancelRef}
                onClose={onConfirmClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Confirm Completion
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to mark this photo as
                            finished? This will set the status to "finished" and
                            complete the labeling process.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onConfirmClose}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="teal"
                                onClick={() => {
                                    onConfirmClose();
                                    handleSubmit(true);
                                }}
                                ml={3}
                            >
                                Confirm
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Modal>
    );
}
