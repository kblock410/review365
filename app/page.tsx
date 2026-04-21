import { Sidebar } from "@/components/layout/Sidebar";
import DashboardPage from "./dashboard/page";

export default function Home() {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main
        className="relative z-10"
        style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}
      >
        <DashboardPage />
      </main>
    </div>
  );
}

