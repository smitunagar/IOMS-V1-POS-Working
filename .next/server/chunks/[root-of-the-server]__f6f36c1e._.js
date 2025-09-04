module.exports = [
"[project]/.next-internal/server/app/api/waste/compliance/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/src/services/wasteService.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnalyticsQuerySchema",
    ()=>AnalyticsQuerySchema,
    "ComplianceQuerySchema",
    ()=>ComplianceQuerySchema,
    "KPIQuerySchema",
    ()=>KPIQuerySchema,
    "WasteEventInputSchema",
    ()=>WasteEventInputSchema,
    "getAnalytics",
    ()=>getAnalytics,
    "getCompliance",
    ()=>getCompliance,
    "getOwnerKPIs",
    ()=>getOwnerKPIs,
    "logEvent",
    ()=>logEvent
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
;
const prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
const WasteEventInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    amountKg: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'food',
        'oil',
        'packaging',
        'organic'
    ]),
    station: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'kitchen',
        'bar',
        'dining'
    ]),
    staffId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
    photoUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    confidence: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(1).optional(),
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const AnalyticsQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tenantId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
    from: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date(),
    metric: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'weight',
        'cost',
        'co2'
    ]).optional()
});
const KPIQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tenantId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
    window: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'today',
        'week',
        'month'
    ])
});
const ComplianceQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tenantId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
    from: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date()
});
// Helper functions
function calculateCO2FromWaste(amountKg, type) {
    const co2Factors = {
        food: 2.5,
        oil: 3.2,
        packaging: 1.8,
        organic: 2.1
    };
    return amountKg * (co2Factors[type] || 2.0);
}
function calculateCostFromWaste(amountKg, type) {
    const costFactors = {
        food: 12.50,
        oil: 8.75,
        packaging: 5.20,
        organic: 6.80
    };
    return amountKg * (costFactors[type] || 8.0);
}
function getDateRange(window) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch(window){
        case 'today':
            return {
                from: today,
                to: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            };
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return {
                from: weekAgo,
                to: today
            };
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return {
                from: monthAgo,
                to: today
            };
        default:
            return {
                from: today,
                to: today
            };
    }
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
async function getOwnerKPIs(query) {
    const { from, to } = getDateRange(query.window);
    // Get current period data
    const currentWaste = await prisma.wasteEvent.aggregate({
        where: {
            occurredAt: {
                gte: from,
                lt: to
            }
        },
        _sum: {
            amountKg: true,
            costEUR: true,
            co2Kg: true
        },
        _count: true
    });
    // Get previous period for comparison
    const periodLength = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLength);
    const prevTo = from;
    const previousWaste = await prisma.wasteEvent.aggregate({
        where: {
            occurredAt: {
                gte: prevFrom,
                lt: prevTo
            }
        },
        _sum: {
            amountKg: true,
            costEUR: true,
            co2Kg: true
        }
    });
    // Get covers for the current period
    const covers = await prisma.coverCount.aggregate({
        where: {
            date: {
                gte: from,
                lt: to
            }
        },
        _sum: {
            covers: true,
            revenue: true
        }
    });
    const totalWasteKg = currentWaste._sum.amountKg || 0;
    const totalCostEUR = currentWaste._sum.costEUR || 0;
    const totalCO2Kg = currentWaste._sum.co2Kg || 0;
    const totalCovers = covers._sum.covers || 1;
    const totalRevenue = covers._sum.revenue || 1;
    const prevWasteKg = previousWaste._sum.amountKg || 0;
    const prevCostEUR = previousWaste._sum.costEUR || 0;
    const prevCO2Kg = previousWaste._sum.co2Kg || 0;
    // Calculate reduction percentages
    const wasteReductionPercent = prevWasteKg > 0 ? (prevWasteKg - totalWasteKg) / prevWasteKg * 100 : 0;
    const costSavingsEUR = prevCostEUR - totalCostEUR;
    const co2SavedKg = prevCO2Kg - totalCO2Kg;
    return {
        totalWasteKg,
        totalCostEUR,
        totalCO2Kg,
        wasteReductionPercent,
        costSavingsEUR,
        co2SavedKg,
        avgWastePerCover: totalWasteKg / totalCovers,
        wasteToSalesRatio: totalCostEUR / totalRevenue * 100,
        trends: {
            waste: wasteReductionPercent,
            cost: prevCostEUR > 0 ? (prevCostEUR - totalCostEUR) / prevCostEUR * 100 : 0,
            co2: prevCO2Kg > 0 ? (prevCO2Kg - totalCO2Kg) / prevCO2Kg * 100 : 0
        }
    };
}
async function getAnalytics(query) {
    const { from, to } = query;
    // Daily trends with proper SQLite query
    const dailyData = await prisma.$queryRaw`
    SELECT 
      DATE(occurredAt) as date,
      CAST(SUM(amountKg) AS REAL) as weight,
      CAST(SUM(costEUR) AS REAL) as cost,
      CAST(SUM(co2Kg) AS REAL) as co2
    FROM WasteEvent 
    WHERE occurredAt >= ${from} AND occurredAt <= ${to}
    GROUP BY DATE(occurredAt)
    ORDER BY date
  `;
    // Get covers for the same period
    const coverData = await prisma.coverCount.findMany({
        where: {
            date: {
                gte: from,
                lte: to
            }
        },
        select: {
            date: true,
            covers: true
        }
    });
    const dailyTrends = dailyData.map((day)=>{
        const coverInfo = coverData.find((c)=>formatDate(c.date) === day.date);
        return {
            date: day.date,
            weight: Number(day.weight),
            cost: Number(day.cost),
            co2: Number(day.co2),
            covers: coverInfo?.covers || 0
        };
    });
    // By category
    const categoryData = await prisma.wasteEvent.groupBy({
        by: [
            'type'
        ],
        where: {
            occurredAt: {
                gte: from,
                lte: to
            }
        },
        _sum: {
            amountKg: true,
            costEUR: true,
            co2Kg: true
        }
    });
    const totalWeight = categoryData.reduce((sum, cat)=>sum + (cat._sum.amountKg || 0), 0);
    const byCategory = categoryData.map((cat)=>({
            type: cat.type,
            weight: cat._sum.amountKg || 0,
            cost: cat._sum.costEUR || 0,
            co2: cat._sum.co2Kg || 0,
            percentage: totalWeight > 0 ? (cat._sum.amountKg || 0) / totalWeight * 100 : 0
        }));
    // By station
    const stationData = await prisma.wasteEvent.groupBy({
        by: [
            'station'
        ],
        where: {
            occurredAt: {
                gte: from,
                lte: to
            }
        },
        _sum: {
            amountKg: true,
            costEUR: true,
            co2Kg: true
        }
    });
    const byStation = stationData.map((station)=>({
            station: station.station,
            weight: station._sum.amountKg || 0,
            cost: station._sum.costEUR || 0,
            co2: station._sum.co2Kg || 0,
            percentage: totalWeight > 0 ? (station._sum.amountKg || 0) / totalWeight * 100 : 0
        }));
    // Mock top wasted dishes (would need menu item integration)
    const topWastedDishes = [
        {
            dish: "Caesar Salad",
            frequency: 15,
            totalWaste: 12.5,
            estimatedCost: 156.25
        },
        {
            dish: "Grilled Salmon",
            frequency: 12,
            totalWaste: 18.0,
            estimatedCost: 225.00
        },
        {
            dish: "Beef Burger",
            frequency: 10,
            totalWaste: 8.5,
            estimatedCost: 106.25
        },
        {
            dish: "Pasta Carbonara",
            frequency: 8,
            totalWaste: 6.2,
            estimatedCost: 77.50
        },
        {
            dish: "Chicken Wings",
            frequency: 7,
            totalWaste: 9.1,
            estimatedCost: 113.75
        }
    ];
    // Calculate ratios
    const totalCovers = coverData.reduce((sum, c)=>sum + c.covers, 0);
    const totalRevenue = await prisma.coverCount.aggregate({
        where: {
            date: {
                gte: from,
                lte: to
            }
        },
        _sum: {
            revenue: true
        }
    });
    const ratios = {
        wastePerCover: totalCovers > 0 ? totalWeight / totalCovers : 0,
        wasteToSales: (totalRevenue._sum.revenue || 0) > 0 ? categoryData.reduce((sum, cat)=>sum + (cat._sum.costEUR || 0), 0) / (totalRevenue._sum.revenue || 1) * 100 : 0,
        costPerCover: totalCovers > 0 ? categoryData.reduce((sum, cat)=>sum + (cat._sum.costEUR || 0), 0) / totalCovers : 0
    };
    // Impact calculations
    const totalCO2 = categoryData.reduce((sum, cat)=>sum + (cat._sum.co2Kg || 0), 0);
    const impact = {
        co2Equivalent: `${totalCO2.toFixed(1)} kg CO₂`,
        treesEquivalent: Math.round(totalCO2 / 22),
        mealsLost: Math.round(totalWeight / 0.5) // Assuming 500g per meal
    };
    return {
        dailyTrends,
        byCategory,
        byStation,
        topWastedDishes,
        ratios,
        impact
    };
}
async function getCompliance(query) {
    const { from, to } = query;
    // Get compliance checks
    const checks = await prisma.complianceCheck.findMany({
        where: {
            createdAt: {
                gte: from,
                lte: to
            }
        },
        include: {
            assignee: {
                select: {
                    name: true
                }
            }
        }
    });
    // Count violations by severity and status
    const openViolations = {
        critical: checks.filter((c)=>c.status === 'open' && c.severity === 'critical').length,
        major: checks.filter((c)=>c.status === 'open' && c.severity === 'major').length,
        minor: checks.filter((c)=>c.status === 'open' && c.severity === 'minor').length
    };
    // Calculate compliance score (based on resolved vs total issues)
    const totalIssues = checks.length;
    const resolvedIssues = checks.filter((c)=>c.status === 'closed').length;
    const score = totalIssues > 0 ? Math.round(resolvedIssues / totalIssues * 100) : 100;
    // Format actions
    const now = new Date();
    const actions = checks.map((check)=>({
            id: check.id,
            title: check.title,
            severity: check.severity,
            status: check.status,
            dueDate: check.dueDate.toISOString().split('T')[0],
            assignee: check.assignee?.name || null,
            overdue: check.dueDate < now && check.status !== 'closed'
        }));
    // Calculate log completeness (mock - would check actual logging frequency)
    const expectedLogs = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) * 3; // 3 logs per day expected
    const actualLogs = await prisma.wasteEvent.count({
        where: {
            occurredAt: {
                gte: from,
                lte: to
            }
        }
    });
    const logCompleteness = Math.min(100, Math.round(actualLogs / expectedLogs * 100));
    // SDG 12.3 progress (50% food waste reduction by 2030)
    // Mock calculation - would need baseline year data
    const currentFoodWaste = await prisma.wasteEvent.aggregate({
        where: {
            type: 'food',
            occurredAt: {
                gte: from,
                lte: to
            }
        },
        _sum: {
            amountKg: true
        }
    });
    // Assume 25% reduction achieved towards 50% goal
    const sdg12_3Progress = 50; // 50% progress towards SDG 12.3
    return {
        score,
        openViolations,
        actions,
        logCompleteness,
        sdg12_3Progress
    };
}
async function logEvent(input) {
    const validatedInput = WasteEventInputSchema.parse(input);
    // Calculate cost and CO2 if not provided
    const costEUR = calculateCostFromWaste(validatedInput.amountKg, validatedInput.type);
    const co2Kg = calculateCO2FromWaste(validatedInput.amountKg, validatedInput.type);
    await prisma.wasteEvent.create({
        data: {
            ...validatedInput,
            costEUR,
            co2Kg,
            occurredAt: new Date()
        }
    });
}
}),
"[project]/src/app/api/waste/compliance/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wasteService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/wasteService.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // Parse query parameters
        const range = searchParams.get('range') || '30d';
        // Convert range to dates
        const now = new Date();
        let daysAgo;
        switch(range){
            case '7d':
                daysAgo = 7;
                break;
            case '30d':
                daysAgo = 30;
                break;
            case '90d':
                daysAgo = 90;
                break;
            default:
                daysAgo = 30;
        }
        const from = new Date(now);
        from.setDate(from.getDate() - daysAgo);
        // Validate with schema
        const query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wasteService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ComplianceQuerySchema"].parse({
            from,
            to: now
        });
        const compliance = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wasteService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCompliance"])(query);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: compliance,
            range
        });
    } catch (error) {
        console.error('Compliance API error:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Invalid query parameters',
                details: error.message
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch compliance data'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f6f36c1e._.js.map