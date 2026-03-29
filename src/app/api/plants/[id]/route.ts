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

    const plant = await prisma.plant.findFirst({
      where: { id, userId: user.userId },
      include: {
        cuttings: { orderBy: { createdAt: "desc" } },
        _count: { select: { cuttings: true } },
      },
    });

    if (!plant) {
      return Response.json({ error: "Plant not found" }, { status: 404 });
    }

    return Response.json({ plant });
  } catch (error) {
    console.error("Get plant error:", error);
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

    const existing = await prisma.plant.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Plant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, species, variety, source, location, notes, imageUrl, isMotherPlant, quantity, datePlanted, healthStatus } = body;

    const plant = await prisma.plant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(variety !== undefined && { variety }),
        ...(source !== undefined && { source }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isMotherPlant !== undefined && { isMotherPlant }),
        ...(quantity !== undefined && { quantity }),
        ...(datePlanted !== undefined && { datePlanted: new Date(datePlanted) }),
        ...(healthStatus !== undefined && { healthStatus }),
      },
    });

    return Response.json({ plant });
  } catch (error) {
    console.error("Update plant error:", error);
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

    const existing = await prisma.plant.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Plant not found" }, { status: 404 });
    }

    await prisma.plant.delete({ where: { id } });

    return Response.json({ message: "Plant deleted" });
  } catch (error) {
    console.error("Delete plant error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
