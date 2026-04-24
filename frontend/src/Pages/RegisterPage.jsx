import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../Context/AuthContext";
import { apiFetch } from "../config/api";
import classes from "../css/Authentication.module.css";
import logo from "../assets/logo.png";

import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Image,
} from "@mantine/core";

function RegisterPage() {
  const nav = useNavigate();
  let { loginUser } = useContext(AuthContext);
  var RegisterUser = async (e) => {
    e.preventDefault();

    let response = await apiFetch("/api/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: e.target.username.value,
        email: e.target.email.value,
        password: e.target.password.value,
      }),
    });
    let data = await response.json();
    console.log(data);
    if (response.status == 200) {
      loginUser(e);
      nav("/");
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        <div className={classes.centerAvatar}>
          <Image src={logo} w={120} />
        </div>
        <div className={classes.formTitle}>
          <Text size="xl" fw={500} mt="xl">
            Register
          </Text>
        </div>
        <form
          onSubmit={RegisterUser}
          className="flex flex-col justify-center items-center space-y-4"
        >
          <TextInput
            label="Username"
            type="text"
            name="username"
            placeholder="Enter User Name"
            required
            size="md"
            radius="md"
          />
          <TextInput
            label="Email"
            type="email"
            name="email"
            placeholder="Enter User Email"
            required
            mt="md"
            size="md"
            radius="md"
          />
          <PasswordInput
            label="Password"
            type="password"
            name="password"
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
          >
            Sign up
          </Button>
        </form>
        <Text ta="center" mt="md">
          Already have an account?{" "}
          <Anchor href="/login" fw={500}>
            <Text color="teal.8" component="span">
              Login{" "}
            </Text>
          </Anchor>
        </Text>
      </Paper>
    </div>
  );
}

export default RegisterPage;
