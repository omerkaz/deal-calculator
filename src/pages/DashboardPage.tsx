import { useAuth } from "@/context/auth";

/**
 * Placeholder dashboard — will be replaced by the real layout shell in a later task.
 */
export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-heading text-3xl text-text">Dashboard</h1>
      <p className="text-text-secondary text-sm">
        Signed in as{" "}
        <span className="font-medium text-text">{user?.email ?? "—"}</span>
      </p>
      <button
        onClick={signOut}
        className="text-sm text-teal hover:text-teal-hover underline underline-offset-2 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
