module.exports = [
"[project]/node_modules/node-fetch/src/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/node_modules_node-fetch_src_utils_multipart-parser_d0c3da3f.js",
  "server/chunks/node_modules_45dbfb15._.js",
  "server/chunks/[root-of-the-server]__87f6e720._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/node-fetch/src/index.js [app-route] (ecmascript)");
    });
});
}),
"[project]/src/ai/flows/generate-ingredients-list.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/ai/flows/generate-ingredients-list.ts [app-route] (ecmascript)");
    });
});
}),
];