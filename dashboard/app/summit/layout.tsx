import { DashboardLayout } from "@/components/DashboardLayout";

export default function SummitLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
