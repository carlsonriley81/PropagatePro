import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assessCuttingHealth, type RootingTimeRange } from "@/lib/rooting-rules";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.userId;

    // Get active cuttings (not yet rooted/transplanted/sold/dead)
    const activeCuttings = await prisma.cutting.findMany({
      where: {
        userId,
        rootingStatus: { in: ["not_started", "rooting"] },
      },
    });

    // Get user's custom rooting rules
    const customRulesRaw = await prisma.rootingRule.findMany({
      where: { userId },
    });

    const customRules: RootingTimeRange[] = customRulesRaw.map((r: { species: string; propagationMethod: string; minDays: number; maxDays: number }) => ({
      species: r.species,
      method: r.propagationMethod,
      minDays: r.minDays,
      maxDays: r.maxDays,
    }));

    const results: Array<{
      cuttingId: string;
      uniqueCode: string;
      species: string;
      previousStatus: string;
      newStatus: string;
      assessment: ReturnType<typeof assessCuttingHealth>;
    }> = [];

    const notificationsToCreate: Array<{
      userId: string;
      title: string;
      message: string;
      type: string;
      actionUrl: string;
    }> = [];

    for (const cutting of activeCuttings) {
      const assessment = assessCuttingHealth(
        cutting.dateCut,
        cutting.species,
        cutting.propagationMethod,
        cutting.rootingStatus,
        customRules.length > 0 ? customRules : undefined
      );

      const previousStatus = cutting.healthStatus;
      const newStatus = assessment.status;

      if (previousStatus !== newStatus) {
        await prisma.cutting.update({
          where: { id: cutting.id },
          data: { healthStatus: newStatus },
        });

        if (
          newStatus === "at_risk" ||
          newStatus === "likely_failed" ||
          newStatus === "delayed"
        ) {
          notificationsToCreate.push({
            userId,
            title: `Health Alert: ${cutting.species}`,
            message: `Cutting ${cutting.uniqueCode} is now "${newStatus}". ${assessment.suggestion}`,
            type: "health_alert",
            actionUrl: `/cuttings/${cutting.id}`,
          });
        }
      }

      results.push({
        cuttingId: cutting.id,
        uniqueCode: cutting.uniqueCode,
        species: cutting.species,
        previousStatus,
        newStatus,
        assessment,
      });
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }

    const statusChanges = results.filter(
      (r) => r.previousStatus !== r.newStatus
    );

    return Response.json({
      totalChecked: activeCuttings.length,
      statusChanges: statusChanges.length,
      notificationsCreated: notificationsToCreate.length,
      results,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
