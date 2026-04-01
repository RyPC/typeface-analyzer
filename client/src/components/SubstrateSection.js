import {
    Badge,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Select,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { PLACEMENTS } from "../constants";
import TypefaceForm from "./TypefaceForm";

export default function SubstrateSection({
    substrate,
    substrateIndex,
    substrates,
    onUpdateSubstrate,
    onRemoveSubstrate,
    getTypefaceForm,
    setTypefaceForm,
    onAddTypeface,
    onRemoveTypeface,
}) {
    return (
        <Box borderWidth="2px" borderRadius="lg" p={4} borderColor="gray.200">
            <HStack justify="space-between" mb={3}>
                <HStack>
                    <Text fontWeight="bold" fontSize="lg">
                        Substrate {substrateIndex + 1}
                    </Text>
                    <Badge colorScheme="orange">
                        {substrate.typefaces.length} typeface{substrate.typefaces.length !== 1 ? "s" : ""}
                    </Badge>
                </HStack>
                {substrates.length > 1 && (
                    <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        aria-label="Remove substrate"
                        onClick={() => onRemoveSubstrate(substrateIndex)}
                    />
                )}
            </HStack>

            <VStack spacing={3} align="stretch">
                <FormControl>
                    <FormLabel>Placement</FormLabel>
                    <Select
                        value={substrate.placement}
                        onChange={(e) => onUpdateSubstrate(substrateIndex, "placement", e.target.value)}
                    >
                        {PLACEMENTS.map((p) => (
                            <option key={p}>{p}</option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>Additional Notes</FormLabel>
                    <Textarea
                        value={substrate.additionalNotes}
                        onChange={(e) => onUpdateSubstrate(substrateIndex, "additionalNotes", e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <Checkbox
                        isChecked={substrate.trueSign}
                        onChange={(e) => onUpdateSubstrate(substrateIndex, "trueSign", e.target.checked)}
                    >
                        True Sign?
                    </Checkbox>
                </FormControl>

                <FormControl>
                    <FormLabel>Confidence</FormLabel>
                    <Input
                        type="number"
                        value={substrate.confidence}
                        onChange={(e) => onUpdateSubstrate(substrateIndex, "confidence", e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Confidence Reasoning</FormLabel>
                    <Textarea
                        value={substrate.confidenceReasoning}
                        onChange={(e) => onUpdateSubstrate(substrateIndex, "confidenceReasoning", e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Additional Info</FormLabel>
                    <Textarea
                        value={substrate.additionalInfo}
                        onChange={(e) => onUpdateSubstrate(substrateIndex, "additionalInfo", e.target.value)}
                    />
                </FormControl>

                <Divider />
                <Box>
                    <Text fontWeight="bold" mb={2}>Typefaces:</Text>
                    {substrate.typefaces.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">No typefaces added yet</Text>
                    ) : (
                        <VStack spacing={2} align="stretch">
                            {substrate.typefaces.map((typeface, typefaceIndex) => (
                                <Box
                                    key={typefaceIndex}
                                    p={3}
                                    bg="blue.50"
                                    borderRadius="md"
                                    borderWidth="2px"
                                    borderColor="blue.500"
                                >
                                    <HStack justify="space-between" mb={2}>
                                        <Text fontWeight="medium" fontSize="sm">
                                            Typeface {typefaceIndex + 1}
                                        </Text>
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            colorScheme="red"
                                            size="xs"
                                            aria-label="Remove typeface"
                                            onClick={() => onRemoveTypeface(substrateIndex, typefaceIndex)}
                                        />
                                    </HStack>
                                    <TypefaceForm
                                        formData={getTypefaceForm(substrateIndex, typefaceIndex)}
                                        onUpdateFormData={(data) => setTypefaceForm(substrateIndex, data, typefaceIndex)}
                                        onSave={null}
                                        onCancel={null}
                                    />
                                </Box>
                            ))}
                        </VStack>
                    )}

                    <Box mt={3} p={3} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.300">
                        <Text fontWeight="bold" mb={2} fontSize="sm">
                            Add Typeface to Substrate {substrateIndex + 1}
                        </Text>
                        <TypefaceForm
                            formData={getTypefaceForm(substrateIndex)}
                            onUpdateFormData={(data) => setTypefaceForm(substrateIndex, data)}
                            onSave={() => onAddTypeface(substrateIndex)}
                            isAddMode={true}
                        />
                    </Box>
                </Box>
            </VStack>
        </Box>
    );
}
