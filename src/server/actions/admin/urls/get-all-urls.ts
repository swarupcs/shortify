"use server";
import { ApiResponse } from "@/lib/types";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type UrlWithUser = { id: number; originalUrl: string; shortCode: string; createdAt: Date; clicks: number; userId: string | null; userName: string | null; userEmail: string | null; flagged: boolean; flagReason: string | null; };
type GetAllUrlsOptions = { page?: number; limit?: number; sortBy?: "originalUrl"|"shortCode"|"createdAt"|"clicks"|"userName"; sortOrder?: "asc"|"desc"; search?: string; filter?: "all"|"flagged"|"security"|"inappropriate"|"other"; };

export async function getAllUrls(options: GetAllUrlsOptions = {}): Promise<ApiResponse<{ urls: UrlWithUser[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };
    if (session.user.role !== "admin") return { success: false, error: "Unauthorized" };
    const { page=1, limit=10, sortBy="createdAt", sortOrder="desc", search="", filter="all" } = options;
    const offset = (page-1)*limit;
    const allUrls = await db.query.urls.findMany({ with: { user: true } });
    let transformed: UrlWithUser[] = allUrls.map((url) => ({ id: url.id, originalUrl: url.originalUrl, shortCode: url.shortCode, createdAt: url.createdAt, clicks: url.clicks, userId: url.userId, userName: url.user?.name || null, userEmail: url.user?.email || null, flagged: url.flagged, flagReason: url.flagReason }));
    if (search) { transformed = transformed.filter((url) => url.originalUrl.toLowerCase().includes(search.toLowerCase()) || url.shortCode.toLowerCase().includes(search.toLowerCase()) || url.userName?.toLowerCase().includes(search.toLowerCase()) || url.userEmail?.toLowerCase().includes(search.toLowerCase()) || (url.flagReason?.toLowerCase().includes(search.toLowerCase()) || false)); }
    if (filter !== "all") {
      transformed = transformed.filter((url) => {
        if (filter === "flagged") return url.flagged;
        if (filter === "security" && url.flagReason) return url.flagReason.toLowerCase().includes("security") || url.flagReason.toLowerCase().includes("phishing") || url.flagReason.toLowerCase().includes("malware");
        if (filter === "inappropriate" && url.flagReason) return url.flagReason.toLowerCase().includes("inappropriate") || url.flagReason.toLowerCase().includes("adult") || url.flagReason.toLowerCase().includes("offensive");
        if (filter === "other" && url.flagReason) return !url.flagReason.toLowerCase().includes("security") && !url.flagReason.toLowerCase().includes("phishing") && !url.flagReason.toLowerCase().includes("malware") && !url.flagReason.toLowerCase().includes("inappropriate") && !url.flagReason.toLowerCase().includes("adult") && !url.flagReason.toLowerCase().includes("offensive");
        return false;
      });
    }
    const total = transformed.length;
    transformed.sort((a, b) => {
      let vA: string|number|Date, vB: string|number|Date;
      if (sortBy === "userName") { vA = a.userName || a.userEmail || ""; vB = b.userName || b.userEmail || ""; }
      else if (sortBy === "originalUrl" || sortBy === "shortCode") { vA = a[sortBy] || ""; vB = b[sortBy] || ""; }
      else if (sortBy === "clicks") { vA = a.clicks || 0; vB = b.clicks || 0; }
      else { vA = a.createdAt; vB = b.createdAt; }
      if (typeof vA === "string" && typeof vB === "string") return sortOrder === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    const paginatedUrls = transformed.slice(offset, offset+limit);
    return { success: true, data: { urls: paginatedUrls, total } };
  } catch (error) {
    console.error("Error getting all URLs:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
