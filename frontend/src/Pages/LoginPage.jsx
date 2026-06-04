import { useContext, useState } from "react";
import AuthContext from "../Context/AuthContext";
import classes from "../css/Authentication.module.css";
import logo from "../assets/logo.png";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";

import {
  Anchor,
  Alert,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Image,
} from "@mantine/core";

function Login() {
  const [loginError, setLoginError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  let { loginUser } = useContext(AuthContext);

  const handleLoginSubmit = async (event) => {
    setLoginError("");
    setIsSigningIn(true);

    const result = await loginUser(event);

    if (result?.success === false) {
      setLoginError(result.message);
      notifications.show({
        title: "Sign in unsuccessful",
        message: result.message,
        color: "yellow",
        icon: <IconAlertCircle size={18} />,
      });
    }

    setIsSigningIn(false);
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        <div className={classes.centerAvatar}>
          <Image   src={logo} w={120}  />
        </div>

        <form
          onSubmit={handleLoginSubmit}
          className="flex flex-col justify-center items-center space-y-2"
        >
          {loginError && (
            <Alert
              color="yellow"
              icon={<IconAlertCircle size={18} />}
              mt="md"
              role="alert"
              title="Please check your sign in details"
              variant="light"
            >
              {loginError}
            </Alert>
          )}
          <TextInput
            label="Username"
            type="text"
            name="username"
            placeholder="Enter Username"
            required
            mt="md"
            size="md"
            radius="md"
          />
          <PasswordInput
            label="Password"
            type="password"
            name="password"
            id=""
            placeholder="Enter Password"
            required
            mt="md"
            size="md"
            radius="md"
          />
          <Button
            type="submit"
            fullWidth
            mt="xl"
            size="md"
            radius="md"
            color="teal.9"
            loading={isSigningIn}
          >
            {isSigningIn ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <Text ta="center" mt="md">
          Don&apos;t have an account?{" "}
          <Anchor href="/register" fw={500}>
            <Text color="teal.8" component="span">
              Register{" "}
            </Text>
          </Anchor>
        </Text>
      </Paper>
    </div>
  );
}

export default Login;
