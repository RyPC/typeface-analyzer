import { Flex, Button, Text } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

export default function Pagination({
    currentPage,
    totalPages,
    onPrevious,
    onNext,
    pageLabel = "Page"
}) {
    return (
        <Flex justify="center" align="center" mt={4} gap={4}>
            <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={onPrevious}
                isDisabled={currentPage === 1}
            >
                Previous
            </Button>
            <Text>
                {pageLabel} {currentPage} of {totalPages}
            </Text>
            <Button
                rightIcon={<ChevronRightIcon />}
                onClick={onNext}
                isDisabled={currentPage === totalPages}
            >
                Next
            </Button>
        </Flex>
    );
}

