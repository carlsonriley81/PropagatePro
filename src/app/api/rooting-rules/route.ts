import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROOTING_RULES } from "@/lib/rooting-rules";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customRules = await prisma.rootingRule.findMany({
      where: { userId: user.userId },
      orderBy: { species: "asc" },
    });

    interface CustomRule {
      id: string;
      species: string;
      propagationMethod: string;
      minDays: number;
      maxDays: number;
    }

    // Merge custom rules with defaults - custom rules override defaults
    const customMap = new Map<string, CustomRule>(
      customRules.map((r: CustomRule) => [`${r.species.toLowerCase()}:${r.propagationMethod.toLowerCase()}`, r])
    );

    const mergedRules = DEFAULT_ROOTING_RULES.map((defaultRule) => {
      const key = `${defaultRule.species.toLowerCase()}:${defaultRule.method.toLowerCase()}`;
      const custom = customMap.get(key);
      if (custom) {
        customMap.delete(key);
        return {
          id: custom.id,
          species: custom.species,
          method: custom.propagationMethod,
          minDays: custom.minDays,
          maxDays: custom.maxDays,
          isCustom: true,
        };
      }
      return {
        id: null,
        species: defaultRule.species,
        method: defaultRule.method,
        minDays: defaultRule.minDays,
        maxDays: defaultRule.maxDays,
        isCustom: false,
      };
    });

    // Add any custom rules for species not in defaults
    for (const custom of customMap.values()) {
      mergedRules.push({
        id: custom.id,
        species: custom.species,
        method: custom.propagationMethod,
        minDays: custom.minDays,
        maxDays: custom.maxDays,
        isCustom: true,
      });
    }

    return Response.json({ rules: mergedRules });
  } catch (error) {
    console.error("List rooting rules error:", error);
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
    const { species, propagationMethod, minDays, maxDays } = body;

    if (!species || !propagationMethod || minDays === undefined || maxDays === undefined) {
      return Response.json(
        { error: "Species, propagation method, minDays, and maxDays are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.rootingRule.upsert({
      where: {
        userId_species_propagationMethod: {
          userId: user.userId,
          species,
          propagationMethod,
        },
      },
      update: { minDays, maxDays },
      create: {
        species,
        propagationMethod,
        minDays,
        maxDays,
        userId: user.userId,
      },
    });

    return Response.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Create rooting rule error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
