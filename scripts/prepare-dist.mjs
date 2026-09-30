import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const outputPublicDir = path.join(rootDir, ".output", "public");
const distDir = path.join(rootDir, "dist");

// 1. Clean dist and recreate
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Recursively copy .output/public to dist
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(outputPublicDir)) {
  copyRecursive(outputPublicDir, distDir);
  console.log("Successfully copied .output/public to dist/");
}

// 3. Find current build CSS and main JS assets from .output/public/assets
const assetsDir = path.join(outputPublicDir, "assets");
let indexJs = "";
const cssFiles = [];

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  for (const file of files) {
    if (file.startsWith("index-") && file.endsWith(".js")) {
      indexJs = `/assets/${file}`;
    } else if (file.endsWith(".css")) {
      cssFiles.push(`/assets/${file}`);
    }
  }
}

if (!indexJs) {
  indexJs = "/src/start.ts";
}

const cssTags = cssFiles.map((href) => `    <link rel="stylesheet" href="${href}" />`).join("\n");

// 4. Generate clean, valid index.html synced with metadata.json
const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rootify Your Travels</title>
    <meta name="description" content="A smart, accessible travel planner providing live weather, tailored day-by-day itineraries, hotels, and budget tracking." />
    <meta property="og:title" content="Rootify Your Travels" />
    <meta property="og:description" content="A smart, accessible travel planner providing live weather, tailored day-by-day itineraries, hotels, and budget tracking." />
    <meta name="author" content="Rootify" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" />
${cssTags}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${indexJs}"></script>
  </body>
</html>
`;

// Write to dist/index.html, public/index.html, and root index.html
fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf-8");
fs.writeFileSync(path.join(rootDir, "public", "index.html"), htmlContent, "utf-8");
fs.writeFileSync(path.join(rootDir, "index.html"), htmlContent, "utf-8");

console.log("Successfully prepared dist/ with index.html and all valid production assets.");
