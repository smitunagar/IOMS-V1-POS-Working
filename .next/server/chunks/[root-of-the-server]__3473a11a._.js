module.exports = [
"[project]/.next-internal/server/app/api/waste/sustainability/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/app/api/waste/sustainability/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    try {
        // Mock sustainability data - replace with actual calculations
        const sustainabilityData = {
            success: true,
            data: {
                range,
                carbonFootprint: {
                    reduction: 24,
                    totalSaved: 1.2,
                    equivalent: '2,400 km driving',
                    trend: 'improving'
                },
                sustainabilityScore: {
                    overall: 8.4,
                    breakdown: {
                        wasteReduction: 8.8,
                        energyEfficiency: 7.9,
                        compliance: 8.7,
                        innovation: 8.2
                    }
                },
                wasteDeversion: {
                    fromLandfill: 89,
                    breakdown: {
                        recycled: 45,
                        composted: 32,
                        donated: 12
                    }
                },
                impactMetrics: {
                    co2Saved: 1200,
                    waterSaved: 3400,
                    energySaved: 890,
                    costSavings: 245 // EUR
                },
                trends: {
                    monthly: [
                        {
                            month: 'Jan',
                            score: 7.8,
                            co2: 980
                        },
                        {
                            month: 'Feb',
                            score: 8.1,
                            co2: 1050
                        },
                        {
                            month: 'Mar',
                            score: 8.3,
                            co2: 1120
                        },
                        {
                            month: 'Apr',
                            score: 8.4,
                            co2: 1200
                        },
                        {
                            month: 'May',
                            score: 8.2,
                            co2: 1180
                        },
                        {
                            month: 'Jun',
                            score: 8.5,
                            co2: 1250
                        },
                        {
                            month: 'Jul',
                            score: 8.4,
                            co2: 1200
                        },
                        {
                            month: 'Aug',
                            score: 8.6,
                            co2: 1280
                        }
                    ]
                },
                certifications: [
                    {
                        name: 'ISO 14001',
                        status: 'active',
                        validUntil: '2026-03-15',
                        score: 92
                    },
                    {
                        name: 'Zero Waste to Landfill',
                        status: 'pending',
                        validUntil: null,
                        score: 89
                    },
                    {
                        name: 'Carbon Neutral',
                        status: 'in-progress',
                        validUntil: null,
                        score: 76
                    }
                ]
            }
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(sustainabilityData);
    } catch (error) {
        console.error('Sustainability API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch sustainability data'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3473a11a._.js.map