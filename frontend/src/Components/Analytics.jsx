import React, { useEffect, useState } from "react";
import {
  Paper,
  Title,
  Grid,
  Select,
  Group,
  Text,
  Card,
  Stack,
  SegmentedControl,
} from "@mantine/core";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { apiFetch } from "../config/api";

const COLORS = ["#2ecc71", "#e74c3c", "#3498db", "#f1c40f", "#9b59b6"];

function Analytics() {
  const [timeFilter, setTimeFilter] = useState("daily");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // State to store the fetched data
  const [fetchedData, setFetchedData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    courseYearData: [],
  });

  const fetchAnalytics = async () => {
    try {
      const response = await apiFetch('/api/analytics/', {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();

      // Make sure data keys exist and fallback to empty arrays if not
      setFetchedData({
        daily: data.daily || [],
        weekly: data.weekly || [],
        monthly: data.monthly || [],
        courseYearData: data.courseYearData || [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Optionally set fallback data or handle error UI
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Use fetched data depending on timeFilter
  const getSelectedData = () => {
    switch (timeFilter) {
      case "weekly":
        return fetchedData.weekly;
      case "monthly":
        return fetchedData.monthly;
      default:
        return fetchedData.daily;
    }
  };
  const selectedData = getSelectedData();

  // Filter courseYearData by course and year filters
  const filteredCourseYearData = fetchedData.courseYearData
    .filter(
      (course) =>
        courseFilter === "all" ||
        course.course.toLowerCase() === courseFilter.toLowerCase()
    )
    .map((course) => ({
      ...course,
      years: course.years.filter(
        (yearData) =>
          yearFilter === "all" ||
          yearData.year.toLowerCase().startsWith(yearFilter.toLowerCase())
      ),
    }))
    .filter((course) => course.years.length > 0);

  // Compute summary counts from filteredCourseYearData
  const totalCompliant = filteredCourseYearData.reduce(
    (courseSum, course) =>
      courseSum +
      course.years.reduce((yearSum, year) => yearSum + year.compliant, 0),
    0
  );
  const totalNonCompliant = filteredCourseYearData.reduce(
    (courseSum, course) =>
      courseSum +
      course.years.reduce((yearSum, year) => yearSum + year.nonCompliant, 0),
    0
  );
  const totalStudents = totalCompliant + totalNonCompliant;

  // Pie chart data (courseDistribution) from filteredCourseYearData
  const courseDistribution = filteredCourseYearData.map((course) => {
    const total = course.years.reduce(
      (sum, y) => sum + y.compliant + y.nonCompliant,
      0
    );
    return {
      course: course.course,
      value: total,
      label: `${course.course} (${total} students)`,
    };
  });

  // Year level compliance bar chart data
  const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const yearLevelCompliance = yearLabels
    .map((year) => {
      let compliant = 0;
      let nonCompliant = 0;
      filteredCourseYearData.forEach((course) => {
        const y = course.years.find((yr) => yr.year === year);
        if (y) {
          compliant += y.compliant;
          nonCompliant += y.nonCompliant;
        }
      });
      return { year, compliant, nonCompliant };
    })
    .filter((item) => item.compliant + item.nonCompliant > 0);

  return (
    <div style={{ padding: "24px" }}>
      <Stack spacing="xl">
        <Group position="apart" align="center">
          <Title order={2}>Uniform Compliance Analytics</Title>
          <Group spacing="md">
            <Select
              label="Course"
              placeholder="All Courses"
              value={courseFilter}
              onChange={setCourseFilter}
              data={[
                { value: "all", label: "All Courses" },
                { value: "bsit", label: "BSIT" },
                { value: "bscs", label: "BSCS" },
                { value: "bsis", label: "BSIS" },
                { value: "bsce", label: "BSCE" },
              ]}
              style={{ width: 200 }}
            />
            <Select
              label="Year Level"
              placeholder="All Years"
              value={yearFilter}
              onChange={setYearFilter}
              data={[
                { value: "all", label: "All Years" },
                { value: "1st", label: "1st Year" },
                { value: "2nd", label: "2nd Year" },
                { value: "3rd", label: "3rd Year" },
                { value: "4th", label: "4th Year" },
              ]}
              style={{ width: 200 }}
            />
          </Group>
        </Group>

        <Grid gutter="lg">
          <Grid.Col span={4}>
            <Card shadow="sm" padding="md">
              <Text>Total Students</Text>
              <Text>{totalStudents}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={4}>
            <Card shadow="sm" padding="md">
              <Text>Compliant</Text>
              <Text color="teal">{totalCompliant}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={4}>
            <Card shadow="sm" padding="md">
              <Text>Non-Compliant</Text>
              <Text color="red">{totalNonCompliant}</Text>
            </Card>
          </Grid.Col>

          {/* Compliance Trend Chart */}
          <Grid.Col span={12}>
            <Paper>
              <Group position="apart">
                <Title order={3}>Compliance Trend</Title>
                <SegmentedControl
                  value={timeFilter}
                  onChange={setTimeFilter}
                  data={[
                    { label: "Daily", value: "daily" },
                    { label: "Weekly", value: "weekly" },
                    { label: "Monthly", value: "monthly" },
                  ]}
                />
              </Group>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={selectedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={
                      timeFilter === "daily"
                        ? "date"
                        : timeFilter === "weekly"
                        ? "week"
                        : "month"
                    }
                    tickFormatter={(tick) => {
                      if (timeFilter === "daily") {
                        const date = new Date(tick);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        });
                      }
                      return tick;
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => {
                      if (timeFilter === "daily") {
                        const date = new Date(label);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        });
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="compliant"
                    stroke="#2ecc71"
                    strokeWidth={2}
                    name="Compliant"
                  />
                  <Line
                    type="monotone"
                    dataKey="nonCompliant"
                    stroke="#e74c3c"
                    strokeWidth={2}
                    name="Non-Compliant"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid.Col>

          <Grid.Col span={6}>
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Title order={3} mb="md">
                Course Distribution
              </Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseDistribution}
                    dataKey="value"
                    nameKey="course"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label }) => label}
                  >
                    {courseDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid.Col>

          <Grid.Col span={6}>
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Title order={3} mb="md">
                Year Level Compliance
              </Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearLevelCompliance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="compliant" fill="#2ecc71" name="Compliant" />
                  <Bar
                    dataKey="nonCompliant"
                    fill="#e74c3c"
                    name="Non-Compliant"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </div>
  );
}

export default Analytics;
