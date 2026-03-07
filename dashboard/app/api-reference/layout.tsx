import { DashboardLayout } from "@/components/DashboardLayout";

export default function ApiReferenceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
