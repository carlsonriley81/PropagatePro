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
    const search = searchParams.get("search");
    const species = searchParams.get("species");

    const where: Record<string, unknown> = { userId: user.userId };

    if (species) {
      where.species = species;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { species: { contains: search } },
        { variety: { contains: search } },
      ];
    }

    const plants = await prisma.plant.findMany({
      where,
      include: { _count: { select: { cuttings: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ plants });
  } catch (error) {
    console.error("List plants error:", error);
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
    const { name, species, variety, source, location, notes, imageUrl, isMotherPlant, quantity, datePlanted, healthStatus } = body;

    if (!name || !species) {
      return Response.json(
        { error: "Name and species are required" },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.create({
      data: {
        name,
        species,
        variety,
        source,
        location,
        notes,
        imageUrl,
        isMotherPlant: isMotherPlant ?? true,
        quantity: quantity ?? 1,
        datePlanted: datePlanted ? new Date(datePlanted) : undefined,
        healthStatus: healthStatus ?? "healthy",
        userId: user.userId,
      },
    });

    return Response.json({ plant }, { status: 201 });
  } catch (error) {
    console.error("Create plant error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
