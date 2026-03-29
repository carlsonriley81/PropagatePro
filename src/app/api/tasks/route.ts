import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = { userId: user.userId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        cutting: { select: { id: true, uniqueCode: true, species: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ tasks });
  } catch (error) {
    console.error("List tasks error:", error);
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
    const { cuttingId, taskType, description, duration, completedAt } = body;

    if (!taskType) {
      return Response.json(
        { error: "Task type is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        cuttingId,
        taskType,
        description,
        duration,
        completedAt: completedAt ? new Date(completedAt) : undefined,
        userId: user.userId,
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
