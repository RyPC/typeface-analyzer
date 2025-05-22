import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    Text,
    VStack,
    HStack,
    Divider,
    Badge,
    Image,
} from "@chakra-ui/react";

export default function PhotoDetailsModal({ isOpen, onClose, photo }) {
    if (!photo) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Photo Details</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4} align="stretch">
                        {/* Basic Info */}
                        <Box>
                            <Text fontWeight="bold" mb={2}>
                                Basic Information
                            </Text>
                            <HStack spacing={4}>
                                <Badge colorScheme="blue">
                                    {photo.status || "Unknown status"}
                                </Badge>
                                <Text>ID: {photo.custom_id}</Text>
                            </HStack>
                            <Text mt={2}>
                                Municipality: {photo.municipality}
                            </Text>
                            {photo.initials && (
                                <Text>Initials: {photo.initials}</Text>
                            )}
                            <Text>
                                Last Updated:{" "}
                                {new Date(photo.lastUpdated).toLocaleString()}
                            </Text>
                        </Box>

                        <Divider />

                        {/* Substrates */}
                        {photo.substrates &&
                            photo.substrates.map((substrate, index) => (
                                <Box key={index}>
                                    <Text fontWeight="bold" mb={2}>
                                        Substrate {index + 1}
                                    </Text>
                                    <Text>
                                        Placement: {substrate.placement}
                                    </Text>
                                    {substrate.additionalNotes && (
                                        <Text>
                                            Notes: {substrate.additionalNotes}
                                        </Text>
                                    )}
                                    <Text>
                                        True Sign:{" "}
                                        {substrate.trueSign ? "Yes" : "No"}
                                    </Text>

                                    {substrate.additionalInfo && (
                                        <Text>
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
                                                            : typeface.typefaceStyle}
                                                    </Text>
                                                    <Text>
                                                        Text:{" "}
                                                        <Text
                                                            as="span"
                                                            fontStyle="italic"
                                                            fontWeight="medium"
                                                        >
                                                            "{typeface.copy}"
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
                                                            : typeface.letteringOntology}
                                                    </Text>
                                                    <Text>
                                                        Message Function:{" "}
                                                        {Array.isArray(
                                                            typeface.messageFunction
                                                        )
                                                            ? typeface.messageFunction.join(
                                                                  ", "
                                                              )
                                                            : typeface.messageFunction}
                                                    </Text>
                                                    <Text>
                                                        COVID Related:{" "}
                                                        {typeface.covidRelated
                                                            ? "Yes"
                                                            : "No"}
                                                    </Text>
                                                    {typeface.additionalNotes && (
                                                        <Text>
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
                                        <Text>
                                            Confidence Reasoning:{" "}
                                            {substrate.confidenceReasoning}
                                        </Text>
                                    )}
                                </Box>
                            ))}

                        {/* Image */}
                        {photo.imageUrl && (
                            <>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" mb={2}>
                                        Image
                                    </Text>
                                    <Image
                                        src={photo.imageUrl}
                                        alt="Photo"
                                        maxH="400px"
                                        objectFit="contain"
                                    />
                                </Box>
                            </>
                        )}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
