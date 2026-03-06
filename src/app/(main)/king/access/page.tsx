import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccessDashboardClient from "./AccessDashboardClient";

export const metadata = {
    title: "Activity | C&C Journal",
};

export default async function AccessLogsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) redirect("/login");

    const user = session.user as any;
    if (user.role !== "king") redirect("/");

    return <AccessDashboardClient />;
}
