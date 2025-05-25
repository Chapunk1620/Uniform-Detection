import React, { useState, useContext } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Badge,
  ActionIcon,
  Table,
  Modal,
  Button,
  TextInput,
  Divider,
  Stack,
  Box,
  ScrollArea,
  Notification,
  Breadcrumbs,
  Anchor,
  Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconSchool,
  IconArrowLeft
} from '@tabler/icons-react';
import classes from '../css/StudentInfo.module.css';
import AuthContext from '../Context/AuthContext';

function CourseStudentsPage({ course, onBack, students: initialStudents = [] }) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editableStudent, setEditableStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  const { authTok } = useContext(AuthContext);

  // The fetching code and loading state have been removed

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setEditableStudent({ ...student });
    setIsEditing(false);
    open();
  };

  const handleEditToggle = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditableStudent({ ...selectedStudent });
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setEditableStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/students/${editableStudent.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authTok?.access}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editableStudent)
      });

      if (!response.ok) throw new Error('Failed to update student');

      const updatedStudent = await response.json();
      const updatedList = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      setStudents(updatedList);
      setSelectedStudent(updatedStudent);
      setEditableStudent(updatedStudent);
      setIsEditing(false);

      setNotification({ message: 'Student updated successfully!', color: 'teal' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Update failed:', error);
      setNotification({ message: 'Failed to update student.', color: 'red' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const deleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/students/${selectedStudent.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authTok?.access}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      setStudents(students.filter(s => s.id !== selectedStudent.id));
      setDeleteModalOpened(false);
      close();

      setNotification({
        message: `Student ${selectedStudent.firstName} ${selectedStudent.lastName} has been deleted.`,
        color: 'teal'
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ message: 'Failed to delete student.', color: 'red' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.middleInitial} ${student.lastName}`.toLowerCase();
    const studentCode = student.studentCode.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) || studentCode.includes(searchLower);
  });

  return (
    <div className={classes.container}>
      {notification && (
        <Notification
          color={notification.color}
          onClose={() => setNotification(null)}
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
        >
          {notification.message}
        </Notification>
      )}

      <div className={classes.headerContainer}>
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={onBack}
          className={classes.backButton}
        >
          Back to Courses
        </Button>
        <Breadcrumbs className={classes.breadcrumbs}>
          <Anchor component="button" onClick={onBack}>Courses</Anchor>
          <Text>{course}</Text>
        </Breadcrumbs>
      </div>

      <Group position="apart" className={classes.courseHeader}>
        <Group>
          <IconSchool size={24} />
          <Title order={2}>{course}</Title>
        </Group>
        <Badge size="lg">{students.length} {students.length === 1 ? 'Student' : 'Students'}</Badge>
      </Group>

      <div className={classes.searchContainer}>
        <TextInput
          icon={<IconSearch size={16} />}
          placeholder="Search by name or student code"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          size="md"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <Text>No students found.</Text>
      ) : (
        <Paper className={classes.tableContainer} shadow="sm" radius="md" withBorder>
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student Code</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Year Level</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredStudents.map((student) => (
                  <Table.Tr key={student.id} onClick={() => viewStudentDetails(student)}>
                    <Table.Td>{student.studentCode}</Table.Td>
                    <Table.Td>{student.firstName} {student.middleInitial} {student.lastName}</Table.Td>
                    <Table.Td>{student.year_level}</Table.Td>
                    <Table.Td>{student.email}</Table.Td>
                    <Table.Td>
                      <Group spacing="xs" onClick={(e) => e.stopPropagation()}>
                        <ActionIcon color="blue" variant="filled" size="lg" onClick={() => viewStudentDetails(student)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon color="red" variant="filled" size="lg" onClick={() => {
                          setSelectedStudent(student);
                          setDeleteModalOpened(true);
                        }}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}

      {/* Modal for Student Details */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Text className={classes.modalTitle}>Student Details</Text>}
        size="lg"
        centered
      >
        {editableStudent && (
          <Box>
            <Stack spacing="sm">
              <TextInput label="First Name" value={editableStudent.firstName} disabled={!isEditing}
                onChange={(e) => handleFieldChange('firstName', e.currentTarget.value)} />
              <TextInput label="Middle Initial" value={editableStudent.middleInitial} disabled={!isEditing}
                onChange={(e) => handleFieldChange('middleInitial', e.currentTarget.value)} />
              <TextInput label="Last Name" value={editableStudent.lastName} disabled={!isEditing}
                onChange={(e) => handleFieldChange('lastName', e.currentTarget.value)} />
              <TextInput label="Student Code" value={editableStudent.studentCode} disabled={!isEditing}
                onChange={(e) => handleFieldChange('studentCode', e.currentTarget.value)} />
              <Select
                label="Year Level"
                data={['1', '2', '3', '4']}
                value={editableStudent.year_level}
                disabled={!isEditing}
                onChange={(value) => handleFieldChange('year_level', value)}
              />
              <TextInput label="Email" value={editableStudent.email} disabled={!isEditing}
                onChange={(e) => handleFieldChange('email', e.currentTarget.value)} />
            </Stack>

            <Group position="right" mt="xl">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button color="teal" onClick={handleSave}>Save</Button>
                </>
              ) : (
                <>
                  <Button color="red" variant="outline" onClick={() => setDeleteModalOpened(true)}>Delete</Button>
                  <Button onClick={handleEditToggle}>Edit</Button>
                  <Button color="gray" onClick={close}>Close</Button>
                </>
              )}
            </Group>
          </Box>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={<Text color="red">Delete Student</Text>}
        centered
      >
        {selectedStudent && (
          <>
            <Text>
              Are you sure you want to delete {selectedStudent.firstName} {selectedStudent.lastName}? This action cannot be undone.
            </Text>
            <Group position="right" mt="xl">
              <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
              <Button color="red" onClick={deleteStudent}>Delete</Button>
            </Group>
          </>
        )}
      </Modal>
    </div>
  );
}

export default CourseStudentsPage;
