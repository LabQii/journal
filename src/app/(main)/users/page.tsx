import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/authGuard";
import UserDashboard from "./UserDashboard";

export const metadata = {
    title: "Users Management | C&C Journal",
    description: "Manage users and roles (King Only)",
};

export default async function UsersPage() {
    // Only "king" can access this page server-side
    const authResult = await requireAuth("king");

    // If not authorized / no session, redirect to home
    if (authResult instanceof Response) {
        redirect("/");
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-background">
            <div className="w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-10 py-8 md:py-12">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Users Management</h1>
                    <p className="text-muted-foreground">Manage user accounts, roles, and access across the application.</p>
                </div>

                <UserDashboard />
            </div>
        </main>
    );
}
