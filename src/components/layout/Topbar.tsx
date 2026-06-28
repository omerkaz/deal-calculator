import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default function Topbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-divider bg-surface px-6 md:px-8">
      {/* Left — page title area (pushed right on mobile to clear hamburger) */}
      <div className="pl-10 md:pl-0">
        <h2 className="font-heading text-lg text-text">Dashboard</h2>
      </div>

      {/* Right — user info + sign-out */}
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-text-secondary sm:inline">
          {user?.email ?? "—"}
        </span>
        <Button variant="secondary" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
