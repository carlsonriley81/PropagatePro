import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    });

    return Response.json({ notifications });
  } catch (error) {
    console.error("List notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type, actionUrl } = body;

    if (!title || !message || !type) {
      return Response.json(
        { error: "Title, message, and type are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        actionUrl,
        userId: user.userId,
      },
    });

    return Response.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Create notification error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
      });

      return Response.json({ message: "All notifications marked as read" });
    }

    if (ids && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.userId },
        data: { isRead: true },
      });

      return Response.json({ message: "Notifications marked as read" });
    }

    return Response.json(
      { error: "Provide 'ids' array or 'markAllRead: true'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
