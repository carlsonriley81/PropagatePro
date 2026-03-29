import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const devices = await prisma.device.findMany({
      where: { userId: user.userId },
      include: {
        _count: { select: { lightSchedules: true, waterSchedules: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ devices });
  } catch (error) {
    console.error("List devices error:", error);
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
    const { name, deviceType, brand, zone, ipAddress, status } = body;

    if (!name || !deviceType) {
      return Response.json(
        { error: "Name and device type are required" },
        { status: 400 }
      );
    }

    const device = await prisma.device.create({
      data: {
        name,
        deviceType,
        brand,
        zone,
        ipAddress,
        status: status ?? "offline",
        userId: user.userId,
      },
    });

    return Response.json({ device }, { status: 201 });
  } catch (error) {
    console.error("Create device error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
