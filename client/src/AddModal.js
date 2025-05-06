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
} from "@chakra-ui/react";

import { useState } from "react";

import {
    TYPEFACE_STYLES,
    LETTERING_ONTOLOGIES,
    PLACEMENTS,
    MESSAGE_FUNCTIONS,
} from "./constants";

export default function AddModal({ data, setData, isOpen, onClose }) {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

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
                    {photo === null ? "Upload Photo" : "Edit Details"}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {photo === null ? (
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
