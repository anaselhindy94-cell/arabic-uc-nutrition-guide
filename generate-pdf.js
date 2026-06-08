/**
 * generate-pdf.js
 * ──────────────────────────────────────────────────────────────
 * Generates a print-ready A4 PDF from the Arabic UC guide.
 *
 * SETUP (one-time):
 *   npm install puppeteer
 *
 * USAGE:
 *   node generate-pdf.js
 *   node generate-pdf.js --no-images   ← lightweight PDF, skips all posters
 *   node generate-pdf.js --section 5   ← debug: open specific anchor
 *
 * OUTPUT: دليل_القولون_التقرحي.pdf  (same folder as this script)
 *
 * REQUIREMENTS:
 *   - Node.js 18+
 *   - puppeteer  (npm i puppeteer — downloads Chromium automatically)
 *   - index.html + assets/ folder in the same directory as this script
 * ──────────────────────────────────────────────────────────────
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

/* ── CONFIG ─────────────────────────────────────────────────── */
const CONFIG = {
  htmlFile: path.resolve(__dirname, "index.html"),
  printCssFile: path.resolve(__dirname, "print-improved.css"),
  outputPdf: path.resolve(__dirname, "دليل_القولون_التقرحي.pdf"),
  noImages: process.argv.includes("--no-images"),
  paperFormat: "A4",
  printBackground: true,
  margins: { top: "2.2cm", bottom: "2.8cm", left: "2.5cm", right: "2.5cm" },
  waitAfterLoad: 2500, // ms — lets fonts + images finish loading

  headerHtml: `
    <div style="
      width: 100%;
      padding: 0 2.5cm;
      font-size: 8.5pt;
      color: #2F6F8F;
      text-align: right;
      direction: rtl;
      font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
      border-bottom: 0.5pt solid #ccc;
      padding-bottom: 4pt;
      box-sizing: border-box;
    ">
      الدليل التغذوي لمرضى التهاب القولون التقرحي في مصر
    </div>
  `,

  footerHtml: `
    <div style="
      width: 100%;
      padding: 0 2.5cm;
      font-size: 8.5pt;
      color: #666;
      text-align: center;
      direction: rtl;
      font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
      border-top: 0.5pt solid #ddd;
      padding-top: 4pt;
      box-sizing: border-box;
    ">
      نسخة تثقيفية — لا تغني عن الاستشارة الطبية
      &nbsp;|&nbsp;
      صفحة <span class="pageNumber"></span> من <span class="totalPages"></span>
    </div>
  `,
};

/* ── MAIN ───────────────────────────────────────────────────── */
(async () => {
  if (!fs.existsSync(CONFIG.htmlFile)) {
    console.error(`❌  لم يُعثر على index.html في: ${CONFIG.htmlFile}`);
    process.exit(1);
  }

  console.log("⏳  تشغيل المتصفح...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",         // allow local file:// cross-origin assets
      "--allow-file-access-from-files",
    ],
  });

  const page = await browser.newPage();

  /* Set viewport similar to A4 width at 96dpi */
  await page.setViewport({ width: 794, height: 1123 });

  /* Load local HTML */
  const fileUrl = `file://${CONFIG.htmlFile}`;
  console.log(`📄  تحميل: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 60_000 });

  /* Inject improved print CSS */
  if (fs.existsSync(CONFIG.printCssFile)) {
    const printCss = fs.readFileSync(CONFIG.printCssFile, "utf8");
    await page.addStyleTag({ content: printCss });
    console.log("🎨  تم تطبيق CSS المحسّن للطباعة");
  }

  /* Optional: hide all poster images for a lightweight PDF */
  if (CONFIG.noImages) {
    await page.addStyleTag({
      content: `
        @media print {
          .poster-visual, .visual-block img, .hero-visual { display: none !important; }
          .visual-caption { display: none !important; }
        }
      `,
    });
    console.log("🖼️  تم إيقاف الصور (وضع خفيف)");
  }

  /* Wait for fonts + any lazy-loaded resources */
  await page.waitForFunction(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, CONFIG.waitAfterLoad));
  console.log("⏳  انتظار تحميل الخطوط والصور...");

  /* Generate PDF */
  console.log("📑  توليد PDF...");
  await page.pdf({
    path: CONFIG.outputPdf,
    format: CONFIG.paperFormat,
    printBackground: CONFIG.printBackground,
    displayHeaderFooter: true,
    headerTemplate: CONFIG.headerHtml,
    footerTemplate: CONFIG.footerHtml,
    margin: CONFIG.margins,
    preferCSSPageSize: false,
    tagged: true,          // enable tagged PDF for accessibility
  });

  await browser.close();

  const sizeKb = Math.round(fs.statSync(CONFIG.outputPdf).size / 1024);
  const sizeMb = (sizeKb / 1024).toFixed(1);
  console.log(`\n✅  PDF جاهز: ${CONFIG.outputPdf}`);
  console.log(`   الحجم: ${sizeMb} MB (${sizeKb.toLocaleString()} KB)`);
  if (sizeKb > 30_000) {
    console.warn(
      "⚠️  الحجم كبير — جرّب: node generate-pdf.js --no-images"
    );
  }
})();
