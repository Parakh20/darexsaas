import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
