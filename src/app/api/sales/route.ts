import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      where: { userId: user.userId },
      include: {
        cutting: {
          select: { id: true, uniqueCode: true, species: true, variety: true },
        },
      },
      orderBy: { soldAt: "desc" },
    });

    return Response.json({ sales });
  } catch (error) {
    console.error("List sales error:", error);
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
    const { cuttingId, salePrice, costBasis, buyerName, buyerEmail, notes, soldAt } = body;

    if (!cuttingId || salePrice === undefined) {
      return Response.json(
        { error: "Cutting ID and sale price are required" },
        { status: 400 }
      );
    }

    const cutting = await prisma.cutting.findFirst({
      where: { id: cuttingId, userId: user.userId },
    });
    if (!cutting) {
      return Response.json({ error: "Cutting not found" }, { status: 404 });
    }

    const finalCostBasis = costBasis ?? cutting.costPerCutting;
    const profit = salePrice - finalCostBasis;

    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          cuttingId,
          salePrice,
          costBasis: finalCostBasis,
          profit,
          buyerName,
          buyerEmail,
          notes,
          soldAt: soldAt ? new Date(soldAt) : undefined,
          userId: user.userId,
        },
        include: {
          cutting: {
            select: { id: true, uniqueCode: true, species: true },
          },
        },
      }),
      prisma.cutting.update({
        where: { id: cuttingId },
        data: {
          rootingStatus: "sold",
          dateSold: new Date(),
          salePrice,
        },
      }),
    ]);

    return Response.json({ sale }, { status: 201 });
  } catch (error) {
    console.error("Create sale error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
