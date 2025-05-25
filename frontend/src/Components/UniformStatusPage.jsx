import React, { useState, useEffect } from 'react';
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Paper,
  Collapse,
  ActionIcon,
  Button,
  Divider
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconEye } from '@tabler/icons-react';
import classes from '../css/UniformStatus.module.css';

function UniformStatusPage() {
  const [statusList, setStatusList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); // { course, date, logs }
  const [expandedCards, setExpandedCards] = useState(new Set());

  const dummyData = [
    {
      student: {
        fullName: 'John Doe',
        studentId: '2023-001',
        year_level: '3rd Year',
        course: { name: 'BSIT' }
      },
      timestamp: new Date().toISOString(),
      isProper: true,
      log_type: 'CU',
    },
    {
      student: {
        fullName: 'Jane Smith',
        studentId: '2023-002',
        year_level: '2nd Year',
        course: { name: 'BSCS' }
      },
      timestamp: new Date().toISOString(),
      isProper: false,
      log_type: 'VIOLATION',
    },
    {
      student: {
        fullName: 'Mark Johnson',
        studentId: '2023-003',
        year_level: '4th Year',
        course: { name: 'BSIS' }
      },
      timestamp: new Date().toISOString(),
      isProper: true,
      log_type: 'CU',
    },
  ];

  useEffect(() => {
    fetchStatusList();
  }, []);

  const fetchStatusList = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/logs/');
      if (!response.ok) throw new Error('Failed to fetch status list');
      const data = await response.json();
      setStatusList(data);
    } catch (error) {
      console.error('Error fetching uniform status, using dummy data:', error);
      setStatusList(dummyData);
    }
  };

  const groupByCourseAndDate = (data) => {
    const grouped = {};
    data.forEach((item) => {
      const course = item.student?.course?.name || 'Unknown';
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (!grouped[course]) grouped[course] = {};
      if (!grouped[course][date]) grouped[course][date] = [];
      grouped[course][date].push(item);
    });
    return grouped;
  };

  const handleOpenModal = (course, date, logs) => {
    setSelectedGroup({ course, date, logs });
    setModalOpen(true);
    setExpandedCards(new Set());
  };

  const toggleCard = (id) => {
    const updated = new Set(expandedCards);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setExpandedCards(updated);
  };

  const groupedStatus = groupByCourseAndDate(statusList);

  return (
    <div className={classes.container}>
      <Title order={2} className={classes.title}>Student Uniform Status</Title>
      <Stack spacing="md">
        {Object.entries(groupedStatus).map(([course, dates]) =>
          Object.entries(dates).map(([date, logs]) => (
            <Paper key={`${course}-${date}`} p="md" shadow="xs" withBorder>
              <Group position="apart">
                <div>
                  <Text weight={600}>{course}</Text>
                  <Text size="sm" color="dimmed">{new Date(date).toDateString()}</Text>
                </div>
                <Button
                  leftIcon={<IconEye size={16} />}
                  onClick={() => handleOpenModal(course, date, logs)}
                >
                  View Logs
                </Button>
              </Group>
            </Paper>
          ))
        )}

        {statusList.length === 0 && (
          <Text align="center" color="dimmed">No uniform status records found</Text>
        )}
      </Stack>

      {/* Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        title={
          selectedGroup && (
            <div>
              <Text weight={600}>{selectedGroup.course}</Text>
              <Text size="sm" color="dimmed">
                {new Date(selectedGroup.date).toDateString()}
              </Text>
            </div>
          )
        }
        scrollArea="inside"
      >
        {selectedGroup?.logs.map((status) => {
          const cardId = `${status.student.studentId}-${status.timestamp}`;
          return (
            <Paper
              key={cardId}
              shadow="sm"
              radius="md"
              p="md"
              withBorder
              mb="sm"
              className={classes.statusCard}
            >
              <Group position="apart" mb={expandedCards.has(cardId) ? 'md' : 0}>
                <div>
                  <Group spacing="xs">
                    <Text size="lg" weight={500}>{status.student.fullName}</Text>
                    <Badge size="sm" variant="dot" color={status.isProper ? 'green' : 'red'}>
                      {status.student.course.name}
                    </Badge>
                  </Group>
                  <Text size="sm" color="dimmed">{status.student.studentId}</Text>
                  <Text size="sm">{new Date(status.timestamp).toLocaleString()}</Text>
                </div>
                <Group spacing="sm">
                  <Badge
                    size="lg"
                    color={status.log_type === "CU" ? 'green' : 'red'}
                    variant="filled"
                  >
                    {status.log_type === "CU" ? 'Proper Uniform' : 'Improper Uniform'}
                  </Badge>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => toggleCard(cardId)}
                    aria-label="Toggle details"
                  >
                    {expandedCards.has(cardId) ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </ActionIcon>
                </Group>
              </Group>
              <Collapse in={expandedCards.has(cardId)}>
                <Divider mb="xs" />
                <Stack spacing="xs" mt="xs">
                  <Group spacing="xl">
                    <div>
                      <Text size="sm" weight={500}>Year Level</Text>
                      <Text size="sm">{status.student.year_level}</Text>
                    </div>
                  </Group>
                </Stack>
              </Collapse>
            </Paper>
          );
        })}
      </Modal>
    </div>
  );
}

export default UniformStatusPage;
