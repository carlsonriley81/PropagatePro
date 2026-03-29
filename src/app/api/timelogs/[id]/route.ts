import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.timeLog.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Time log not found" }, { status: 404 });
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - new Date(existing.startTime).getTime()) / 1000
    );

    const body = await request.json().catch(() => ({}));

    const timeLog = await prisma.timeLog.update({
      where: { id },
      data: {
        endTime,
        duration,
        isRunning: false,
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return Response.json({ timeLog });
  } catch (error) {
    console.error("Update timelog error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.timeLog.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Time log not found" }, { status: 404 });
    }

    await prisma.timeLog.delete({ where: { id } });

    return Response.json({ message: "Time log deleted" });
  } catch (error) {
    console.error("Delete timelog error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
