import { DashboardLayout } from "@/components/DashboardLayout";

export default function AgentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
