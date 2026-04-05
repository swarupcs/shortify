export { auth as proxy } from "@/server/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
