import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return Response.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    const device = await prisma.device.findFirst({
      where: { id: deviceId, userId: user.userId },
    });
    if (!device) {
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: {
        isOn: false,
        lastCommand: "light_off",
        lastPing: new Date(),
        status: "online",
      },
    });

    return Response.json({
      message: "Light turned off",
      device: updated,
    });
  } catch (error) {
    console.error("Light off error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
