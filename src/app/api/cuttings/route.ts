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
    const species = searchParams.get("species");
    const rootingStatus = searchParams.get("rootingStatus");
    const healthStatus = searchParams.get("healthStatus");
    const batchId = searchParams.get("batchId");

    const where: Record<string, unknown> = { userId: user.userId };

    if (species) where.species = species;
    if (rootingStatus) where.rootingStatus = rootingStatus;
    if (healthStatus) where.healthStatus = healthStatus;
    if (batchId) where.batchId = batchId;

    const cuttings = await prisma.cutting.findMany({
      where,
      include: {
        plant: { select: { id: true, name: true, species: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ cuttings });
  } catch (error) {
    console.error("List cuttings error:", error);
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
    const {
      plantId, batchId, species, variety, nodeCount, propagationMethod,
      rootingStatus, location, notes, imageUrl, dateCut, costPerCutting, salePrice,
    } = body;

    if (!species) {
      return Response.json(
        { error: "Species is required" },
        { status: 400 }
      );
    }

    const cutting = await prisma.cutting.create({
      data: {
        plantId,
        batchId,
        species,
        variety,
        nodeCount: nodeCount ?? 1,
        propagationMethod: propagationMethod ?? "water",
        rootingStatus: rootingStatus ?? "not_started",
        location,
        notes,
        imageUrl,
        dateCut: dateCut ? new Date(dateCut) : undefined,
        costPerCutting: costPerCutting ?? 0,
        salePrice,
        userId: user.userId,
      },
      include: {
        plant: { select: { id: true, name: true, species: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    return Response.json({ cutting }, { status: 201 });
  } catch (error) {
    console.error("Create cutting error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
