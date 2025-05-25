import React, { useState, useEffect, useContext } from 'react';
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
  LoadingOverlay,
  Notification,
  SimpleGrid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash, IconSearch, IconSchool, IconUser, IconArrowRight } from '@tabler/icons-react';
import classes from '../css/StudentInfo.module.css';
import AuthContext from '../Context/AuthContext';
import CourseStudentsPage from './CourseStudentsPage';

function StudentInfo() {
  const [students, setStudents] = useState([]);
  const [courseGroups, setCourseGroups] = useState({});
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
        const response = await fetch('http://127.0.0.1:8000/api/students/', {
          headers: {
            
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        
        const data = await response.json();
        console.log(data)
        setStudents(data);
        
        // Group students by course
        const groupedByCourse = data.reduce((acc, student) => {
          const course = student?.course?.name;
          if (!acc[course]) {
            acc[course] = [];
          }
          acc[course].push(student);
          return acc;
        }, {});
        
        setCourseGroups(groupedByCourse);
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
        
        // Group dummy data by course
        const groupedByCourse = dummyData.reduce((acc, student) => {
          const course = student.course.name;
          if (!acc[course]) {
            acc[course] = [];
          }
          acc[course].push(student);
          return acc;
        }, {});
        
        setCourseGroups(groupedByCourse);
      } finally {
        setLoading(false);
      }
    };

  // Fetch students data
  useEffect(() => {
    fetchStudents();
  }, []);

  // Navigate to course students page
  const viewCourseStudents = (course) => {
    setSelectedCourse(course);
  };
  
  // Go back to courses view
  const goBackToCourses = () => {
    setSelectedCourse(null);
  };

  // View student details
  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    open();
  };

  // Delete student
  const deleteStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/student/${selectedStudent.id}/`, {
        method: 'DELETE',
        headers: {
          
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
      
      // Update local state
      const updatedStudents = students.filter(s => s.id !== selectedStudent.id);
      setStudents(updatedStudents);
      
      // Update course groups
      const updatedGroups = { ...courseGroups };
      updatedGroups[selectedStudent.course] = updatedGroups[selectedStudent.course].filter(
        s => s.id !== selectedStudent.id
      );
      
      if (updatedGroups[selectedStudent.course].length === 0) {
        delete updatedGroups[selectedStudent.course];
      }
      
      setCourseGroups(updatedGroups);
      setDeleteModalOpened(false);
      close();
      
      // Show success notification
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

  // Filter courses based on search query
  const filteredCourseGroups = Object.entries(courseGroups).reduce((acc, [course, students]) => {
    // Check if course name matches search query
    const courseLower = course.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    if (courseLower.includes(searchLower)) {
      acc[course] = students;
      return acc;
    }
    
    // Check if any student in the course matches search query
    const filteredStudents = students.filter(student => {
      const fullName = `${student.firstName} ${student.middleInitial} ${student.lastName}`.toLowerCase();
      const studentCode = student.studentCode.toLowerCase();
      
      return fullName.includes(searchLower) || studentCode.includes(searchLower);
    });
    
    if (filteredStudents.length > 0) {
      acc[course] = students; // Keep all students in the course if any match
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
          course={selectedCourse} 
          onBack={goBackToCourses} 
          students={courseGroups[selectedCourse]} 
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
          
          {Object.keys(filteredCourseGroups).length === 0 ? (
            <Text className={classes.emptyState}>
              {loading ? 'Loading courses...' : 'No courses found matching your search criteria.'}
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" className={classes.courseGrid}>
              {Object.entries(filteredCourseGroups).map(([course, students]) => (
                <Paper 
                  key={course} 
                  className={classes.courseCard} 
                  shadow="sm" 
                  radius="md" 
                  withBorder
                  onClick={() => viewCourseStudents(course)}
                >
                  <div className={classes.courseCardContent}>
                    <Group className={classes.courseCardHeader}>
                      <IconSchool size={24} />
                      <Title order={3} className={classes.courseTitle}>{course}</Title>
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
                          viewCourseStudents(course);
                        }}
                      >
                        View Students
                      </Button>
                    </Group>
                  </div>
                </Paper>
              ))}
            </SimpleGrid>
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
              <Badge size="lg" color="teal">{selectedStudent.course}</Badge>
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