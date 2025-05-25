import React, { useState } from "react";
import {
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  MantineProvider,
  Stack,
  Box,
  Modal,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";

function RegisterStudentForm() {
  const [opened, setOpened] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: '',
      middleInitial: '',
      lastName: '',
      studentCode: '',
      course: '',
      year_level: '',
      email: '',
      password: '',
    },
    validate: {
      firstName: (value) => (value.length < 2 ? 'First name must have at least 2 letters' : null),
      lastName: (value) => (value.length < 2 ? 'Last name must have at least 2 letters' : null),
      studentCode: (value) => (value.length < 5 ? 'Student code must be at least 5 characters long' : null),
      course: (value) => (value ? null : 'Please select a course'),
      year_level: (value) => (/^[1-5]$/.test(value) ? null : 'Year level must be between 1-5'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length < 8
          ? 'Password must be at least 8 characters long'
          : !/\d/.test(value)
          ? 'Password must include at least one number'
          : !/[a-z]/.test(value)
          ? 'Password must include at least one lowercase letter'
          : !/[A-Z]/.test(value)
          ? 'Password must include at least one uppercase letter'
          : null,
    },
  });

  const RegisterStudent = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      let response = await fetch('http://127.0.0.1:8000/api/students/', {
        method: 'POST',
        body: formData,
      });

      let data = await response.json();

      if (response.ok) {
        setOpened(true);
        form.reset();
        console.log('Success: Registration successful!');
        setTimeout(() => {
          setOpened(false);
          // loginUser(values); // Uncomment if defined
          // nav('/'); // Uncomment if using useNavigate
        }, 2000);
      } else {
        console.log('Registration Failed:', data.message || 'An error occurred during registration');
      }
    } catch (error) {
      console.log('Error: Network error or server is not responding');
    }
  };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: 'light', primaryColor: 'teal' }}>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <Container size="lg" my={40}>
          <Paper radius="md" p="xl" withBorder>
            <Title order={2} ta="center" mt="md" mb={50}>
              Student Registration
            </Title>

            <form onSubmit={form.onSubmit(RegisterStudent)}>
              <Stack spacing="lg">
                <Modal
                  opened={opened}
                  onClose={() => setOpened(false)}
                  title="Registration Successful"
                  centered
                  styles={{
                    modal: {
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    },
                  }}
                >
                  <Text align="center" size="lg" weight={500}>
                    Your registration was successful! 
                  </Text>
                </Modal>

                <Group grow>
                  <TextInput
                    label="First Name"
                    placeholder="Enter First Name"
                    radius="md"
                    size="md"
                    required
                    {...form.getInputProps('firstName')}
                  />
                  <TextInput
                    label="Middle Initial"
                    placeholder="Enter Middle Initial"
                    radius="md"
                    size="md"
                    {...form.getInputProps('middleInitial')}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Enter Last Name"
                    radius="md"
                    size="md"
                    required
                    {...form.getInputProps('lastName')}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label="Student Code"
                    placeholder="Enter Student Code"
                    radius="md"
                    size="md"
                    required
                    {...form.getInputProps('studentCode')}
                  />

                  <Select
                    label="Course"
                    placeholder="Select Course"
                    radius="md"
                    size="md"
                    required
                    data={[
                      { value: 'BSCS', label: 'BS Computer Science' },
                      { value: 'BSIT', label: 'BS Information Technology' },
                      { value: 'BSCpE', label: 'BS Computer Engineering' },
                      { value: 'BSIS', label: 'BS Information Systems' },
                      { value: 'BSECE', label: 'BS Electronics and Communications Engineering' },
                    ]}
                    {...form.getInputProps('course')}
                  />

                  <Select
                    label="Year Level"
                    placeholder="Select Year Level"
                    radius="md"
                    size="md"
                    required
                    data={[
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4', label: '4' },
                      { value: '5', label: '5' },
                    ]}
                    {...form.getInputProps('year_level')}
                  />
                </Group>

                <TextInput
                  label="Email"
                  type="email"
                  placeholder="Enter User Email"
                  radius="md"
                  size="md"
                  required
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter Password"
                  radius="md"
                  size="md"
                  required
                  {...form.getInputProps('password')}
                />

                <Button type="submit" size="md" radius="md" fullWidth mt="xl">
                  Register
                </Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    </MantineProvider>
  );
}

export default RegisterStudentForm;
