import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions for waste calculations
function calculateCO2FromWaste(amountKg: number, type: string): number {
  const co2Factors = {
    food: 2.5,     // kg CO2 per kg food waste
    oil: 3.2,      // kg CO2 per kg oil waste
    packaging: 1.8, // kg CO2 per kg packaging waste
    organic: 2.1   // kg CO2 per kg organic waste
  };
  return amountKg * (co2Factors[type as keyof typeof co2Factors] || 2.0);
}

function calculateCostFromWaste(amountKg: number, type: string): number {
  const costFactors = {
    food: 12.50,    // EUR per kg food waste
    oil: 8.75,      // EUR per kg oil waste
    packaging: 5.20, // EUR per kg packaging waste
    organic: 6.80   // EUR per kg organic waste
  };
  return amountKg * (costFactors[type as keyof typeof costFactors] || 8.0);
}

function getRandomDateInPast(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function main() {
  console.log('🌱 Starting WasteWatchDog seed...');

  // Create test users if they don't exist
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'chef@restaurant.com' },
      update: {},
      create: {
        name: 'Head Chef',
        email: 'chef@restaurant.com',
        password: 'hashed_password',
        role: 'chef'
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager@restaurant.com' },
      update: {},
      create: {
        name: 'Restaurant Manager',
        email: 'manager@restaurant.com',
        password: 'hashed_password',
        role: 'manager'
      }
    }),
    prisma.user.upsert({
      where: { email: 'staff@restaurant.com' },
      update: {},
      create: {
        name: 'Kitchen Staff',
        email: 'staff@restaurant.com',
        password: 'hashed_password',
        role: 'staff'
      }
    })
  ]);

  // Generate CoverCount data for 90 days
  console.log('📊 Generating cover count data...');
  const coverCounts = [];
  for (let i = 90; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Base covers with seasonal variation
    const baseCoversByDay = [120, 140, 130, 135, 180, 220, 200]; // Mon-Sun
    const dayOfWeek = date.getDay();
    const baseCovers = baseCoversByDay[dayOfWeek];
    
    // Add random variation (-20% to +30%)
    const variation = 0.8 + Math.random() * 0.5;
    const covers = Math.floor(baseCovers * variation);
    
    // Calculate revenue (average €45 per cover)
    const avgRevenuePerCover = 42 + Math.random() * 8; // €42-50 per cover
    const revenue = covers * avgRevenuePerCover;

    coverCounts.push({
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      covers,
      revenue: Math.round(revenue * 100) / 100
    });
  }

  await prisma.coverCount.createMany({
    data: coverCounts
  });

  // Generate WasteEvent data for 90 days
  console.log('🗑️ Generating waste event data...');
  const wasteTypes = ['food', 'oil', 'packaging', 'organic'];
  const stations = ['kitchen', 'bar', 'dining'];
  const wasteEvents = [];

  for (let i = 90; i >= 0; i--) {
    const eventsPerDay = 8 + Math.floor(Math.random() * 12); // 8-20 events per day
    
    for (let j = 0; j < eventsPerDay; j++) {
      const type = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
      const station = stations[Math.floor(Math.random() * stations.length)];
      
      // Generate realistic waste amounts with occasional spikes
      let baseAmount = 0;
      switch (type) {
        case 'food':
          baseAmount = 2 + Math.random() * 8; // 2-10 kg
          break;
        case 'oil':
          baseAmount = 0.5 + Math.random() * 2; // 0.5-2.5 kg
          break;
        case 'packaging':
          baseAmount = 1 + Math.random() * 4; // 1-5 kg
          break;
        case 'organic':
          baseAmount = 1.5 + Math.random() * 5; // 1.5-6.5 kg
          break;
      }
      
      // Occasional spikes (5% chance for 2-3x normal amount)
      const isSpike = Math.random() < 0.05;
      const amountKg = isSpike ? baseAmount * (2 + Math.random()) : baseAmount;
      
      const costEUR = calculateCostFromWaste(amountKg, type);
      const co2Kg = calculateCO2FromWaste(amountKg, type);
      const staffId = users[Math.floor(Math.random() * users.length)].id;
      
      wasteEvents.push({
        amountKg: Math.round(amountKg * 100) / 100,
        type,
        station,
        costEUR: Math.round(costEUR * 100) / 100,
        co2Kg: Math.round(co2Kg * 100) / 100,
        occurredAt: getRandomDateInPast(i),
        staffId,
        confidence: 0.7 + Math.random() * 0.3, // 70-100% confidence
        notes: Math.random() < 0.3 ? 'Auto-logged by AI scanner' : null
      });
    }
  }

  await prisma.wasteEvent.createMany({
    data: wasteEvents
  });

  // Generate ComplianceCheck data
  console.log('✅ Generating compliance check data...');
  const complianceIssues = [
    {
      title: 'Oil disposal documentation missing',
      description: 'Waste oil disposal certificates not found for last month',
      severity: 'critical',
      status: 'open',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
      title: 'Food waste segregation non-compliance',
      description: 'Mixed organic and packaging waste found in kitchen bins',
      severity: 'major',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    },
    {
      title: 'Temperature log incomplete',
      description: 'Waste storage temperature logs missing for weekend',
      severity: 'minor',
      status: 'closed',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      title: 'Excess food waste threshold exceeded',
      description: 'Daily food waste exceeded 15kg threshold on multiple occasions',
      severity: 'major',
      status: 'open',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
    },
    {
      title: 'Staff training documentation',
      description: 'Waste management training certificates need renewal',
      severity: 'minor',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  ];

  for (const issue of complianceIssues) {
    await prisma.complianceCheck.create({
      data: {
        ...issue,
        assignedTo: users[Math.floor(Math.random() * users.length)].id
      }
    });
  }

  console.log('✅ WasteWatchDog seed completed!');
  console.log(`📊 Generated ${coverCounts.length} cover count records`);
  console.log(`🗑️ Generated ${wasteEvents.length} waste events`);
  console.log(`✅ Generated ${complianceIssues.length} compliance checks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
