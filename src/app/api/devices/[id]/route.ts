import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const device = await prisma.device.findFirst({
      where: { id, userId: user.userId },
      include: {
        lightSchedules: true,
        waterSchedules: true,
      },
    });

    if (!device) {
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    return Response.json({ device });
  } catch (error) {
    console.error("Get device error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const existing = await prisma.device.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, deviceType, brand, zone, ipAddress, status, isOn, lastCommand } = body;

    const device = await prisma.device.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(deviceType !== undefined && { deviceType }),
        ...(brand !== undefined && { brand }),
        ...(zone !== undefined && { zone }),
        ...(ipAddress !== undefined && { ipAddress }),
        ...(status !== undefined && { status }),
        ...(isOn !== undefined && { isOn }),
        ...(lastCommand !== undefined && { lastCommand }),
      },
    });

    return Response.json({ device });
  } catch (error) {
    console.error("Update device error:", error);
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

    const existing = await prisma.device.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    await prisma.device.delete({ where: { id } });

    return Response.json({ message: "Device deleted" });
  } catch (error) {
    console.error("Delete device error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
