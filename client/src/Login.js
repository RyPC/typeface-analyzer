import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    Container,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL;

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerFirstName, setRegisterFirstName] = useState("");
    const [registerLastName, setRegisterLastName] = useState("");
    const [registerInitials, setRegisterInitials] = useState("");
    const [editedInitials, setEditedInitials] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (
            (!editedInitials || registerInitials === "") &&
            registerFirstName &&
            registerLastName
        ) {
            setRegisterInitials(
                registerFirstName.charAt(0).toUpperCase() +
                    registerLastName.charAt(0).toUpperCase()
            );
        }
    }, [registerFirstName, registerLastName]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token in localStorage
                localStorage.setItem("token", data.token);
                onLogin(data.token, data.user);
            } else {
                toast({
                    title: "Login failed",
                    description: data.message || "Invalid credentials",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred during login",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsRegistering(true);

        if (registerPassword !== confirmPassword) {
            toast({
                title: "Registration failed",
                description: "Passwords do not match",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            setIsRegistering(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: registerUsername,
                    password: registerPassword,
                    firstName: registerFirstName,
                    lastName: registerLastName,
                    initials: registerInitials,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Registration successful",
                    description: "Please login with your new account",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                // Reset form
                setRegisterUsername("");
                setRegisterPassword("");
                setConfirmPassword("");
            } else {
                toast({
                    title: "Registration failed",
                    description: data.message || "Could not create account",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred during registration",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <Box
            h="100vh"
            bgGradient="linear(to-b, #A5B2CE, #8D9BB8)"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Container maxW="md">
                <Box
                    bg="white"
                    p={8}
                    borderRadius="lg"
                    boxShadow="xl"
                    backdropFilter="blur(10px)"
                >
                    <VStack spacing={6}>
                        <Box textAlign="center">
                            <Heading color="#000C5C" size="xl" mb={2}>
                                Typeface Analysis
                            </Heading>
                            <Text color="gray.600">
                                Please login or register to continue
                            </Text>
                        </Box>

                        <Tabs isFitted variant="enclosed" width="100%">
                            <TabList mb="1em">
                                <Tab>Login</Tab>
                                <Tab>Register</Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel>
                                    <form
                                        onSubmit={handleSubmit}
                                        style={{ width: "100%" }}
                                    >
                                        <VStack spacing={4}>
                                            <FormControl isRequired>
                                                <FormLabel>Username</FormLabel>
                                                <Input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) =>
                                                        setUsername(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter your username"
                                                />
                                            </FormControl>

                                            <FormControl isRequired>
                                                <FormLabel>Password</FormLabel>
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) =>
                                                        setPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter your password"
                                                />
                                            </FormControl>

                                            <Button
                                                type="submit"
                                                colorScheme="blue"
                                                width="full"
                                                isLoading={isLoading}
                                                bg="#000C5C"
                                                _hover={{ bg: "#001A8C" }}
                                            >
                                                Login
                                            </Button>
                                        </VStack>
                                    </form>
                                </TabPanel>

                                <TabPanel>
                                    <form
                                        onSubmit={handleRegister}
                                        style={{ width: "100%" }}
                                    >
                                        <VStack spacing={4}>
                                            <FormControl isRequired>
                                                <FormLabel>
                                                    First Name
                                                </FormLabel>
                                                <Input
                                                    type="text"
                                                    value={registerFirstName}
                                                    onChange={(e) =>
                                                        setRegisterFirstName(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter your first name"
                                                />
                                            </FormControl>
                                            <FormControl isRequired>
                                                <FormLabel>Last Name</FormLabel>
                                                <Input
                                                    type="text"
                                                    value={registerLastName}
                                                    onChange={(e) =>
                                                        setRegisterLastName(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter your last name"
                                                />
                                            </FormControl>
                                            <FormControl isRequired>
                                                <FormLabel>Initials</FormLabel>
                                                <Input
                                                    type="text"
                                                    value={registerInitials}
                                                    onChange={(e) => {
                                                        setRegisterInitials(
                                                            e.target.value.toUpperCase()
                                                        );
                                                        setEditedInitials(
                                                            e.target.value !==
                                                                ""
                                                        );
                                                    }}
                                                    placeholder="Enter your initials"
                                                />
                                            </FormControl>

                                            <FormControl isRequired>
                                                <FormLabel>Username</FormLabel>
                                                <Input
                                                    type="text"
                                                    value={registerUsername}
                                                    onChange={(e) =>
                                                        setRegisterUsername(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Choose a username"
                                                />
                                            </FormControl>

                                            <FormControl isRequired>
                                                <FormLabel>Password</FormLabel>
                                                <Input
                                                    type="password"
                                                    value={registerPassword}
                                                    onChange={(e) =>
                                                        setRegisterPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Choose a password"
                                                />
                                            </FormControl>

                                            <FormControl isRequired>
                                                <FormLabel>
                                                    Confirm Password
                                                </FormLabel>
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) =>
                                                        setConfirmPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Confirm your password"
                                                />
                                            </FormControl>

                                            <Button
                                                type="submit"
                                                colorScheme="blue"
                                                width="full"
                                                isLoading={isRegistering}
                                                bg="#000C5C"
                                                _hover={{ bg: "#001A8C" }}
                                            >
                                                Register
                                            </Button>
                                        </VStack>
                                    </form>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
}
