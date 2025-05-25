import React, { useState } from "react";
import NavBar from "../Components/NavBar";
import RegisterStudentForm from "../Components/RegisterStudentForm";
import ScanPage from "../Components/ScanPage";
import Analytics from "../Components/Analytics";
import ScanUniPage from "../Components/ScanUniPage";
import UniformStatusPage from "../Components/UniformStatusPage";
import StudentInfo from "../Components/StudentInfo";

function AdminPage() {
  const [page, setPage] = useState("home");

  return (
    <>
      <NavBar setPage={setPage}></NavBar>
      {page === "home" ? (
        <Analytics />
      ) : page === "scanId" ? (
        <ScanPage />
      ) : page === "status" ? (
        <UniformStatusPage />
      ) : page === "studentInfo" ? (
        <StudentInfo />
      ) : page === "registerStudent" ? (
        <RegisterStudentForm />
      ) : (
        <div></div>
      )}
    </>
  );
}

export default AdminPage;
