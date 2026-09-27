/**
 * export-single-file.mjs
 *
 * Turns the Vite build (dist/) into ONE self-contained HTML file:
 *   - stylesheet inlined as <style>
 *   - JS bundle inlined as <script type="module">
 *   - favicon.svg + resume PDF inlined as data: URIs
 * Only Google Fonts stays external (graceful fallbacks when offline).
 *
 * Usage: npm run export   (builds first, then writes export/*.html)
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

let html = readFileSync(resolve(dist, "index.html"), "utf8");

// 1. Stylesheet → <style>
html = html.replace(
	/<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+\.css)">/g,
	(_, file) => `<style>\n${readFileSync(resolve(dist, "assets", file), "utf8")}\n</style>`,
);

// 2. Module preload (pointless once inlined) → drop
html = html.replace(/<link rel="modulepreload" crossorigin href="[^"]+">\n?/g, "");

// 3. JS bundle → inline module
html = html.replace(
	/<script type="module" crossorigin src="\.\/assets\/([^"]+\.js)"><\/script>/g,
	(_, file) => `<script type="module">\n${readFileSync(resolve(dist, "assets", file), "utf8")}\n</script>`,
);

// 4. Favicon → data URI
const favicon = readFileSync(resolve(dist, "favicon.svg"), "utf8");
html = html.replace(
	'href="./favicon.svg" type="image/svg+xml"',
	`href="data:image/svg+xml,${encodeURIComponent(favicon)}" type="image/svg+xml"`,
);

// 5. Resume PDF → data URI so the download button works offline
const pdf = readFileSync(resolve(dist, "resume", "ManishChaliseResume.pdf"));
const pdfUri = `data:application/pdf;base64,${pdf.toString("base64")}`;
const before = html;
html = html.replace("./resume/ManishChaliseResume.pdf", pdfUri);
if (html === before) {
	console.warn("! resume link not found — check the href in index.html");
}

// Sanity: no leftover references to dist assets
const leftovers = html.match(/(src|href)="\.\/assets\//g);
if (leftovers) {
	console.error(`! ${leftovers.length} asset reference(s) not inlined`);
	process.exit(1);
}

mkdirSync(resolve(root, "export"), { recursive: true });
const out = resolve(root, "export", "Manish-Chalise-Island.html");
writeFileSync(out, html);
console.log(`✓ ${out} — ${kb(statSync(out).size)}`);
