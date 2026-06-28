import { createBrowserRouter } from "react-router";
import RequireAuth from "@/components/layout/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PatientsPage from "@/pages/PatientsPage";
import PatientFormPage from "@/pages/PatientFormPage";
import PatientDetailPage from "@/pages/PatientDetailPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/patients",
            element: <PatientsPage />,
          },
          {
            path: "/patients/new",
            element: <PatientFormPage />,
          },
          {
            path: "/patients/:id",
            element: <PatientDetailPage />,
          },
          {
            path: "/patients/:id/edit",
            element: <PatientFormPage />,
          },
          // Future routes:
          // { path: "/pipeline", element: <PipelinePage /> },
          // { path: "/payments", element: <PaymentsPage /> },
        ],
      },
    ],
  },
]);
