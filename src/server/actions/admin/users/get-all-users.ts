"use server";
import { ApiResponse } from "@/lib/types";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type UserWithoutPassword = { id: string; name: string | null; email: string; role: string; createdAt: Date; image: string | null; };
type GetAllUsersOptions = { page?: number; limit?: number; sortBy?: "name"|"email"|"role"|"createdAt"; sortOrder?: "asc"|"desc"; search?: string; };

export async function getAllUsers(options: GetAllUsersOptions = {}): Promise<ApiResponse<{ users: UserWithoutPassword[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };
    if (session.user.role !== "admin") return { success: false, error: "Not authorized" };
    const { page=1, limit=10, sortBy="createdAt", sortOrder="desc", search="" } = options;
    const offset = (page-1)*limit;
    let allUsers = await db.query.users.findMany({ columns: { id: true, name: true, email: true, role: true, createdAt: true, image: true, password: false, emailVerified: false, updatedAt: false } });
    if (search) { const s = search.toLowerCase(); allUsers = allUsers.filter((u) => u.email?.toLowerCase().includes(s) || (u.name?.toLowerCase().includes(s) || false)); }
    const total = allUsers.length;
    allUsers.sort((a, b) => {
      let vA: string|Date, vB: string|Date;
      if (sortBy === "name" || sortBy === "email" || sortBy === "role") { vA = a[sortBy] || ""; vB = b[sortBy] || ""; }
      else { vA = a.createdAt; vB = b.createdAt; }
      if (typeof vA === "string" && typeof vB === "string") return sortOrder === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return { success: true, data: { users: allUsers.slice(offset, offset+limit), total } };
  } catch (error) {
    console.error("Error getting all users", error);
    return { success: false, error: "Error getting all users" };
  }
}
