import { createBrowserRouter } from "react-router";
import RequireAuth from "@/components/layout/RequireAuth";
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
        path: "/",
        element: <DashboardPage />,
      },
    ],
  },
]);
