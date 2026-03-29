import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const batches = await prisma.batch.findMany({
      where: { userId: user.userId },
      include: { _count: { select: { cuttings: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ batches });
  } catch (error) {
    console.error("List batches error:", error);
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
    const { name, species, notes } = body;

    if (!name || !species) {
      return Response.json(
        { error: "Name and species are required" },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        species,
        notes,
        userId: user.userId,
      },
    });

    return Response.json({ batch }, { status: 201 });
  } catch (error) {
    console.error("Create batch error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
