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

    const existing = await prisma.supply.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Supply not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, category, quantity, unit, costPerUnit, totalCost, purchasedAt, notes } = body;

    const supply = await prisma.supply.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(costPerUnit !== undefined && { costPerUnit }),
        ...(totalCost !== undefined && { totalCost }),
        ...(purchasedAt !== undefined && { purchasedAt: new Date(purchasedAt) }),
        ...(notes !== undefined && { notes }),
      },
    });

    return Response.json({ supply });
  } catch (error) {
    console.error("Update supply error:", error);
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

    const existing = await prisma.supply.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Supply not found" }, { status: 404 });
    }

    await prisma.supply.delete({ where: { id } });

    return Response.json({ message: "Supply deleted" });
  } catch (error) {
    console.error("Delete supply error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
