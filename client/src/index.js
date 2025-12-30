import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Login from "./components/Login";
import UserGroup from "./components/UserGroups";
import Layout from "./components/Layout";
import UserActivity from "./components/UserActivity";
import AOCR from "./components/AOCR";
import DOCR from "./components/DOCR";
import DeviceReport from "./components/DeviceReport";
import Application from "./components/Application";
import Scans from "./components/Scans";
import Approvals from "./components/Approvals";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import SplunkData from "./components/Credentials";
import AddIP from "./components/AddIP";
import Register from "./components/Register";
import Users from "./components/Users";
import AuthorizedUser from "./components/AuthorizedUser";
import EditUser, { loader as userLoader } from "./components/EditUser";
import Welcome from "./components/Welcome";
import UserGroupMaping from "./components/UserGroupMaping";
import ConfigPage from "./components/ConfigPage";
import store from "./store";
// import ReportScheduler from "./components/ReportScheduler";
import AdminReportScheduler from "./components/AdminReportScheduler";
import ConfigTabs from "./components/Config/ConfigTabs";
import Authentications from "./components/Authentications";
import UsergroupRestrictions from "./components/UsergroupRestrictions";
import TargetgroupRestrictions from "./components/TargetgroupRestrictions";
import ScanJobsReport from "./components/ScanJobsReport";
import SMTPConfigForm from "./components/SMTPConfigForm";
import ReportMailerTrigger from "./components/automation/ReportMailerTrigger";
import OutOfOfficeReport from "./components/OutOfOfficeReport";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Welcome />} />
        <Route path="user-group" element={<UserGroup />} />
        <Route path="user-activity" element={<UserActivity />} />
        {/* <Route path="DOCR" element={<DOCR />} /> */}
        <Route path="scans" element={<Scans />} />
        <Route path="scanjobs" element={<ScanJobsReport />} />
        <Route path="device-report" element={<DeviceReport />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="credentials" element={<SplunkData />} />
        <Route path="application" element={<Application />} />
        <Route path="user-group-maping" element={<UserGroupMaping />} />
        <Route path="authentications" element={<Authentications />} />
        <Route
          path="usergroupRestrictions"
          element={<UsergroupRestrictions />}
        />
        <Route path="OutOfOfficeReport" element={<OutOfOfficeReport />} />
        <Route
          path="targetgrouprestrictions"
          element={<TargetgroupRestrictions />}
        />
        <Route path="Addipaddress" element={<AddIP />} />
        <Route
          path="Register"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="config"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ConfigTabs />
            </ProtectedRoute>
          }
        />
        <Route
          path="Report-Scheduler"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminReportScheduler />
            </ProtectedRoute>
          }
        />
        <Route
          path="smtp-config"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SMTPConfigForm />
            </ProtectedRoute>
          }
        />
        {/* <Route path="config" element={<ConfigPage />} /> */}
        {/* <Route path="config" element={<ConfigTabs />} /> */}
        <Route path="users">
          <Route index element={<Users />} />
          <Route
            path=":userId/edit"
            element={<EditUser />}
            loader={userLoader}
          />
          <Route path=":userId/delete" element={<Users />} />
        </Route>
      </Route>
    </>
  )
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ReportMailerTrigger />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
