import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.userId;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      totalPlants,
      allCuttings,
      timeLogs,
      recentNotifications,
      sales,
    ] = await Promise.all([
      prisma.plant.count({ where: { userId } }),
      prisma.cutting.findMany({
        where: { userId },
        select: { rootingStatus: true, healthStatus: true },
      }),
      prisma.timeLog.findMany({
        where: {
          userId,
          startTime: { gte: weekStart },
          duration: { not: null },
        },
        select: { duration: true },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.sale.findMany({
        where: {
          userId,
          soldAt: { gte: monthStart, lte: monthEnd },
        },
        select: { salePrice: true, profit: true },
      }),
    ]);

    type CuttingStat = { rootingStatus: string; healthStatus: string };
    type TimeLogStat = { duration: number | null };

    const totalCuttings = allCuttings.length;

    const activePropagations = allCuttings.filter(
      (c: CuttingStat) => c.rootingStatus === "not_started" || c.rootingStatus === "rooting"
    ).length;

    const nonDeadCuttings = allCuttings.filter(
      (c: CuttingStat) => c.rootingStatus !== "dead"
    );
    const successfulCuttings = allCuttings.filter((c: CuttingStat) =>
      ["rooted", "transplanted", "sold"].includes(c.rootingStatus)
    );
    const rootingSuccessRate =
      nonDeadCuttings.length > 0
        ? Math.round((successfulCuttings.length / nonDeadCuttings.length) * 10000) / 100
        : 0;

    const timeWorkedThisWeek = timeLogs.reduce(
      (sum: number, t: TimeLogStat) => sum + (t.duration || 0),
      0
    );

    const plantsReadyForSale = allCuttings.filter(
      (c: CuttingStat) => c.rootingStatus === "rooted" || c.rootingStatus === "transplanted"
    ).length;

    const cuttingsAtRisk = allCuttings.filter(
      (c: CuttingStat) => c.healthStatus === "at_risk" || c.healthStatus === "likely_failed"
    ).length;

    const deadCuttings = allCuttings.filter(
      (c: CuttingStat) => c.rootingStatus === "dead"
    ).length;
    const failureRate =
      totalCuttings > 0
        ? Math.round((deadCuttings / totalCuttings) * 10000) / 100
        : 0;

    const salesThisMonth = sales.length;
    const revenueThisMonth = sales.reduce((sum: number, s: { salePrice: number }) => sum + s.salePrice, 0);

    return Response.json({
      totalPlants,
      totalCuttings,
      activePropagations,
      rootingSuccessRate,
      timeWorkedThisWeek,
      plantsReadyForSale,
      cuttingsAtRisk,
      failureRate,
      recentNotifications,
      salesThisMonth,
      revenueThisMonth,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
