import ProjectTemplateGroups from "./Admin/Components/Project/ProjectTemplateGroups";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import EnketoLogin from "./Authentication/EnketoLogin";
import useIdleTimeout from "./hooks/useIdleTimeout";

import Forms from "./Forms";
import AdminLayout from "./Admin/Layout/AdminLayout";
import Dashboard from "./Admin/Pages/AdminDashboard";

// testing -- to see org and project role dashboard in admin
import OrgDashboard from "./Organization/Pages/OrganizationDashboard";
import ProDashboard from "./Project/Pages/ProjectDashboard";

//  Admin role imports
import AllOrganization from "./Admin/Pages/Organization/AdminAllOrganization";
import CreateOrganization from "./Admin/Pages/Organization/AdminCreateOrganization";
import AdminOrganizationUser from "./Admin/Pages/Organization/AdminOrganizationUser";
import SingleOrganization from "./Admin/Components/Organization/SingleOrganization/SingleOrganization";
import EditOrganization from "./Admin/Pages/Organization/EditOrganization";

import AllProject from "./Admin/Pages/Project/AdminAllProject";
import CreateProject from "./Admin/Pages/Project/AdminCreateProject";
import ProjectUser from "./Admin/Pages/Project/AdminProjectUser";

import AllForms from "./Admin/Pages/Form/AdminAllForms";
import CreateForms from "./Admin/Pages/Form/AdminCreateForms";
import CreateForm from "./Admin/Components/Form/CreateForm/CreateForm";
import SingleForm from "./Admin/Pages/Form/AdminSingleForm";
import FormsUser from "./Admin/Pages/Form/AdminFormsUser";

import Alluser from "./Admin/Pages/User/AdminAlluser";
import CreateUserUsers from "./Admin/Pages/User/AdminCreateUserUsers";
import EditUser from "./Admin/Pages/User/EditUser";
import AssignUser from "./Admin/Pages/User/AdminAssignUser";
import MicrostatificationDashboard from "./Admin/Components/Malaria/MicrostatificationDashboard";
import MicrostatificationDownload from "./Admin/Components/Malaria/MicrostatificationDownload";
import MicrostatificationUpload from "./Admin/Components/Malaria/MicrostatificationUpload";
import Submissions from "./Submissions";
import EditProject from "./Admin/Pages/Project/EditProject";

import EditForm from "./Admin/Pages/Form/EditForm";
import FormsList from "./Admin/Pages/Form/FormsList";
import FormInfo from "./Admin/Components/Form/FormInfo/FormInfo";
import Login from "./Authentication/Login";
import Register from "./Authentication/Register";
import OrganizationLayout from "./Organization/Layout/OrganizationLayout";
import ProjectLayout from "./Project/Layout/ProjectLayout";
import PageNotFound from "./Authentication/PageNotFound";

// Dashboard role imports
import OrgOrganizationUser from "./Organization/Pages/Organization/OrganizationUser";

import OrgAllProject from "./Organization/Pages/Project/OrganizationAllProject";
import OrgCreateProject from "./Organization/Pages/Project/OrganizationCreateProject";
import OrgProjectUser from "./Organization/Pages/Project/OrganizationProjectUser";

import OrgAllForms from "./Organization/Pages/Form/OrganizationAllForms";
import OrgCreateForms from "./Organization/Pages/Form/OrganizationCreateForms";
import OrgCreateForm from "./Organization/Components/Form/CreateForm/CreateForm";
import OrgSingleForm from "./Organization/Pages/Form/OrganizationSingleForm";
import OrgFormsUser from "./Organization/Pages/Form/OrganizationFormsUser";

import OrgAlluser from "./Organization/Pages/User/OrganizationAlluser";
import OrgCreateUserUsers from "./Organization/Pages/User/OrganizationCreateUserUsers";
import OrgAssignUser from "./Organization/Pages/User/OrganizationAssignUser";

// Project role imports
import ProProjectUser from "./Project/Pages/User/ProjectAlluser";

