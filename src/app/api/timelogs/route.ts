import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const timeLogs = await prisma.timeLog.findMany({
      where: { userId: user.userId },
      include: {
        cutting: { select: { id: true, uniqueCode: true, species: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return Response.json({ timeLogs });
  } catch (error) {
    console.error("List timelogs error:", error);
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
    const { cuttingId, taskType, notes } = body;

    if (!taskType) {
      return Response.json(
        { error: "Task type is required" },
        { status: 400 }
      );
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        cuttingId,
        taskType,
        notes,
        isRunning: true,
        userId: user.userId,
      },
    });

    return Response.json({ timeLog }, { status: 201 });
  } catch (error) {
    console.error("Create timelog error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
