import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { AuthProvider } from "@/context/auth";
import { router } from "@/routes";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <div className="grain" />
      <div className="vignette" />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
