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

    const cutting = await prisma.cutting.findFirst({
      where: { id, userId: user.userId },
      include: {
        plant: { select: { id: true, name: true, species: true } },
        batch: { select: { id: true, name: true } },
        tasks: { orderBy: { createdAt: "desc" } },
        sale: true,
      },
    });

    if (!cutting) {
      return Response.json({ error: "Cutting not found" }, { status: 404 });
    }

    return Response.json({ cutting });
  } catch (error) {
    console.error("Get cutting error:", error);
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

    const existing = await prisma.cutting.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Cutting not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      plantId, batchId, species, variety, nodeCount, propagationMethod,
      rootingStatus, healthStatus, location, notes, imageUrl, dateCut,
      costPerCutting, salePrice, lastWatered,
    } = body;

    // Handle status transition dates
    const statusDates: Record<string, Date> = {};
    if (rootingStatus && rootingStatus !== existing.rootingStatus) {
      if (rootingStatus === "rooted" && !existing.dateRooted) {
        statusDates.dateRooted = new Date();
      }
      if (rootingStatus === "transplanted" && !existing.dateTransplanted) {
        statusDates.dateTransplanted = new Date();
      }
      if (rootingStatus === "sold" && !existing.dateSold) {
        statusDates.dateSold = new Date();
      }
    }

    const cutting = await prisma.cutting.update({
      where: { id },
      data: {
        ...(plantId !== undefined && { plantId }),
        ...(batchId !== undefined && { batchId }),
        ...(species !== undefined && { species }),
        ...(variety !== undefined && { variety }),
        ...(nodeCount !== undefined && { nodeCount }),
        ...(propagationMethod !== undefined && { propagationMethod }),
        ...(rootingStatus !== undefined && { rootingStatus }),
        ...(healthStatus !== undefined && { healthStatus }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(dateCut !== undefined && { dateCut: new Date(dateCut) }),
        ...(costPerCutting !== undefined && { costPerCutting }),
        ...(salePrice !== undefined && { salePrice }),
        ...(lastWatered !== undefined && { lastWatered: new Date(lastWatered) }),
        ...statusDates,
      },
      include: {
        plant: { select: { id: true, name: true, species: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    return Response.json({ cutting });
  } catch (error) {
    console.error("Update cutting error:", error);
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

    const existing = await prisma.cutting.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Cutting not found" }, { status: 404 });
    }

    await prisma.cutting.delete({ where: { id } });

    return Response.json({ message: "Cutting deleted" });
  } catch (error) {
    console.error("Delete cutting error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
