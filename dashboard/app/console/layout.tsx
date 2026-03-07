import { DashboardLayout } from "@/components/DashboardLayout";

export default function ConsoleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
