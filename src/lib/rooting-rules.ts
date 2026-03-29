// Default rooting time rules (in days) for common plant species
export interface RootingTimeRange {
  species: string;
  method: string;
  minDays: number;
  maxDays: number;
}

export const DEFAULT_ROOTING_RULES: RootingTimeRange[] = [
  // Monstera adansonii
  { species: "Monstera adansonii", method: "water", minDays: 7, maxDays: 21 },
  { species: "Monstera adansonii", method: "soil", minDays: 14, maxDays: 30 },
  { species: "Monstera adansonii", method: "perlite", minDays: 14, maxDays: 30 },

  // Philodendron hederaceum
  { species: "Philodendron hederaceum", method: "water", minDays: 5, maxDays: 14 },
  { species: "Philodendron hederaceum", method: "soil", minDays: 10, maxDays: 25 },
  { species: "Philodendron hederaceum", method: "perlite", minDays: 10, maxDays: 25 },

  // Peperomia obtusifolia
  { species: "Peperomia obtusifolia", method: "water", minDays: 14, maxDays: 30 },
  { species: "Peperomia obtusifolia", method: "soil", minDays: 21, maxDays: 45 },
  { species: "Peperomia obtusifolia", method: "perlite", minDays: 21, maxDays: 45 },

  // Pothos
  { species: "Pothos", method: "water", minDays: 5, maxDays: 14 },
  { species: "Pothos", method: "soil", minDays: 10, maxDays: 21 },
  { species: "Pothos", method: "perlite", minDays: 10, maxDays: 21 },

  // Tradescantia
  { species: "Tradescantia", method: "water", minDays: 3, maxDays: 10 },
  { species: "Tradescantia", method: "soil", minDays: 7, maxDays: 14 },
  { species: "Tradescantia", method: "perlite", minDays: 7, maxDays: 14 },
];

export type HealthStatusLevel = "healthy" | "delayed" | "at_risk" | "likely_failed";

export interface HealthAssessment {
  status: HealthStatusLevel;
  daysElapsed: number;
  maxExpected: number;
  percentOverdue: number;
  suggestion: string;
  color: string;
}

export function assessCuttingHealth(
  dateCut: Date,
  species: string,
  propagationMethod: string,
  rootingStatus: string,
  customRules?: RootingTimeRange[]
): HealthAssessment {
  // If already rooted/transplanted/sold, it's healthy
  if (["rooted", "transplanted", "sold"].includes(rootingStatus)) {
    return {
      status: "healthy",
      daysElapsed: 0,
      maxExpected: 0,
      percentOverdue: 0,
      suggestion: "This cutting has successfully rooted!",
      color: "green",
    };
  }

  if (rootingStatus === "dead") {
    return {
      status: "likely_failed",
      daysElapsed: 0,
      maxExpected: 0,
      percentOverdue: 100,
      suggestion: "This cutting has been marked as dead.",
      color: "red",
    };
  }

  const rules = customRules || DEFAULT_ROOTING_RULES;
  const rule = rules.find(
    (r) =>
      r.species.toLowerCase() === species.toLowerCase() &&
      r.method.toLowerCase() === propagationMethod.toLowerCase()
  );

  // Default fallback if no rule found
  const maxDays = rule?.maxDays || 30;
  const now = new Date();
  const daysElapsed = Math.floor(
    (now.getTime() - new Date(dateCut).getTime()) / (1000 * 60 * 60 * 24)
  );

  const percentOverdue =
    daysElapsed <= maxDays ? 0 : ((daysElapsed - maxDays) / maxDays) * 100;

  if (percentOverdue >= 75) {
    return {
      status: "likely_failed",
      daysElapsed,
      maxExpected: maxDays,
      percentOverdue,
      suggestion: "Consider recutting node. Check for rot and signs of decay.",
      color: "red",
    };
  }

  if (percentOverdue >= 50) {
    return {
      status: "at_risk",
      daysElapsed,
      maxExpected: maxDays,
      percentOverdue,
      suggestion: "Check for rot. Consider refreshing water or medium.",
      color: "orange",
    };
  }

  if (percentOverdue >= 25) {
    return {
      status: "delayed",
      daysElapsed,
      maxExpected: maxDays,
      percentOverdue,
      suggestion: "Refresh water. Ensure adequate light and warmth.",
      color: "yellow",
    };
  }

  return {
    status: "healthy",
    daysElapsed,
    maxExpected: maxDays,
    percentOverdue: 0,
    suggestion: "On track! Continue current care routine.",
    color: "green",
  };
}
