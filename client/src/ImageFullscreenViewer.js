import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    IconButton,
    Box,
    Image,
    HStack,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { useState, useRef, useEffect } from "react";

export default function ImageFullscreenViewer({ imageUrl, isOpen, onClose }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    // Reset zoom and position when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 5)); // Max zoom 5x
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
    };

    const handleResetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle wheel zoom
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
            closeOnOverlayClick={true}
        >
            <ModalOverlay bg="blackAlpha.900" />
            <ModalContent bg="transparent" boxShadow="none">
                <ModalCloseButton
                    color="white"
                    size="lg"
                    zIndex={1000}
                    _hover={{ bg: "blackAlpha.500" }}
                />
                <ModalBody
                    p={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    h="100vh"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    ref={containerRef}
                    cursor={scale > 1 ? (isDragging ? "grabbing" : "grab") : "default"}
                >
                    <Box
                        position="relative"
                        maxW="100vw"
                        maxH="100vh"
                        overflow="hidden"
                    >
                        <Image
                            ref={imageRef}
                            src={imageUrl}
                            alt="Fullscreen view"
                            transform={`scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`}
                            transformOrigin="center center"
                            transition={isDragging ? "none" : "transform 0.1s"}
                            maxW="100vw"
                            maxH="100vh"
                            objectFit="contain"
                            userSelect="none"
                            draggable={false}
                        />
                    </Box>

                    {/* Zoom Controls */}
                    <HStack
                        position="fixed"
                        bottom="40px"
                        left="50%"
                        transform="translateX(-50%)"
                        bg="blackAlpha.700"
                        borderRadius="md"
                        p={2}
                        spacing={2}
                        zIndex={1000}
                    >
                        <IconButton
                            icon={<MinusIcon />}
                            aria-label="Zoom out"
                            onClick={handleZoomOut}
                            colorScheme="whiteAlpha"
                            color="white"
                            isDisabled={scale <= 0.5}
                        />
                        <Box
                            color="white"
                            px={3}
                            py={1}
                            fontSize="sm"
                            fontWeight="medium"
                            minW="60px"
                            textAlign="center"
                            onClick={handleResetZoom}
                            cursor="pointer"
                            _hover={{ bg: "whiteAlpha.200" }}
                            borderRadius="md"
                        >
                            {Math.round(scale * 100)}%
                        </Box>
                        <IconButton
                            icon={<AddIcon />}
                            aria-label="Zoom in"
                            onClick={handleZoomIn}
                            colorScheme="whiteAlpha"
                            color="white"
                            isDisabled={scale >= 5}
                        />
                    </HStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
