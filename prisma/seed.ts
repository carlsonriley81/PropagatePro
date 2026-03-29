import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";

const now = new Date();

async function main() {
  console.log("🌱 Seeding database...");

  // --- Demo User ---
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@propagatepro.com" },
    update: { name: "Demo User", passwordHash },
    create: {
      email: "demo@propagatepro.com",
      name: "Demo User",
      passwordHash,
      role: "owner",
    },
  });

  console.log(`✅ User: ${user.name} (${user.email})`);

  // --- Mother Plants ---
  const plantData = [
    { name: "Monstera adansonii", species: "Monstera adansonii" },
    { name: "Philodendron hederaceum", species: "Philodendron hederaceum" },
    { name: "Peperomia obtusifolia", species: "Peperomia obtusifolia" },
  ] as const;

  const plants: Record<string, Awaited<ReturnType<typeof prisma.plant.upsert>>> = {};

  for (const p of plantData) {
    // Use a stable ID derived from species for idempotency
    const existingPlant = await prisma.plant.findFirst({
      where: { userId: user.id, species: p.species, isMotherPlant: true },
    });

    if (existingPlant) {
      plants[p.species] = await prisma.plant.update({
        where: { id: existingPlant.id },
        data: {
          name: p.name,
          isMotherPlant: true,
          healthStatus: "healthy",
          location: "Greenhouse A",
        },
      });
    } else {
      plants[p.species] = await prisma.plant.create({
        data: {
          name: p.name,
          species: p.species,
          isMotherPlant: true,
          healthStatus: "healthy",
          location: "Greenhouse A",
          userId: user.id,
        },
      });
    }
  }

  console.log(`✅ Mother plants: ${Object.keys(plants).length}`);

  // --- Rooting Rules ---
  const rootingRulesData = [
    { species: "Monstera adansonii", method: "water", min: 7, max: 21 },
    { species: "Monstera adansonii", method: "soil", min: 14, max: 30 },
    { species: "Monstera adansonii", method: "perlite", min: 14, max: 30 },
    { species: "Philodendron hederaceum", method: "water", min: 5, max: 14 },
    { species: "Philodendron hederaceum", method: "soil", min: 10, max: 25 },
    { species: "Philodendron hederaceum", method: "perlite", min: 10, max: 25 },
    { species: "Peperomia obtusifolia", method: "water", min: 14, max: 30 },
    { species: "Peperomia obtusifolia", method: "soil", min: 21, max: 45 },
    { species: "Peperomia obtusifolia", method: "perlite", min: 21, max: 45 },
  ];

  for (const rule of rootingRulesData) {
    await prisma.rootingRule.upsert({
      where: {
        userId_species_propagationMethod: {
          userId: user.id,
          species: rule.species,
          propagationMethod: rule.method,
        },
      },
      update: { minDays: rule.min, maxDays: rule.max },
      create: {
        userId: user.id,
        species: rule.species,
        propagationMethod: rule.method,
        minDays: rule.min,
        maxDays: rule.max,
      },
    });
  }

  console.log(`✅ Rooting rules: ${rootingRulesData.length}`);

  // --- Batches ---
  const batches: Record<string, Awaited<ReturnType<typeof prisma.batch.create>>> = {};

  for (const species of Object.keys(plants)) {
    const batchName = `Spring Batch 2024`;
    const existing = await prisma.batch.findFirst({
      where: { userId: user.id, species, name: batchName },
    });

    if (existing) {
      batches[species] = existing;
    } else {
      batches[species] = await prisma.batch.create({
        data: {
          name: batchName,
          species,
          userId: user.id,
          notes: `Spring 2024 propagation batch for ${species}`,
        },
      });
    }
  }

  console.log(`✅ Batches: ${Object.keys(batches).length}`);

  // --- Helper: find or create cutting by uniqueCode ---
  async function upsertCutting(
    uniqueCode: string,
    data: Parameters<typeof prisma.cutting.create>[0]["data"],
  ) {
    const existing = await prisma.cutting.findUnique({ where: { uniqueCode } });
    if (existing) {
      const { uniqueCode: _uc, userId: _uid, ...updateData } = data as Record<string, unknown>;
      return prisma.cutting.update({ where: { id: existing.id }, data: updateData });
    }
    return prisma.cutting.create({ data: { ...data, uniqueCode } });
  }

  // --- Monstera Cuttings ---
  const monsteraPlant = plants["Monstera adansonii"];
  const monsteraBatch = batches["Monstera adansonii"];

  const monsteraCutting1 = await upsertCutting("monstera-cutting-001", {
    uniqueCode: "monstera-cutting-001",
    species: "Monstera adansonii",
    plantId: monsteraPlant.id,
    batchId: monsteraBatch.id,
    userId: user.id,
    nodeCount: 2,
    propagationMethod: "water",
    rootingStatus: "rooting",
    healthStatus: "healthy",
    location: "Propagation Station A",
    dateCut: subDays(now, 7),
    lastWatered: subDays(now, 1),
    costPerCutting: 2.5,
  });

  const monsteraCutting2 = await upsertCutting("monstera-cutting-002", {
    uniqueCode: "monstera-cutting-002",
    species: "Monstera adansonii",
    plantId: monsteraPlant.id,
    batchId: monsteraBatch.id,
    userId: user.id,
    nodeCount: 3,
    propagationMethod: "water",
    rootingStatus: "rooted",
    healthStatus: "healthy",
    location: "Propagation Station A",
    dateCut: subDays(now, 14),
    dateRooted: subDays(now, 3),
    lastWatered: subDays(now, 1),
    costPerCutting: 2.5,
  });

  const monsteraCutting3 = await upsertCutting("monstera-cutting-003", {
    uniqueCode: "monstera-cutting-003",
    species: "Monstera adansonii",
    plantId: monsteraPlant.id,
    batchId: monsteraBatch.id,
    userId: user.id,
    nodeCount: 1,
    propagationMethod: "perlite",
    rootingStatus: "not_started",
    healthStatus: "healthy",
    location: "Cutting prep area",
    dateCut: now,
    costPerCutting: 2.5,
  });

  // --- Philodendron Cuttings ---
  const philoPlant = plants["Philodendron hederaceum"];
  const philoBatch = batches["Philodendron hederaceum"];

  const philoCutting1 = await upsertCutting("philo-cutting-001", {
    uniqueCode: "philo-cutting-001",
    species: "Philodendron hederaceum",
    plantId: philoPlant.id,
    batchId: philoBatch.id,
    userId: user.id,
    nodeCount: 2,
    propagationMethod: "water",
    rootingStatus: "rooting",
    healthStatus: "healthy",
    location: "Propagation Station B",
    dateCut: subDays(now, 5),
    lastWatered: subDays(now, 1),
    costPerCutting: 1.5,
  });

  const philoCutting2 = await upsertCutting("philo-cutting-002", {
    uniqueCode: "philo-cutting-002",
    species: "Philodendron hederaceum",
    plantId: philoPlant.id,
    batchId: philoBatch.id,
    userId: user.id,
    nodeCount: 3,
    propagationMethod: "soil",
    rootingStatus: "transplanted",
    healthStatus: "healthy",
    location: "Potting bench",
    dateCut: subDays(now, 30),
    dateRooted: subDays(now, 15),
    dateTransplanted: subDays(now, 5),
    lastWatered: subDays(now, 2),
    costPerCutting: 1.5,
  });

  const philoCuttingSold = await upsertCutting("philo-cutting-003", {
    uniqueCode: "philo-cutting-003",
    species: "Philodendron hederaceum",
    plantId: philoPlant.id,
    batchId: philoBatch.id,
    userId: user.id,
    nodeCount: 4,
    propagationMethod: "water",
    rootingStatus: "sold",
    healthStatus: "healthy",
    location: "Sold",
    dateCut: subDays(now, 45),
    dateRooted: subDays(now, 30),
    dateTransplanted: subDays(now, 20),
    dateSold: subDays(now, 2),
    costPerCutting: 3,
    salePrice: 25,
  });

  // --- Peperomia Cuttings ---
  const pepPlant = plants["Peperomia obtusifolia"];
  const pepBatch = batches["Peperomia obtusifolia"];

  const pepCutting1 = await upsertCutting("pep-cutting-001", {
    uniqueCode: "pep-cutting-001",
    species: "Peperomia obtusifolia",
    plantId: pepPlant.id,
    batchId: pepBatch.id,
    userId: user.id,
    nodeCount: 2,
    propagationMethod: "water",
    rootingStatus: "rooting",
    healthStatus: "delayed",
    location: "Propagation Station C",
    dateCut: subDays(now, 25),
    lastWatered: subDays(now, 2),
    costPerCutting: 1,
    notes: "Slow to root, may need warmer location",
  });

  await upsertCutting("pep-cutting-002", {
    uniqueCode: "pep-cutting-002",
    species: "Peperomia obtusifolia",
    plantId: pepPlant.id,
    batchId: pepBatch.id,
    userId: user.id,
    nodeCount: 1,
    propagationMethod: "soil",
    rootingStatus: "dead",
    healthStatus: "dead",
    location: "Disposed",
    dateCut: subDays(now, 35),
    costPerCutting: 1,
    notes: "Root rot - overwatered",
  });

  console.log("✅ Cuttings: 8");

  // --- Tasks ---
  const taskData = [
    {
      cuttingId: monsteraCutting1.id,
      taskType: "cutting",
      description: "Take cutting from mother Monstera",
      duration: 10,
      completedAt: subDays(now, 7),
    },
    {
      cuttingId: monsteraCutting1.id,
      taskType: "water_change",
      description: "Change water for Monstera cutting",
      duration: 5,
      completedAt: subDays(now, 4),
    },
    {
      cuttingId: philoCutting2.id,
      taskType: "planting",
      description: "Transplant rooted Philodendron to soil",
      duration: 15,
      completedAt: subDays(now, 5),
    },
    {
      cuttingId: pepCutting1.id,
      taskType: "maintenance",
      description: "Check Peperomia cutting health, moved to warmer spot",
      duration: 5,
      completedAt: subDays(now, 3),
    },
  ];

  // Clear existing tasks for idempotency, then recreate
  await prisma.task.deleteMany({
    where: { userId: user.id, cuttingId: { in: taskData.map((t) => t.cuttingId) } },
  });

  for (const task of taskData) {
    await prisma.task.create({
      data: {
        userId: user.id,
        cuttingId: task.cuttingId,
        taskType: task.taskType,
        description: task.description,
        duration: task.duration,
        completedAt: task.completedAt,
      },
    });
  }

  console.log(`✅ Tasks: ${taskData.length}`);

  // --- Time Logs ---
  const timeLogData = [
    {
      cuttingId: monsteraCutting1.id,
      taskType: "cutting",
      startTime: subDays(now, 7),
      duration: 10,
      notes: "Monstera cutting session",
    },
    {
      cuttingId: philoCutting2.id,
      taskType: "planting",
      startTime: subDays(now, 5),
      duration: 15,
      notes: "Transplanting session",
    },
    {
      cuttingId: monsteraCutting1.id,
      taskType: "water_change",
      startTime: subDays(now, 4),
      duration: 5,
      notes: "Water change round",
    },
    {
      cuttingId: pepCutting1.id,
      taskType: "maintenance",
      startTime: subDays(now, 3),
      duration: 5,
      notes: "Health check and relocation",
    },
  ];

  await prisma.timeLog.deleteMany({
    where: { userId: user.id, cuttingId: { in: timeLogData.map((t) => t.cuttingId) } },
  });

  for (const log of timeLogData) {
    const endTime = new Date(log.startTime.getTime() + log.duration * 60 * 1000);
    await prisma.timeLog.create({
      data: {
        userId: user.id,
        cuttingId: log.cuttingId,
        taskType: log.taskType,
        startTime: log.startTime,
        endTime,
        duration: log.duration,
        notes: log.notes,
        isRunning: false,
      },
    });
  }

  console.log(`✅ Time logs: ${timeLogData.length}`);

  // --- Sale for sold Philodendron ---
  await prisma.sale.upsert({
    where: { cuttingId: philoCuttingSold.id },
    update: {
      salePrice: 25,
      costBasis: 3,
      profit: 22,
      buyerName: "Jane Smith",
      buyerEmail: "jane@example.com",
      soldAt: subDays(now, 2),
    },
    create: {
      cuttingId: philoCuttingSold.id,
      userId: user.id,
      salePrice: 25,
      costBasis: 3,
      profit: 22,
      buyerName: "Jane Smith",
      buyerEmail: "jane@example.com",
      soldAt: subDays(now, 2),
      notes: "Sold at local plant swap",
    },
  });

  console.log("✅ Sale: 1");

  // --- Supplies ---
  const suppliesData = [
    {
      name: "Perlite",
      category: "medium",
      quantity: 10,
      unit: "liters",
      costPerUnit: 1.5,
      totalCost: 15,
    },
    {
      name: "Rooting Hormone",
      category: "chemical",
      quantity: 1,
      unit: "bottle",
      costPerUnit: 8,
      totalCost: 8,
    },
    {
      name: "Small Pots (4 inch)",
      category: "container",
      quantity: 25,
      unit: "pieces",
      costPerUnit: 0.75,
      totalCost: 18.75,
    },
    {
      name: "Potting Soil",
      category: "medium",
      quantity: 20,
      unit: "liters",
      costPerUnit: 0.8,
      totalCost: 16,
    },
  ];

  // Delete + recreate for idempotency
  await prisma.supply.deleteMany({
    where: { userId: user.id, name: { in: suppliesData.map((s) => s.name) } },
  });

  for (const supply of suppliesData) {
    await prisma.supply.create({
      data: {
        userId: user.id,
        name: supply.name,
        category: supply.category,
        quantity: supply.quantity,
        unit: supply.unit,
        costPerUnit: supply.costPerUnit,
        totalCost: supply.totalCost,
        purchasedAt: subDays(now, 14),
      },
    });
  }

  console.log(`✅ Supplies: ${suppliesData.length}`);

  // --- Device ---
  const existingDevice = await prisma.device.findFirst({
    where: { userId: user.id, name: "Kasa Smart Plug" },
  });

  const device = existingDevice
    ? await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          deviceType: "smart_plug",
          brand: "TP-Link Kasa",
          zone: "Greenhouse A",
          ipAddress: "192.168.1.100",
          status: "online",
          isOn: true,
          lastPing: now,
        },
      })
    : await prisma.device.create({
        data: {
          userId: user.id,
          name: "Kasa Smart Plug",
          deviceType: "smart_plug",
          brand: "TP-Link Kasa",
          zone: "Greenhouse A",
          ipAddress: "192.168.1.100",
          status: "online",
          isOn: true,
          lastPing: now,
        },
      });

  console.log("✅ Device: 1");

  // --- Light Schedule ---
  const existingSchedule = await prisma.lightSchedule.findFirst({
    where: { userId: user.id, deviceId: device.id },
  });

  if (existingSchedule) {
    await prisma.lightSchedule.update({
      where: { id: existingSchedule.id },
      data: {
        zone: "Greenhouse A",
        onTime: "07:00",
        offTime: "21:00",
        isActive: true,
        mode: "scheduled",
      },
    });
  } else {
    await prisma.lightSchedule.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        zone: "Greenhouse A",
        onTime: "07:00",
        offTime: "21:00",
        isActive: true,
        mode: "scheduled",
      },
    });
  }

  console.log("✅ Light schedule: 1");

  // --- Notifications ---
  await prisma.notification.deleteMany({ where: { userId: user.id } });

  const notificationsData = [
    {
      title: "Water Change Reminder",
      message:
        "Time to change the water for your Monstera adansonii cuttings in Propagation Station A.",
      type: "water_change",
      isRead: false,
      actionUrl: "/cuttings",
    },
    {
      title: "Root Check Reminder",
      message:
        "Your Peperomia obtusifolia cutting has been rooting for 25 days. Time to check for root development.",
      type: "root_check",
      isRead: false,
      actionUrl: "/cuttings",
    },
  ];

  for (const notification of notificationsData) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
      },
    });
  }

  console.log(`✅ Notifications: ${notificationsData.length}`);

  console.log("\n🌿 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
