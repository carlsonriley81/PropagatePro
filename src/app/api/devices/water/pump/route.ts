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
    const { deviceId, zone } = body;

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
        lastCommand: `water_pump${zone ? `_zone_${zone}` : ""}`,
        lastPing: new Date(),
        status: "online",
      },
    });

    // Log the action as a notification
    await prisma.notification.create({
      data: {
        userId: user.userId,
        title: "Water Pump Activated",
        message: `Water pump on device "${device.name}" activated${zone ? ` for zone ${zone}` : ""}`,
        type: "device_action",
      },
    });

    return Response.json({
      message: "Water pump activated",
      device: updated,
      zone: zone || null,
    });
  } catch (error) {
    console.error("Water pump error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
