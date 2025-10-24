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
} from "@chakra-ui/react";

import { useState, useEffect } from "react";

import {
    TYPEFACE_STYLES,
    LETTERING_ONTOLOGIES,
    PLACEMENTS,
    MESSAGE_FUNCTIONS,
} from "./constants";

const API_URL = process.env.REACT_APP_API_URL;

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

    const [formData, setFormData] = useState({
        placement: "",
        additionalNotes: "",
        trueSign: false,
        confidence: "",
        confidenceReasoning: "",
        additionalInfo: "",
        typefaces: [],
    });

    const [currentTypeface, setCurrentTypeface] = useState({
        typefaceStyle: [],
        text: "",
        letteringOntology: [],
        messageFunction: "",
        covidRelated: false,
        additionalNotes: "",
    });

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedPhoto) {
                // Pre-populate form with existing photo data
                setFormData({
                    placement: selectedPhoto.substrates?.[0]?.placement || "",
                    additionalNotes:
                        selectedPhoto.substrates?.[0]?.additionalNotes || "",
                    trueSign:
                        !selectedPhoto.substrates?.[0]?.thisIsntReallyASign,
                    confidence: selectedPhoto.substrates?.[0]?.confidence || "",
                    confidenceReasoning:
                        selectedPhoto.substrates?.[0]?.confidenceReasoning ||
                        "",
                    additionalInfo:
                        selectedPhoto.substrates?.[0]?.additionalInfo || "",
                    typefaces: selectedPhoto.substrates?.[0]?.typefaces || [],
                });

                // Set the first typeface as current if available
                if (selectedPhoto.substrates?.[0]?.typefaces?.length > 0) {
                    const firstTypeface =
                        selectedPhoto.substrates[0].typefaces[0];
                    setCurrentTypeface({
                        typefaceStyle: firstTypeface.typefaceStyle || [],
                        text: firstTypeface.copy || "",
                        letteringOntology:
                            firstTypeface.letteringOntology || [],
                        messageFunction:
                            firstTypeface.messageFunction?.[0] || "",
                        covidRelated: firstTypeface.covidRelated || false,
                        additionalNotes: firstTypeface.additionalNotes || "",
                    });
                }

                // Always set photo preview and photo object for edit mode
                // This ensures we skip the upload step and go directly to the form
                if (selectedPhoto.photoLink) {
                    setPhotoPreview(selectedPhoto.photoLink);
                } else {
                    // If no photoLink, construct S3 URL from custom_id
                    const s3Url = `https://typeface-s3-photo-bucket.s3.amazonaws.com/${encodeURIComponent(
                        "Font Census Data"
                    )}/${selectedPhoto.custom_id}`;
                    setPhotoPreview(s3Url);
                }
                setPhoto({ name: selectedPhoto.custom_id || "photo.jpg" });
            } else {
                // For new photo mode, fetch from batch data
                fetchNextPhoto();
            }
        }
    }, [isOpen, isEditMode, selectedPhoto]);

    const fetchNextPhoto = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(
                "http://localhost:3001/api/batch/next"
            );
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
                // Set the main form data
                setFormData({
                    placement: data.formData.placement || "",
                    additionalNotes: data.formData.additionalNotes || "",
                    trueSign: data.formData.trueSign || false,
                    confidence: data.formData.confidence || "",
                    confidenceReasoning:
                        data.formData.confidenceReasoning || "",
                    additionalInfo: data.formData.additionalInfo || "",
                    typefaces: data.formData.typefaces || [],
                });

                console.log(data.formData);

                // If there are typefaces, set the first one as current typeface
                if (
                    data.formData.typefaces &&
                    data.formData.typefaces.length > 0
                ) {
                    setCurrentTypeface({
                        typefaceStyle:
                            data.formData.typefaces[0].typefaceStyle || [],
                        text: data.formData.typefaces[0].text || "",
                        letteringOntology:
                            data.formData.typefaces[0].letteringOntology || [],
                        messageFunction:
                            data.formData.typefaces[0].messageFunction || "",
                        covidRelated:
                            data.formData.typefaces[0].covidRelated || false,
                        additionalNotes:
                            data.formData.typefaces[0].additionalNotes || "",
                    });
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

    const resetForm = () => {
        setFormData({
            placement: "",
            additionalNotes: "",
            trueSign: false,
            confidence: "",
            confidenceReasoning: "",
            additionalInfo: "",
            typefaces: [],
        });
        setPhoto(null);
        setPhotoPreview(null);
    };

    const handlePhotoUpload = (e) => {
        setPhoto(e.target.files[0]);
        setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    };

    const handleAddTypeface = () => {
        setFormData((prev) => ({
            ...prev,
            typefaces: [...prev.typefaces, currentTypeface],
        }));
        setCurrentTypeface({
            typefaceStyle: [],
            text: "",
            letteringOntology: [],
            messageFunction: "",
            covidRelated: false,
            additionalNotes: "",
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            if (isEditMode && selectedPhoto) {
                // Update existing photo
                const updateData = {
                    substrates: [
                        {
                            placement: formData.placement,
                            additionalNotes: formData.additionalNotes,
                            thisIsntReallyASign: !formData.trueSign,
                            typefaces: formData.typefaces.map((tf) => ({
                                typefaceStyle: tf.typefaceStyle,
                                copy: tf.text,
                                letteringOntology: tf.letteringOntology,
                                messageFunction: tf.messageFunction,
                                covidRelated: tf.covidRelated,
                                additionalNotes: tf.additionalNotes,
                            })),
                            confidence: parseInt(formData.confidence) || 0,
                            confidenceReasoning: formData.confidenceReasoning,
                            additionalInfo: formData.additionalInfo,
                        },
                    ],
                    status: "completed", // Mark as completed when submitted
                };

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
                    substrates: [formData],
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
                        ? "Edit Photo Details"
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
                        <VStack spacing={4} align="stretch">
                            <Box
                                w="100%"
                                display="flex"
                                alignContent="center"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Image
                                    src={photoPreview}
                                    alt="Photo preview"
                                    maxH="400px"
                                    mt={4}
                                    onError={(e) => {
                                        console.error(
                                            "Failed to load image:",
                                            photoPreview
                                        );
                                        e.target.style.display = "none";
                                    }}
                                />
                            </Box>
                            <FormControl>
                                <FormLabel>Placement</FormLabel>
                                <Select
                                    value={formData.placement}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            placement: e.target.value,
                                        })
                                    }
                                >
                                    {PLACEMENTS.map((p) => (
                                        <option key={p}>{p}</option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Additional Notes</FormLabel>
                                <Textarea
                                    value={formData.additionalNotes}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            additionalNotes: e.target.value,
                                        })
                                    }
                                />
                            </FormControl>

                            <FormControl>
                                <Checkbox
                                    isChecked={formData.trueSign}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            trueSign: e.target.checked,
                                        })
                                    }
                                >
                                    True Sign?
                                </Checkbox>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Confidence</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.confidence}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            confidence: e.target.value,
                                        })
                                    }
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Confidence Reasoning</FormLabel>
                                <Textarea
                                    value={formData.confidenceReasoning}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            confidenceReasoning: e.target.value,
                                        })
                                    }
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Additional Info</FormLabel>
                                <Textarea
                                    value={formData.additionalInfo}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            additionalInfo: e.target.value,
                                        })
                                    }
                                />
                            </FormControl>

                            <Box borderWidth="1px" borderRadius="lg" p={4}>
                                <FormLabel>Add Typeface</FormLabel>
                                <FormControl>
                                    <FormLabel>Text</FormLabel>
                                    <Input
                                        value={currentTypeface.text}
                                        onChange={(e) =>
                                            setCurrentTypeface({
                                                ...currentTypeface,
                                                text: e.target.value,
                                            })
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Typeface Style</FormLabel>
                                    <CheckboxGroup
                                        value={currentTypeface.typefaceStyle}
                                        onChange={(val) =>
                                            setCurrentTypeface({
                                                ...currentTypeface,
                                                typefaceStyle: val,
                                            })
                                        }
                                    >
                                        <HStack wrap="wrap">
                                            {TYPEFACE_STYLES.map((style) => (
                                                <Checkbox
                                                    key={style}
                                                    value={style}
                                                >
                                                    {style}
                                                </Checkbox>
                                            ))}
                                        </HStack>
                                    </CheckboxGroup>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Lettering Ontology</FormLabel>
                                    <CheckboxGroup
                                        value={
                                            currentTypeface.letteringOntology
                                        }
                                        onChange={(val) =>
                                            setCurrentTypeface({
                                                ...currentTypeface,
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
                                        value={currentTypeface.messageFunction}
                                        onChange={(e) =>
                                            setCurrentTypeface({
                                                ...currentTypeface,
                                                messageFunction: e.target.value,
                                            })
                                        }
                                    >
                                        {MESSAGE_FUNCTIONS.map((m) => (
                                            <option key={m}>{m}</option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <Checkbox
                                        isChecked={currentTypeface.covidRelated}
                                        onChange={(e) =>
                                            setCurrentTypeface({
                                                ...currentTypeface,
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
                                        value={currentTypeface.additionalNotes}
                                        onChange={(e) =>
                                            setCurrentTypeface({
                                                ...currentTypeface,
                                                additionalNotes: e.target.value,
                                            })
                                        }
                                    />
                                </FormControl>

                                <Button mt={2} onClick={handleAddTypeface}>
                                    Add Typeface
                                </Button>
                            </Box>
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme="blue"
                        mr={3}
                        onClick={handleSubmit}
                        isLoading={loading}
                    >
                        {isEditMode ? "Update" : "Submit"}
                    </Button>
                    <Button onClick={closeModal}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
