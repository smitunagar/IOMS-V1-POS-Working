module.exports = {

"[project]/.next-internal/server/app/api/waste/seed/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/@opentelemetry/api [external] (@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@opentelemetry/api", () => require("@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}}),
"[project]/src/app/api/waste/seed/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
;
const prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
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
async function POST() {
    try {
        // Clear existing data
        await prisma.wasteEvent.deleteMany();
        await prisma.coverCount.deleteMany();
        await prisma.complianceCheck.deleteMany();
        console.log('Creating sample waste events...');
        const wasteTypes = [
            'food',
            'oil',
            'packaging',
            'organic'
        ];
        const stations = [
            'kitchen',
            'bar',
            'dining'
        ];
        const now = new Date();
        // Create waste events for the last 30 days
        const wasteEvents = [];
        for(let i = 0; i < 30; i++){
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            // Create 3-8 events per day
            const eventsPerDay = getRandomInt(3, 8);
            for(let j = 0; j < eventsPerDay; j++){
                const eventTime = new Date(date);
                eventTime.setHours(getRandomInt(8, 23), getRandomInt(0, 59));
                const type = getRandomElement(wasteTypes);
                const station = getRandomElement(stations);
                const amountKg = getRandomFloat(0.5, 15.0);
                const costEUR = calculateCostFromWaste(amountKg, type);
                const co2Kg = calculateCO2FromWaste(amountKg, type);
                wasteEvents.push({
                    amountKg,
                    type,
                    station,
                    costEUR,
                    co2Kg,
                    occurredAt: eventTime,
                    createdAt: eventTime,
                    confidence: getRandomFloat(0.7, 0.95),
                    notes: `Waste logged from ${station} - ${type}`
                });
            }
        }
        // Insert waste events in batches
        for(let i = 0; i < wasteEvents.length; i += 50){
            const batch = wasteEvents.slice(i, i + 50);
            await prisma.wasteEvent.createMany({
                data: batch
            });
        }
        console.log(`Created ${wasteEvents.length} waste events`);
        // Create cover counts for the last 30 days
        const coverCounts = [];
        for(let i = 0; i < 30; i++){
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const covers = getRandomInt(45, 120);
            const avgSpend = getRandomFloat(25, 45);
            const revenue = covers * avgSpend;
            coverCounts.push({
                date,
                covers,
                revenue,
                createdAt: date
            });
        }
        await prisma.coverCount.createMany({
            data: coverCounts
        });
        console.log(`Created ${coverCounts.length} cover count records`);
        // Create sample compliance checks
        const complianceChecks = [
            {
                title: 'Daily waste logging completed',
                description: 'Ensure all waste events are properly logged',
                severity: 'major',
                status: 'closed',
                dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Waste segregation audit',
                description: 'Verify proper waste segregation practices',
                severity: 'critical',
                status: 'in_progress',
                dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Staff training compliance',
                description: 'Complete waste management training for new staff',
                severity: 'minor',
                status: 'open',
                dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Monthly waste report submission',
                description: 'Submit monthly waste report to authorities',
                severity: 'major',
                status: 'open',
                dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
            }
        ];
        await prisma.complianceCheck.createMany({
            data: complianceChecks
        });
        console.log(`Created ${complianceChecks.length} compliance checks`);
        // Calculate summary statistics
        const totalEvents = await prisma.wasteEvent.count();
        const totalWaste = await prisma.wasteEvent.aggregate({
            _sum: {
                amountKg: true,
                costEUR: true,
                co2Kg: true
            }
        });
        const totalCovers = await prisma.coverCount.aggregate({
            _sum: {
                covers: true,
                revenue: true
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Sample data created successfully',
            summary: {
                wasteEvents: totalEvents,
                totalWasteKg: totalWaste._sum.amountKg?.toFixed(2),
                totalCostEUR: totalWaste._sum.costEUR?.toFixed(2),
                totalCO2Kg: totalWaste._sum.co2Kg?.toFixed(2),
                totalCovers: totalCovers._sum.covers,
                totalRevenue: totalCovers._sum.revenue?.toFixed(2),
                complianceChecks: complianceChecks.length
            }
        });
    } catch (error) {
        console.error('Error seeding data:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to seed data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    } finally{
        await prisma.$disconnect();
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__50ce595e._.js.map