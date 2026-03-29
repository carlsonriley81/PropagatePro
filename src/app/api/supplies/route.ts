import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supplies = await prisma.supply.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ supplies });
  } catch (error) {
    console.error("List supplies error:", error);
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
    const { name, category, quantity, unit, costPerUnit, totalCost, purchasedAt, notes } = body;

    if (!name || !category) {
      return Response.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const supply = await prisma.supply.create({
      data: {
        name,
        category,
        quantity: quantity ?? 0,
        unit,
        costPerUnit: costPerUnit ?? 0,
        totalCost: totalCost ?? (quantity ?? 0) * (costPerUnit ?? 0),
        purchasedAt: purchasedAt ? new Date(purchasedAt) : undefined,
        notes,
        userId: user.userId,
      },
    });

    return Response.json({ supply }, { status: 201 });
  } catch (error) {
    console.error("Create supply error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
