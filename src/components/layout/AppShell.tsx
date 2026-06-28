import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * Top-level authenticated layout: sidebar + topbar + content area.
 * Rendered inside RequireAuth so it only shows for authenticated users.
 */
export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      {/* Main column: topbar + scrollable content */}
      <div className="flex flex-1 flex-col md:ml-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
