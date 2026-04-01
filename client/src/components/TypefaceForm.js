import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Textarea,
    VStack,
    Text,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { TYPEFACE_STYLES, LETTERING_ONTOLOGIES, MESSAGE_FUNCTIONS } from "../constants";

export const normalizeMessageFunction = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((v) => (typeof v === "string" ? v.trim() : v))
            .filter((v) => v && v !== "");
    }
    const trimmed = typeof value === "string" ? value.trim() : value;
    return trimmed ? [trimmed] : [];
};

export default function TypefaceForm({
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
                    onChange={(e) => onUpdateFormData({ ...formData, text: e.target.value })}
                    rows={4}
                    resize="vertical"
                />
            </FormControl>

            <FormControl>
                <FormLabel pointerEvents="none">Typeface Style</FormLabel>
                <CheckboxGroup
                    value={formData.typefaceStyle || []}
                    onChange={(val) => onUpdateFormData({ ...formData, typefaceStyle: val })}
                >
                    <HStack wrap="wrap">
                        {TYPEFACE_STYLES.map((style) => (
                            <Checkbox key={style} value={style}>{style}</Checkbox>
                        ))}
                    </HStack>
                </CheckboxGroup>
            </FormControl>

            <FormControl>
                <FormLabel pointerEvents="none">Lettering Ontology</FormLabel>
                <CheckboxGroup
                    value={formData.letteringOntology || []}
                    onChange={(val) => onUpdateFormData({ ...formData, letteringOntology: val })}
                >
                    <HStack wrap="wrap">
                        {LETTERING_ONTOLOGIES.map((l) => (
                            <Checkbox key={l} value={l}>{l}</Checkbox>
                        ))}
                    </HStack>
                </CheckboxGroup>
            </FormControl>

            <FormControl>
                <FormLabel pointerEvents="none">Message Function</FormLabel>
                <CheckboxGroup
                    value={Array.isArray(formData.messageFunction)
                        ? formData.messageFunction.filter((mf) => MESSAGE_FUNCTIONS.includes(mf))
                        : []}
                    onChange={(selectedValues) => {
                        const existingCustom = Array.isArray(formData.messageFunction)
                            ? formData.messageFunction.filter((mf) => !MESSAGE_FUNCTIONS.includes(mf))
                            : [];
                        onUpdateFormData({
                            ...formData,
                            messageFunction: [...selectedValues, ...existingCustom],
                        });
                    }}
                >
                    <HStack wrap="wrap">
                        {MESSAGE_FUNCTIONS.map((m) => (
                            <Checkbox key={m} value={m}>{m}</Checkbox>
                        ))}
                    </HStack>
                </CheckboxGroup>

                <VStack spacing={2} mt={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Custom Message Functions:
                    </Text>
                    {(() => {
                        const currentValues = Array.isArray(formData.messageFunction)
                            ? formData.messageFunction
                            : formData.messageFunction ? [formData.messageFunction] : [];
                        const customValues = currentValues.filter((mf) => !MESSAGE_FUNCTIONS.includes(mf));

                        return customValues.length > 0
                            ? customValues.map((customMf, index) => (
                                <HStack key={index}>
                                    <Input
                                        value={customMf || ""}
                                        placeholder="Enter custom message function"
                                        onChange={(e) => {
                                            const allValues = Array.isArray(formData.messageFunction)
                                                ? formData.messageFunction
                                                : formData.messageFunction ? [formData.messageFunction] : [];
                                            const predefined = allValues.filter((mf) => MESSAGE_FUNCTIONS.includes(mf));
                                            const custom = [...allValues.filter((mf) => !MESSAGE_FUNCTIONS.includes(mf))];
                                            custom[index] = e.target.value;
                                            onUpdateFormData({ ...formData, messageFunction: [...predefined, ...custom] });
                                        }}
                                        onBlur={() => {
                                            const allValues = Array.isArray(formData.messageFunction)
                                                ? formData.messageFunction
                                                : formData.messageFunction ? [formData.messageFunction] : [];
                                            const predefined = allValues.filter((mf) => MESSAGE_FUNCTIONS.includes(mf));
                                            const custom = allValues.filter((mf) => !MESSAGE_FUNCTIONS.includes(mf));
                                            onUpdateFormData({
                                                ...formData,
                                                messageFunction: [...predefined, ...custom.filter((v) => v && v.trim() !== "")],
                                            });
                                        }}
                                    />
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        aria-label="Remove custom message function"
                                        onClick={() => {
                                            const allValues = Array.isArray(formData.messageFunction)
                                                ? formData.messageFunction
                                                : formData.messageFunction ? [formData.messageFunction] : [];
                                            const predefined = allValues.filter((mf) => MESSAGE_FUNCTIONS.includes(mf));
                                            const custom = allValues.filter((mf) => !MESSAGE_FUNCTIONS.includes(mf));
                                            custom.splice(index, 1);
                                            onUpdateFormData({ ...formData, messageFunction: [...predefined, ...custom] });
                                        }}
                                    />
                                </HStack>
                            ))
                            : null;
                    })()}
                    <Button
                        size="sm"
                        leftIcon={<AddIcon />}
                        variant="outline"
                        onClick={() => {
                            const currentValues = Array.isArray(formData.messageFunction)
                                ? formData.messageFunction
                                : formData.messageFunction ? [formData.messageFunction] : [];
                            onUpdateFormData({ ...formData, messageFunction: [...currentValues, ""] });
                        }}
                    >
                        Add Custom Message Function
                    </Button>
                </VStack>
            </FormControl>

            <FormControl>
                <Checkbox
                    isChecked={formData.covidRelated || false}
                    onChange={(e) => onUpdateFormData({ ...formData, covidRelated: e.target.checked })}
                >
                    Covid Related?
                </Checkbox>
            </FormControl>

            <FormControl>
                <FormLabel>Additional Notes</FormLabel>
                <Textarea
                    value={formData.additionalNotes || ""}
                    onChange={(e) => onUpdateFormData({ ...formData, additionalNotes: e.target.value })}
                />
            </FormControl>

            {onSave && (
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
            )}
        </VStack>
    );
}
