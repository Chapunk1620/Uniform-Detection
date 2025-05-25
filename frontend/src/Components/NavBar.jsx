import React, { useContext, useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import logo from "../assets/logo.png";
import cx from "clsx";
import {
  Avatar,
  Burger,
  Container,
  Group,
  Tabs,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "../css/Navbar.module.css";
import AuthContext from "../Context/AuthContext";



function NavBar({ setPage }) {
  const { role } = useContext(AuthContext);
  const [opened, { toggle }] = useDisclosure(false);

  const adminTabs = [
    { label: "Home", value: "home" },
    { label: "Scan ID", value: "scanId" },
    { label: "Student Log", value: "status" },
    { label: "Student Information", value: "studentInfo" },
    { label: "Register Student", value: "registerStudent" },
  ];

  const studentTabs = [
    { label: "Home", value: "Studenthome" },
    { label: "Student Log", value: "StudentLog" },
  ];

  const tabs = role === "Admin" ? adminTabs : role === "Student" ? studentTabs : [];

  return (
    <div className={classes.header}>
      <Container className={classes.mainSection} size="md">
        <Group>
          <Group>
            <Avatar
              src={logo}
              size={40}
              radius="md"
            />
            <div>
              <Text className={classes.logo}>CvSU</Text>
              <Text size="xs" c="dimmed" fw={500}>
                Uniform Detection System
              </Text>
            </div>
          </Group>
        </Group>
      </Container>

      <Container size="md">
        <Tabs
          defaultValue={tabs[0]?.value || ""}
          variant="outline"
          visibleFrom="sm"
          classNames={{
            root: classes.tabs,
            list: classes.tabsList,
            tab: classes.tab,
          }}
          onChange={(value) => setPage(value)}
        >
          <Tabs.List style={{ display: 'flex', width: '100%' }}>
            <div style={{ display: 'flex', flex: 1 }}>
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.value} value={tab.value}>
                  {tab.label}
                </Tabs.Tab>
              ))}
            </div>
            <UnstyledButton
              className={classes.tab}
              style={{ marginLeft: 'auto', color: 'red' }}
              onClick={() => {
                console.log('Logout clicked');
              }}
            >
              <Group gap={7}>
                <IconLogout size={16} stroke={1.5} />
                <Text>Logout</Text>
              </Group>
            </UnstyledButton>
          </Tabs.List>
        </Tabs>

        <div className={classes.mobileNav}>
          <Burger opened={opened} onClick={toggle} size="sm" />
          {opened && (
            <div className={classes.mobileMenu}>
              {tabs.map((tab) => (
                <UnstyledButton
                  key={tab.value}
                  className={classes.link}
                  onClick={() => {
                    setPage(tab.value);
                    toggle();
                  }}
                >
                  {tab.label}
                </UnstyledButton>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default NavBar;
