import {
    Box,
    Flex,
    Heading,
    Divider,
} from "@chakra-ui/react";

export default function PageHeader({ title, children, ...props }) {
    return (
        <Box px={4} pt={4} flexShrink={0} {...props}>
            <Flex
                direction="row"
                w="100%"
                alignItems="center"
                py={4}
                flexWrap="wrap"
                gap={4}
            >
                <Box mr={4}>
                    <Heading 
                        size="xl" 
                        fontWeight="700"
                        letterSpacing="-0.5px"
                        color="#000C5C"
                    >
                        {title}
                    </Heading>
                </Box>

                {children && (
                    <>
                        <Divider
                            orientation="vertical"
                            height="40px"
                            borderColor="gray.300"
                        />
                        {children}
                    </>
                )}
            </Flex>
        </Box>
    );
}
