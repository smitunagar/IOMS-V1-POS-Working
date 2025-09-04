module.exports = [
"[project]/.next-internal/server/app/api/uploadMenu/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/app/api/uploadMenu/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const runtime = 'nodejs';
async function POST(request) {
    try {
        console.log('==> /api/uploadMenu POST received');
        const body = await request.json();
        const { manualMenuData, file, userId, textData } = body;
        let menuItems = [];
        if (manualMenuData && Array.isArray(manualMenuData)) {
            menuItems = manualMenuData;
        } else if (textData) {
            // Simple text processing
            const lines = textData.split('\n').filter((line)=>line.trim().length > 0);
            menuItems = lines.map((line, idx)=>({
                    id: `text-${Date.now()}-${idx}`,
                    name: line.trim(),
                    price: '',
                    category: 'Extracted',
                    image: '',
                    ingredients: [
                        'water',
                        'salt'
                    ],
                    extractionMethod: 'text'
                }));
        }
        // Normalize menu items
        menuItems = menuItems.map((item, idx)=>({
                id: item.id || `menu-${Date.now()}-${idx}`,
                name: item.name || `Item ${idx + 1}`,
                price: item.price || '',
                category: item.category || 'Uncategorized',
                image: item.image || '',
                ingredients: Array.isArray(item.ingredients) ? item.ingredients : [
                    'water',
                    'salt'
                ],
                extractionMethod: item.extractionMethod || 'manual'
            }));
        // Export to CSV
        let csvExported = false;
        let csvPath = '';
        try {
            const exportsDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'exports');
            if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(exportsDir)) __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(exportsDir, {
                recursive: true
            });
            csvPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(exportsDir, `menu-export-${Date.now()}.csv`);
            let csvContent = 'ID,Name,Price,Category,Image,Ingredients,ExtractionMethod\n';
            menuItems.forEach((item)=>{
                const ingredients = Array.isArray(item.ingredients) ? item.ingredients.join(';') : '';
                const escapedName = String(item.name || '').replace(/"/g, '""');
                const escapedCategory = String(item.category || '').replace(/"/g, '""');
                csvContent += `"${item.id}","${escapedName}","${item.price}","${escapedCategory}","${item.image}","${ingredients}","${item.extractionMethod}"\n`;
            });
            __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(csvPath, csvContent, 'utf8');
            csvExported = true;
        } catch (csvErr) {
            console.log('CSV export failed:', csvErr);
        }
        const result = {
            success: true,
            count: menuItems.length,
            csvExported,
            csvPath,
            extractionAccuracy: menuItems.length > 0 ? 100 : 0,
            menu: menuItems
        };
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Upload Menu API error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7133f8fa._.js.map