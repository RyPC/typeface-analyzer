import React, { useState, useEffect } from "react";
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
    const [imageUrl, setImageUrl] = useState(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (photo && isOpen) {
            // Always construct S3 URL from custom_id
            if (photo.custom_id) {
                const s3Url = `https://typeface-s3-photo-bucket.s3.us-west-1.amazonaws.com/Font+Census+Data/${photo.custom_id}`;
                setImageUrl(s3Url);
            } else {
                setImageUrl(null);
            }
        } else if (!isOpen) {
            // Reset when modal closes
            setImageUrl(null);
            setImageError(false);
        }
    }, [photo, isOpen]);

    if (!photo) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Photo Details</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4} align="stretch">
                        {/* Image */}
                        <Box>
                            {imageUrl ? (
                                <>
                                    {!imageError ? (
                                        <Image
                                            src={imageUrl}
                                            alt="Photo"
                                            maxH="400px"
                                            objectFit="contain"
                                            onError={(e) => {
                                                console.error(
                                                    "Failed to load image:",
                                                    imageUrl
                                                );
                                                setImageError(true);
                                            }}
                                            onLoad={() => {
                                                setImageError(false);
                                            }}
                                        />
                                    ) : (
                                        <Text color="red.500" fontSize="sm">
                                            Failed to load image from:{" "}
                                            {imageUrl}
                                        </Text>
                                    )}
                                </>
                            ) : (
                                <Text color="gray.500" fontSize="sm">
                                    {photo.custom_id
                                        ? `No image URL available for ${photo.custom_id}`
                                        : "No image available"}
                                </Text>
                            )}
                        </Box>

                        <Divider />

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
                                                            : typeface.typefaceStyle}
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
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