import ProAllForms from "./Project/Pages/Form/ProjectAllForms";
import ProCreateForms from "./Project/Pages/Form/ProjectCreateForms";
import ProCreateForm from "./Project/Components/Form/CreateForm/CreateForm";
import ProSingleForm from "./Project/Pages/Form/ProjectSingleForm";
import ProFormsUser from "./Project/Pages/Form/ProjectFormsUser";

import ProAlluser from "./Project/Pages/User/ProjectAlluser";
import ProCreateUserUsers from "./Project/Pages/User/ProjectCreateUserUsers";
import ProAssignUser from "./Project/Pages/User/ProjectAssignUser";
import ProjectFormsList from "./Admin/Pages/Project/ProjectFormList";
import UserProfile from "./shared/ViewProfile";
import UserLayout from "./User/Layout/UserLayout";

// User role imports
import UserDashboard from "./User/Pages/UserDashboard";
import UserFollowUp from "./User/Pages/UserFollowUp";
import UserTemplateData from "./User/Pages/UserTemplateData";
import UserAllOrganization from "./User/Pages/Organization/UserAllOrganization";
import UserOrganizationUser from "./User/Pages/Organization/UserOrganizationUser";
import UserSingleOrganization from "./User/Components/Organization/SingleOrganization/UserSingleOrganization";

import UserAllProject from "./User/Pages/Project/UserAllProject";
import UserCreateProject from "./User/Pages/Project/UserCreateProject";
import UserProjectUser from "./User/Pages/Project/UserProjectUser";
import UserProjectFormsList from "./User/Pages/Project/UserProjectFormList";

import UserAllForms from "./User/Pages/Form/UserAllForms";
import UserCreateForms from "./User/Pages/Form/UserCreateForms";
import UserCreateForm from "./User/Components/Form/CreateForm/CreateForm";
import UserSingleForm from "./User/Pages/Form/UserSingleForm";
import UserFormsUser from "./User/Pages/Form/UserFormsUser";
import UserFormList from "./User/Pages/Form/UserFormsList";
import UserEditForm from "./User/Pages/Form/UserEditForm";
import UserEditProfile from "./User/Pages/User/EditUser";

import UserAlluser from "./User/Pages/User/UserAlluser";
import UserCreateUserUsers from "./User/Pages/User/UserCreateUserUsers";
import UserEditUser from "./User/Pages/User/UserEditUser";
import UserAssignUser from "./User/Pages/User/UserAssignUser";
import AllFormsList from "./Organization/Components/Form/FormUserList";
import OrgAllOrganization from "./Organization/Pages/Organization/OrgAllOranization";
import OrgProjectFormsList from "./Organization/Pages/Project/OrganizationSingleProjectList";
import DataCollectorPage from "./DataCollector/DataCollectorPage";
import AllProjects from "./Project/Pages/Project/ProjectAllProjects";
import { getCSRFToken } from "./api";
import { BRAC_DOWNLOAD_USERNAME } from "./config";
import AdminAssignOrg from "./Admin/Pages/Organization/AdminAssignOrganization";
import AdminAssignForm from "./Admin/Pages/Form/AdminAssignForm";
import AdminAssignProject from "./Admin/Pages/Project/AdminAssignProject";
import { AllPatients } from "./shared/AllPatient";
import SinglePatient from "./shared/SinglePatient";
import SinglePatientTable from "./shared/SinglePatient";
import TrashBin from "./shared/TrashBin";
import SingleProjectTabPanel from "./Organization/Components/Project/SingleProjectPanel";
import ProProjectForms from "./Project/Pages/Project/SingleProjectForms";
import SingleProject from "./Admin/Components/Project/SingleProject/SingleProject";
import MobileAppDownload from "./shared/MobileAppDownload";

import TamplateFormInfo from "./Admin/Components/Form/TamplateFormInfo/FormInfo";
import TamplateEditForm from "./Admin/Components/Form/TamplateEditForm/EditForm";
import FollowUp from "./Admin/Pages/Project/FollowUp";
import ProjectAllRowsView from "./Admin/Pages/Project/ProjectAllRowsView";
import BracDataDownloadPage from "./shared/BracDataDownloadPage";

