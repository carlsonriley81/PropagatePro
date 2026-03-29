import { getAuthUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const response = Response.json({ message: "Logged out successfully" });
    response.headers.set(
      "Set-Cookie",
      "token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
