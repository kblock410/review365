import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main
        className="relative z-10"
        style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}
      >
        {children}
      </main>
    </div>
  );
}

