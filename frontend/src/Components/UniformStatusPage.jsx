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
  Divider,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconEye } from '@tabler/icons-react';
import classes from '../css/UniformStatus.module.css';

function UniformStatusPage() {
  const [statusList, setStatusList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  // selectedGroup: { course, year, date, logs }
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const dummyData = [
    {
      student: {
        fullName: 'John Doe',
        studentId: '2023-001',
        year_level: '3rd Year',
        course: { name: 'BSIT' },
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
        course: { name: 'BSCS' },
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
        course: { name: 'BSIS' },
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

  // Group by course -> year_level -> date
  const groupByCourseYearDate = (data) => {
    const grouped = {};
    data.forEach((item) => {
      const course = item.student?.course?.name || 'Unknown';
      const year = item.student?.year_level || 'Unknown';
      const date = new Date(item.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD

      if (!grouped[course]) grouped[course] = {};
      if (!grouped[course][year]) grouped[course][year] = {};
      if (!grouped[course][year][date]) grouped[course][year][date] = [];

      grouped[course][year][date].push(item);
    });
    return grouped;
  };

  // Group logs by date for modal view
  const groupLogsByDate = (logs) => {
    const grouped = {};
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });
    return grouped;
  };

  const handleOpenModal = (course, year, date, logs) => {
    setSelectedGroup({ course, year, date, logs });
    setModalOpen(true);
    setExpandedCards(new Set());
  };

  const toggleCard = (id) => {
    const updated = new Set(expandedCards);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setExpandedCards(updated);
  };

  const groupedStatus = groupByCourseYearDate(statusList);

  return (
    <div className={classes.container}>
      <Title order={2} className={classes.title}>
        Student Uniform Status
      </Title>
      <Stack spacing="md">
        {Object.entries(groupedStatus).map(([course, years]) =>
          Object.entries(years).map(([year, dates]) =>
            Object.entries(dates).map(([date, logs]) => (
              <Paper key={`${course}-${year}-${date}`} p="md" shadow="xs" withBorder>
                <Group position="apart">
                  <div>
                    <Text weight={600}>{course}</Text>
                    <Text size="sm" color="dimmed">
                      Year: {year} - {new Date(date).toDateString()}
                    </Text>
                  </div>
                  <Button
                    leftIcon={<IconEye size={16} />}
                    onClick={() => handleOpenModal(course, year, date, logs)}
                  >
                    View Logs
                  </Button>
                </Group>
              </Paper>
            ))
          )
        )}

        {statusList.length === 0 && (
          <Text align="center" color="dimmed">
            No uniform status records found
          </Text>
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
                Year: {selectedGroup.year} - {new Date(selectedGroup.date).toDateString()}
              </Text>
            </div>
          )
        }
        scrollArea="inside"
      >
        {selectedGroup &&
          (() => {
            const logsByDate = groupLogsByDate(selectedGroup.logs);

            return Object.entries(logsByDate).map(([date, logs]) => (
              <div key={date} style={{ marginBottom: 20 }}>
                <Text
                  weight={700}
                  size="lg"
                  mb="md"
                  style={{ borderBottom: '1px solid #ccc', paddingBottom: 4 }}
                >
                  {new Date(date).toDateString()}
                </Text>

                {logs.map((status) => {
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
                            <Text size="lg" weight={500}>
                              {status.student.fullName}
                            </Text>
                            <Badge size="sm" variant="dot" color={status.isProper ? 'green' : 'red'}>
                              {status.student.course.name}
                            </Badge>
                          </Group>
                          <Text size="sm" color="dimmed">
                            {status.student.studentId}
                          </Text>
                          <Text size="sm">{new Date(status.timestamp).toLocaleTimeString()}</Text>
                        </div>
                        <Group spacing="sm">
                          <Badge
                            size="lg"
                            color={status.log_type === 'CU' ? 'green' : 'red'}
                            variant="filled"
                          >
                            {status.log_type === 'CU' ? 'Proper Uniform' : 'Improper Uniform'}
                          </Badge>
                          <ActionIcon
                            variant="subtle"
                            onClick={() => toggleCard(cardId)}
                            aria-label="Toggle details"
                          >
                            {expandedCards.has(cardId) ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Collapse in={expandedCards.has(cardId)}>
                        <Divider mb="xs" />
                        <Stack spacing="xs" mt="xs">
                          <Group spacing="xl">
                            <div>
                              <Text size="sm" weight={500}>
                                Year Level
                              </Text>
                              <Text size="sm">{status.student.year_level}</Text>
                            </div>
                          </Group>
                        </Stack>
                      </Collapse>
                    </Paper>
                  );
                })}
              </div>
            ));
          })()}
      </Modal>
    </div>
  );
}

export default UniformStatusPage;
