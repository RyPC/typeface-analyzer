// import "./App.css";
import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Flex,
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
    Text,
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

export default function AddModal({ data, setData, isOpen, onClose }) {
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

    // Fetch next photo from batch data when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchNextPhoto();
        }
    }, [isOpen]);

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

    return (
        <Modal size="6xl" isOpen={isOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {loading
                        ? "Loading..."
                        : photo === null
                        ? "Upload Photo"
                        : "Edit Details"}
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
                                    alt="Uploaded preview"
                                    maxH="400px"
                                    mt={4}
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
                        onClick={() => {
                            // console.log({ substrates: [formData] });
                            onClose();
                            resetForm();
                        }}
                    >
                        Submit
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