// Idle Timeout Wrapper Component
const IdleTimeoutWrapper = ({ children }) => {
  useIdleTimeout(5); // 5 minutes timeout
  return <>{children}</>;
};

const MalariaRedirect = () => {
  useEffect(() => {
    window.location.replace("/malaria/");
  }, []);

  return null;
};

const App = () => {
  const storedUserInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const [authToken, setAuthToken] = useState(
    sessionStorage.getItem("authToken")
  );
  const [userRole, setUserRole] = useState(storedUserInfo.role || null);
  const [userDetails, setUserDetails] = useState(
    Object.keys(storedUserInfo).length ? storedUserInfo : null
  );
  const isBracDownloadUser =
    userDetails?.username === BRAC_DOWNLOAD_USERNAME;
  const microRole = String(userDetails?.profile?.micro_role || "").toLowerCase();
  const isMalariaFieldUser =
    userRole === 8 || userRole === 9 || microRole === "sk" || microRole === "shw";
  const defaultAuthenticatedPath = isBracDownloadUser
    ? "/projects/55/all-rows"
    : isMalariaFieldUser
      ? "/malaria-redirect"
      : "/dashboard";

  useEffect(() => {
    setAuthToken(sessionStorage.getItem("authToken"));
    // Get user info from sessionStorage (assuming you store it after login)
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    setUserRole(userInfo.role); // role should be 1, 2, 3, 4, 5, or 6
    setUserDetails(userInfo); // Store user details for later use
    console.log("userInfo from sessionStorage:", userInfo);
    console.log("userRole state:", userInfo.role);

    // const initializeCSRF = async () => {
    //   try {
    //     const token = await getCSRFToken();
    //     console.log("CSRF token initialized successfully:", token?.substring(0, 10) + "...");
    //   } catch (error) {
    //     console.error("Failed to initialize CSRF token:", error);
    //   }
    // };

    // initializeCSRF();
  }, []);

  return (
    <Router>
      <IdleTimeoutWrapper>
        <Routes>
          <Route path="/auth/enketo-login" element={<EnketoLogin />} />

          <Route
            path="/login"
            element={
              authToken ? (
                <Navigate to={defaultAuthenticatedPath} replace />
              ) : (
                <Login setAuthToken={setAuthToken} />
              )
            }
          />
          <Route path="/malaria-redirect" element={<MalariaRedirect />} />
          <Route path="/register" element={<Register />} />

          {isBracDownloadUser && (
            <>
              <Route
                path="/dashboard"
                element={
                  authToken ? (
                    <Navigate to="/projects/55/all-rows" replace />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/brac-data-download"
                element={
                  authToken ? (
                    <BracDataDownloadPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/projects/55/all-rows"
                element={
                  authToken ? (
                    <BracDataDownloadPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="*"
                element={
                  authToken ? (
                    <Navigate to="/projects/55/all-rows" replace />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            </>
          )}

          {/* Microstatification Admin (role 7) */}
          {!isBracDownloadUser && userRole === 7 && (
            <Route
              path="/"
              element={
                authToken ? (
                  <AdminLayout setAuthToken={setAuthToken} user={authToken} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route
                path="dashboard"
                element={<MicrostatificationDashboard />}
              />
              <Route path="/404" element={<PageNotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />

              <Route path="user/all" element={<Alluser />} />
              <Route path="user/create" element={<CreateUserUsers />} />
              <Route path="user/assign-user" element={<AssignUser />} />
              <Route path="user/edit/:id" element={<EditUser />} />
              <Route
                path="microstatification/download"
                element={<MicrostatificationDownload />}
              />
              <Route
                path="malaria/upload-microstatification"
                element={<MicrostatificationUpload />}
              />
              <Route path="profile" element={<UserProfile />} />
              <Route path="mobile-app" element={<MobileAppDownload />} />
            </Route>
          )}

          {/* Admin (role 1) + Officer (role 6) */}
          {!isBracDownloadUser && (userRole === 1 || userRole === 6) && (
            <Route
              path="/"
              element={
                authToken ? (
                  <AdminLayout setAuthToken={setAuthToken} user={authToken} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route path="dashboard" element={<Dashboard />} />

              <Route path="/404" element={<PageNotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />

              {/* new added  */}
              <Route path="organization/all" element={<AllOrganization />} />
              <Route
                path="organization/create"
                element={<CreateOrganization />}
              />
              <Route
                path="organization/edit/:id"
                element={<EditOrganization />}
              />

              {/* <Route
              path="organization/user"
              element={<AdminOrganizationUser />}
            /> */}
              <Route
                path="organization/single-org"
                element={<SingleOrganization />}
              />
              <Route
                path="organization/single-org/:id"
                element={<SingleOrganization />}
              />
              <Route path="organization/assign" element={<AdminAssignOrg />} />

              <Route path="projects/all" element={<AllProject />} />
              <Route path="projects/create" element={<CreateProject />} />
              {/* <Route path="projects/user" element={<ProjectUser />} /> */}

              <Route path="forms/all" element={<AllForms />} />
              <Route path="forms/create" element={<CreateForms />} />
              <Route path="forms/create-form" element={<CreateForm />} />
              <Route
                path="forms/create-form/:projectId"
                element={<CreateForm />}
              />
              {/* <Route path="forms/user" element={<FormsUser />} /> */}
              <Route path="forms/single-form" element={<SingleForm />} />
              <Route path="forms/assign" element={<AdminAssignForm />} />

              <Route path="user/all" element={<Alluser />} />
              <Route path="user/create" element={<CreateUserUsers />} />
              <Route path="user/assign-user" element={<AssignUser />} />
              <Route path="user/edit/:id" element={<EditUser />} />
              <Route path="malaria/upload-microstatification" element={<MicrostatificationUpload />} />

              <Route path="projects/edit/:projectId" element={<EditProject />} />
              <Route path="projects/assign" element={<AdminAssignProject />} />
              <Route
                path="projects/:projectId/template-groups"
                element={<ProjectTemplateGroups />}
              />
              <Route path="projects/follow-up" element={<FollowUp />} />
              <Route
                path="projects/:projectId/all-rows"
                element={<ProjectAllRowsView />}
              />
              {/* <Route
              path="projects/:projectId/forms"
              element={<ProjectFormsList />}
            /> */}
              <Route
                path="projects/:projectId/forms"
                element={<SingleProject />}
              />
              <Route
                path="projects/:projectId/create_form"
                element={<CreateForm />}
              />
              <Route
                path="projects/:projectId/edit_form/:formId"
                element={<EditForm />}
              />
              <Route
                path="projects/:projectId/forms/:formId"
                element={<FormInfo />}
              />

              {/* Tamplate single form + edit form  */}
              <Route
                path="template/projects/:projectId/forms/:formId"
                element={<TamplateFormInfo />}
              />

              <Route
                path="template/projects/:projectId/edit_form/:formId"
                element={<TamplateEditForm />}
              />

              <Route path="forms" element={<Forms />} />
              <Route path="patients/all/" element={<AllPatients />} />
              <Route
                path="patients/single/:patientId"
                element={<SinglePatientTable />}
              />
              <Route path="trash-bin" element={<TrashBin />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="mobile-app" element={<MobileAppDownload />} />
            </Route>
          )}

          {/* Organization (role 2) */}
          {!isBracDownloadUser && userRole === 2 && (
            <Route
              path="/"
              element={
                authToken ? (
                  <OrganizationLayout
                    setAuthToken={setAuthToken}
                    user={authToken}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route path="dashboard" element={<OrgDashboard />} />
              ? <Route path="/404" element={<PageNotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
              <Route path="organization/all" element={<OrgAllOrganization />} />
              <Route
                path="organization/edit/:id"
                element={<EditOrganization />}
              />
              <Route
                path="organization/single-org/:id"
                element={<SingleOrganization />}
              />
              <Route path="organization/user" element={<OrgOrganizationUser />} />
              <Route path="projects/all" element={<OrgAllProject />} />
              <Route path="projects/create" element={<OrgCreateProject />} />
              <Route path="projects/user" element={<OrgProjectUser />} />
              <Route path="forms/all" element={<OrgAllForms />} />
              <Route path="forms/create" element={<OrgCreateForms />} />
              <Route path="forms/create-form" element={<OrgCreateForm />} />
              <Route
                path="forms/create-form/:projectId"
                element={<OrgCreateForm />}
              />
              <Route path="forms/user" element={<OrgFormsUser />} />
              <Route path="forms/single-form" element={<OrgSingleForm />} />
              <Route path="user/all" element={<OrgAlluser />} />
              <Route path="user/create" element={<OrgCreateUserUsers />} />
              <Route path="user/assign-user" element={<OrgAssignUser />} />
              <Route path="user/edit/:id" element={<EditUser />} />
              <Route path="projects/edit/:projectId" element={<EditProject />} />
              <Route
                path="projects/:projectId/forms"
                element={<OrgProjectFormsList />}
              />
              {/* <Route path="projects/:projectId/forms" element={<SingleProjectTabPanel />} /> */}
              <Route
                path="projects/:projectId/create_form"
                element={<CreateForm />}
              />
              <Route
                path="projects/:projectId/edit_form/:formId"
                element={<EditForm />}
              />
              <Route
                path="projects/:projectId/forms/:formId"
                element={<FormInfo />}
              />
              <Route path="forms" element={<Forms />} />
              <Route path="trash-bin" element={<TrashBin />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="mobile-app" element={<MobileAppDownload />} />
            </Route>
          )}

          {/* Project (role 3) */}
          {!isBracDownloadUser && userRole === 3 && (
            <Route
              path="/"
              element={
                authToken ? (
                  <ProjectLayout setAuthToken={setAuthToken} user={authToken} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route path="dashboard" element={<ProDashboard />} />
              <Route path="/404" element={<PageNotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
              {/* <Route path="projects/user" element={<ProProjectUser />} /> */}

              <Route path="forms/all" element={<ProAllForms />} />
              <Route path="forms/create" element={<ProCreateForms />} />
              <Route path="forms/create-form" element={<ProCreateForm />} />
              <Route
                path="forms/create-form/:projectId"
                element={<CreateForm />}
              />
              {/* <Route path="forms/single-form" element={<ProSingleForm />} /> */}

              <Route path="user/all" element={<ProAlluser />} />
              <Route path="user/create" element={<ProCreateUserUsers />} />
              <Route path="user/assign-user" element={<ProAssignUser />} />
              <Route path="user/edit/:id" element={<EditUser />} />

              <Route path="projects/edit/:projectId" element={<EditProject />} />
              <Route
                path="projects/:projectId/forms"
                element={<ProProjectForms />}
              />
              <Route path="projects/all" element={<AllProjects />} />
              <Route
                path="projects/:projectId/create_form"
                element={<CreateForm />}
              />
              <Route
                path="projects/:projectId/edit_form/:formId"
                element={<EditForm />}
              />
              <Route
                path="projects/:projectId/forms/:formId"
                element={<FormInfo />}
              />

              <Route path="forms" element={<Forms />} />
              <Route path="trash-bin" element={<TrashBin />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="mobile-app" element={<MobileAppDownload />} />
            </Route>
          )}

          {/* Form (role 5) */}
          {!isBracDownloadUser && userRole === 5 && (
            <Route
              path="/"
              element={
                authToken ? (
                  <UserLayout setAuthToken={setAuthToken} user={authToken} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route path="dashboard" element={<DataCollectorPage />} />
              <Route path="trash-bin" element={<TrashBin />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="mobile-app" element={<MobileAppDownload />} />
            </Route>
          )}

          {/* Normal User (role 4) */}
          {!isBracDownloadUser && userRole === 4 && (
            <Route
              path="/"
              element={
                authToken ? (
                  <UserLayout
                    userDetails={userDetails}
                    setAuthToken={setAuthToken}
                    user={authToken}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route
                path="dashboard"
                element={
                  userDetails?.is_staff ? (
                    <UserDashboard />
                  ) : (
                    <Navigate to="/followup" replace />
                  )
                }
              />
              <Route path="followup" element={<UserFollowUp />} />
              <Route
                path="template/:templateId/data"
                element={<UserTemplateData />}
              />
              <Route path="/404" element={<PageNotFound />} />
              <Route path="trash-bin" element={<TrashBin />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="mobile-app" element={<MobileAppDownload />} />

              {/* Always available Edit Profile route for user */}
              <Route path="user/edit/:id" element={<UserEditProfile />} />

              {userDetails?.profile &&
                (() => {
                  const hasOrgPower =
                    userDetails.profile.organizations?.length > 0;
                  const hasProjectPower =
                    userDetails.profile.projects?.length > 0;
                  const hasFormPower = userDetails.profile.forms?.length > 0;

                  return (
                    <>
                      {/* Org routes */}
                      {hasOrgPower && (
                        <>
                          {/* <Route
                          path="organization/all"
                          element={<UserAllOrganization />}
                        />
                        <Route
                          path="user/edit/:id"
                          element={<UserEditProfile />}
                        /> */}

                          {/* <Route
                          path="organization/user"
                          element={<UserOrganizationUser />}
                        /> */}
                          {/* <Route
                          path="organization/single-org"
                          element={<UserSingleOrganization />}
                        />
                        <Route
                          path="organization/single-org/:id"
                          element={<UserSingleOrganization />}
                        />

                        <Route
                          path="projects/edit/:projectId"
                          element={<EditProject />}
                        />

                        <Route
                          path="projects/create"
                          element={<UserCreateProject />}
                        />

                        <Route path="user/all" element={<UserAlluser />} />
                        <Route
                          path="user/create"
                          element={<UserCreateUserUsers />}
                        />
                        <Route
                          path="user/assign-user"
                          element={<UserAssignUser />}
                        />
                        <Route
                          path="user/edit/:id"
                          element={<UserEditUser />}
                        /> */}
                        </>
                      )}

                      {/* Project routes (org or project power) */}
                      {(hasOrgPower || hasProjectPower) && (
                        <>
                          {/* <Route
                          path="projects/all"
                          element={<UserAllProject />}
                        /> */}

                          {/* <Route
                          path="projects/user"
                          element={<UserProjectUser />}
                        /> */}

                          {/* <Route
                          path="projects/:projectId/create_form"
                          element={<UserCreateForm />}
                        /> */}
                          {/* <Route
                          path="projects/:projectId/edit_form/:formId"
                          element={<UserEditForm />}
                        /> */}

                          <Route
                            path="projects/:projectId/forms"
                            element={<UserProjectFormsList />}
                          />

                          {/* <Route
                          path="forms/create"
                          element={<UserCreateForms />}
                        /> */}
                          {/* <Route
                          path="forms/create-form"
                          element={<UserCreateForm />}
                        /> */}
                          {/* <Route
                          path="forms/create-form/:projectId"
                          element={<UserCreateForm />}
                        /> */}
                        </>
                      )}

                      {/* Form routes (any power) */}
                      {(hasOrgPower || hasProjectPower || hasFormPower) && (
                        <>
                          <Route path="forms/all" element={<UserAllForms />} />
                          {/* <Route path="forms/user" element={<UserFormsUser />} /> */}
                          <Route
                            path="forms/single-form"
                            element={<UserSingleForm />}
                          />
                          <Route
                            path="/projects/:projectId/edit_form/:formId"
                            element={<UserEditForm />}
                          />
                          <Route
                            path="projects/:projectId/forms/:formId"
                            element={<FormInfo />}
                          />
                          <Route
                            path="forms/single-form/:id"
                            element={<UserSingleForm />}
                          />
                          <Route
                            path="projects/:projectId/forms/:formId"
                            element={<FormInfo />}
                          />
                        </>
                      )}
                    </>
                  );
                })()}

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          )}

          {/* Global catch-all: if not matched above, redirect to login or dashboard */}
          {isMalariaFieldUser && (
            <Route
              path="*"
              element={
                authToken ? (
                  <MalariaRedirect />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          )}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  authToken ? defaultAuthenticatedPath : "/login"
                }
              />
            }
          />
        </Routes>
      </IdleTimeoutWrapper>
    </Router>
  );
};

export default App;
