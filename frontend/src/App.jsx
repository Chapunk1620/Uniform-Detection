import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import Home from "./Pages/Home";
import PrivateRoutes from "./Context/PrivateRoutes";
import AdminPage from "./Pages/AdminPage";
import StudentPage from "./Pages/StudentPage";
import { MantineProvider, Paper, Text, Title } from "@mantine/core";
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import { hasApiBaseUrl } from "./config/api";


function App() {
  const [count, setCount] = useState(0);

  if (!hasApiBaseUrl) {
    return (
      <MantineProvider   theme={{
        focusRing: 'always',
        defaultRadius: 'md',
        primaryColor: 'teal',}}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f4f7f6' }}>
          <Paper shadow="md" radius="lg" p="xl" withBorder style={{ maxWidth: '520px', width: '100%' }}>
            <Title order={2} ta="center">System Temporarily Unavailable</Title>
            <Text ta="center" mt="md" c="dimmed">
              The application is not ready to connect right now. Please contact the administrator and try again later.
            </Text>
          </Paper>
        </div>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider   theme={{
      focusRing: 'always', // or 'auto' / 'never'
      defaultRadius: 'md',
      primaryColor: 'teal',}}>
      <Notifications position="top-right" />

      <Router>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoutes>
                  <Home />
                </PrivateRoutes>
              }
            />

            <Route
              path="/admin"
              element={
                <PrivateRoutes>
                  <AdminPage />
                </PrivateRoutes>
              }
            />

            <Route
              path="/student"
              element={
                <PrivateRoutes>
                  <StudentPage />
                </PrivateRoutes>
              }
            />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
}

export default App;
