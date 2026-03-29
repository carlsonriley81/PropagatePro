import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [lightSchedules, waterSchedules] = await Promise.all([
      prisma.lightSchedule.findMany({
        where: { userId: user.userId },
        include: { device: { select: { id: true, name: true, zone: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.waterSchedule.findMany({
        where: { userId: user.userId },
        include: { device: { select: { id: true, name: true, zone: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return Response.json({ lightSchedules, waterSchedules });
  } catch (error) {
    console.error("List schedules error:", error);
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
    const { type } = body;

    if (type === "light") {
      const { deviceId, zone, onTime, offTime, isActive, mode } = body;

      if (!deviceId || !onTime || !offTime) {
        return Response.json(
          { error: "Device ID, on time, and off time are required" },
          { status: 400 }
        );
      }

      const device = await prisma.device.findFirst({
        where: { id: deviceId, userId: user.userId },
      });
      if (!device) {
        return Response.json({ error: "Device not found" }, { status: 404 });
      }

      const schedule = await prisma.lightSchedule.create({
        data: {
          deviceId,
          zone,
          onTime,
          offTime,
          isActive: isActive ?? true,
          mode: mode ?? "scheduled",
          userId: user.userId,
        },
        include: { device: { select: { id: true, name: true, zone: true } } },
      });

      return Response.json({ schedule }, { status: 201 });
    }

    if (type === "water") {
      const { deviceId, zone, intervalDays, lastWatered, nextWatering, isActive, mode } = body;

      const schedule = await prisma.waterSchedule.create({
        data: {
          deviceId,
          zone,
          intervalDays: intervalDays ?? 3,
          lastWatered: lastWatered ? new Date(lastWatered) : undefined,
          nextWatering: nextWatering ? new Date(nextWatering) : undefined,
          isActive: isActive ?? true,
          mode: mode ?? "scheduled",
          userId: user.userId,
        },
        include: { device: { select: { id: true, name: true, zone: true } } },
      });

      return Response.json({ schedule }, { status: 201 });
    }

    return Response.json(
      { error: "Type must be 'light' or 'water'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create schedule error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
