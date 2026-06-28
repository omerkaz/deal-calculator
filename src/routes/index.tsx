import { createBrowserRouter } from "react-router";
import RequireAuth from "@/components/layout/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";

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
          // Future routes:
          // { path: "/patients", element: <PatientsPage /> },
          // { path: "/pipeline", element: <PipelinePage /> },
          // { path: "/payments", element: <PaymentsPage /> },
        ],
      },
    ],
  },
]);
