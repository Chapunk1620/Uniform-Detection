import React, { useState, useEffect, useContext } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Modal,
  Button,
  TextInput,
  Divider,
  Stack,
  Box,
  LoadingOverlay,
  Notification,
  SimpleGrid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconSchool, IconUser, IconArrowRight } from '@tabler/icons-react';
import { apiFetch } from '../config/api';
import classes from '../css/StudentInfo.module.css';
import AuthContext from '../Context/AuthContext';
import CourseStudentsPage from './CourseStudentsPage';

function StudentInfo() {
  const [students, setStudents] = useState([]);
  const [courseYearGroups, setCourseYearGroups] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const { authTok } = useContext(AuthContext);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/students/', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);

      const grouped = data.reduce((acc, student) => {
        const course = student.course?.name || student.course;
        const year = `Year ${student.year_level}`;
        if (!acc[course]) acc[course] = {};
        if (!acc[course][year]) acc[course][year] = [];
        acc[course][year].push(student);
        return acc;
      }, {});

      setCourseYearGroups(grouped);
    } catch (error) {
      console.error('Error fetching students:', error);

      const dummyData = [
        { id: 1, firstName: 'John', middleInitial: 'A', lastName: 'Doe', studentCode: '2023001', course: 'BSIT', year_level: '3', email: 'john.doe@example.com' },
        { id: 2, firstName: 'Jane', middleInitial: 'B', lastName: 'Smith', studentCode: '2023002', course: 'BSIT', year_level: '2', email: 'jane.smith@example.com' },
        { id: 3, firstName: 'Michael', middleInitial: 'C', lastName: 'Johnson', studentCode: '2023003', course: 'BSCS', year_level: '4', email: 'michael.j@example.com' },
        { id: 4, firstName: 'Emily', middleInitial: 'D', lastName: 'Brown', studentCode: '2023004', course: 'BSCS', year_level: '1', email: 'emily.b@example.com' },
        { id: 5, firstName: 'David', middleInitial: 'E', lastName: 'Wilson', studentCode: '2023005', course: 'BSIS', year_level: '3', email: 'david.w@example.com' },
      ];

      setStudents(dummyData);

      const grouped = dummyData.reduce((acc, student) => {
        const course = student.course;
        const year = `Year ${student.year_level}`;
        if (!acc[course]) acc[course] = {};
        if (!acc[course][year]) acc[course][year] = [];
        acc[course][year].push(student);
        return acc;
      }, {});

      setCourseYearGroups(grouped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const viewCourseStudents = ({ course, year }) => {
    setSelectedCourse({ course, year });
  };

  const goBackToCourses = () => {
    setSelectedCourse(null);
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    open();
  };

  const deleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      const response = await apiFetch(`/api/student/${selectedStudent.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      const updatedStudents = students.filter(s => s.id !== selectedStudent.id);
      setStudents(updatedStudents);

      const updatedGroups = { ...courseYearGroups };
      const course = selectedStudent.course;
      const year = `Year ${selectedStudent.year_level}`;

      if (updatedGroups[course] && updatedGroups[course][year]) {
        updatedGroups[course][year] = updatedGroups[course][year].filter(s => s.id !== selectedStudent.id);
        if (updatedGroups[course][year].length === 0) {
          delete updatedGroups[course][year];
        }
        if (Object.keys(updatedGroups[course]).length === 0) {
          delete updatedGroups[course];
        }
      }

      setCourseYearGroups(updatedGroups);
      setDeleteModalOpened(false);
      close();

      setNotification({
        message: `Student ${selectedStudent.firstName} ${selectedStudent.lastName} has been deleted.`,
        color: 'teal'
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting student:', error);
      setNotification({
        message: 'Failed to delete student. Please try again.',
        color: 'red'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredCourseYearGroups = Object.entries(courseYearGroups).reduce((acc, [course, years]) => {
    const courseLower = course.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const filteredYears = Object.entries(years).reduce((yearAcc, [year, students]) => {
      const filteredStudents = students.filter(student => {
        const fullName = `${student.firstName} ${student.middleInitial} ${student.lastName}`.toLowerCase();
        const studentCode = student.studentCode.toLowerCase();
        return (
          courseLower.includes(searchLower) ||
          year.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower) ||
          studentCode.includes(searchLower)
        );
      });

      if (filteredStudents.length > 0) {
        yearAcc[year] = filteredStudents;
      }

      return yearAcc;
    }, {});

    if (Object.keys(filteredYears).length > 0) {
      acc[course] = filteredYears;
    }

    return acc;
  }, {});

  return (
    <div className={classes.container}>
      <LoadingOverlay visible={loading} overlayBlur={2} />

      {notification && (
        <Notification
          color={notification.color}
          onClose={() => setNotification(null)}
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
        >
          {notification.message}
        </Notification>
      )}

      {selectedCourse ? (
        <CourseStudentsPage
          course={selectedCourse.course}
          year={selectedCourse.year}
          onBack={goBackToCourses}
          students={courseYearGroups[selectedCourse.course]?.[selectedCourse.year] || []}
        />
      ) : (
        <>
          <Title order={2} className={classes.title}>Student Information</Title>

          <div className={classes.searchContainer}>
            <TextInput
              icon={<IconSearch size={16} />}
              placeholder="Search by course, name or student code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              radius="md"
              size="md"
            />
          </div>

          {Object.keys(filteredCourseYearGroups).length === 0 ? (
            <Text className={classes.emptyState}>
              {loading ? 'Loading students...' : 'No matches found.'}
            </Text>
          ) : (
            Object.entries(filteredCourseYearGroups).map(([course, yearMap]) => (
              <Box key={course} mb="xl">
                <Title order={3} className={classes.courseTitle}>{course}</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="md">
                  {Object.entries(yearMap).map(([year, students]) => (
                    <Paper
                      key={`${course}-${year}`}
                      className={classes.courseCard}
                      shadow="sm"
                      radius="md"
                      withBorder
                      onClick={() => viewCourseStudents({ course, year })}
                    >
                      <div className={classes.courseCardContent}>
                        <Group className={classes.courseCardHeader}>
                          <IconSchool size={24} />
                          <Title order={4} className={classes.courseTitle}>{year}</Title>
                        </Group>

                        <Badge size="lg" className={classes.studentCount}>
                          {students.length} {students.length === 1 ? 'Student' : 'Students'}
                        </Badge>

                        <Group position="right" mt="md">
                          <Button
                            rightSection={<IconArrowRight size={16} />}
                            variant="light"
                            color="teal"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewCourseStudents({ course, year });
                            }}
                          >
                            View Students
                          </Button>
                        </Group>
                      </div>
                    </Paper>
                  ))}
                </SimpleGrid>
              </Box>
            ))
          )}
        </>
      )}

      {/* Student Details Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Text className={classes.modalTitle}>Student Details</Text>}
        size="lg"
        centered
      >
        {selectedStudent && (
          <Box>
            <Group position="apart" mb="md">
              <Group>
                <IconUser size={24} />
                <Title order={3}>
                  {selectedStudent.firstName} {selectedStudent.middleInitial} {selectedStudent.lastName}
                </Title>
              </Group>
              <Badge size="lg" color="teal">
                {selectedStudent.course} - Year {selectedStudent.year_level}
              </Badge>
            </Group>

            <Divider my="md" />

            <Stack spacing="md">
              <div className={classes.modalSection}>
                <Text className={classes.modalLabel}>Student Code</Text>
                <Text className={classes.modalValue}>{selectedStudent.studentCode}</Text>
              </div>

              <div className={classes.modalSection}>
                <Text className={classes.modalLabel}>Year Level</Text>
                <Text className={classes.modalValue}>{selectedStudent.year_level}</Text>
              </div>

              <div className={classes.modalSection}>
                <Text className={classes.modalLabel}>Email</Text>
                <Text className={classes.modalValue}>{selectedStudent.email}</Text>
              </div>
            </Stack>

            <Group position="right" mt="xl">
              <Button
                variant="outline"
                color="red"
                onClick={() => {
                  close();
                  setDeleteModalOpened(true);
                }}
              >
                Delete Student
              </Button>
              <Button color="teal" onClick={close}>Close</Button>
            </Group>
          </Box>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={<Text className={classes.modalTitle} color="red">Delete Student</Text>}
        centered
      >
        {selectedStudent && (
          <>
            <Text size="md">
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

export default StudentInfo;
