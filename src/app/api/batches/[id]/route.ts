import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const batch = await prisma.batch.findFirst({
      where: { id, userId: user.userId },
      include: {
        cuttings: { orderBy: { createdAt: "desc" } },
        _count: { select: { cuttings: true } },
      },
    });

    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    const totalCuttings = batch.cuttings.length;
    const successfulCuttings = batch.cuttings.filter((c: { rootingStatus: string }) =>
      ["rooted", "transplanted", "sold"].includes(c.rootingStatus)
    ).length;
    const nonDeadCuttings = batch.cuttings.filter(
      (c: { rootingStatus: string }) => c.rootingStatus !== "dead"
    ).length;
    const successRate =
      nonDeadCuttings > 0 ? (successfulCuttings / nonDeadCuttings) * 100 : 0;

    return Response.json({
      batch: {
        ...batch,
        stats: {
          totalCuttings,
          successfulCuttings,
          successRate: Math.round(successRate * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Get batch error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const existing = await prisma.batch.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, species, notes } = body;

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(notes !== undefined && { notes }),
      },
    });

    return Response.json({ batch });
  } catch (error) {
    console.error("Update batch error:", error);
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

    const existing = await prisma.batch.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    await prisma.batch.delete({ where: { id } });

    return Response.json({ message: "Batch deleted" });
  } catch (error) {
    console.error("Delete batch error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
