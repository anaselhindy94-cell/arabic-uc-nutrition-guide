const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const OUTPUT_FILE = "uc-nutrition-guide-full.pdf";

async function main() {
  const rootDir = process.cwd();
  const htmlPath = path.join(rootDir, "index.html");
  const printCssPath = path.join(rootDir, "print-improved.css");
  const outputPath = path.join(rootDir, OUTPUT_FILE);

  if (!fs.existsSync(htmlPath)) {
    throw new Error("index.html not found");
  }

  console.log("⏳  تشغيل المتصفح...");

  const browser = await puppeteer.launch({
    headless: "new",
    protocolTimeout: 180000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(120000);
    page.setDefaultNavigationTimeout(120000);

    const fileUrl = "file://" + htmlPath;
    console.log("📄  تحميل: " + fileUrl);

    await page.goto(fileUrl, {
      waitUntil: "networkidle0",
      timeout: 120000
    });

    await page.emulateMediaType("print");

    if (fs.existsSync(printCssPath)) {
      await page.addStyleTag({ path: printCssPath });
      console.log("🎨  تم تطبيق CSS المحسّن للطباعة");
    }

    console.log("⏳  انتظار تحميل الخطوط والصور...");

    // Wait for fonts/images, but do not block PDF generation forever.
    await Promise.race([
      page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        const images = Array.from(document.images);
        await Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              const timer = setTimeout(resolve, 8000);
              img.onload = () => {
                clearTimeout(timer);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timer);
                resolve();
              };
            });
          })
        );
      }),
      new Promise((resolve) => setTimeout(resolve, 15000))
    ]);

    console.log("📑  توليد PDF...");

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: "14mm",
        right: "16mm",
        bottom: "16mm",
        left: "16mm"
      },
      headerTemplate: `
        <div style="width:100%;font-size:8px;color:#777;text-align:center;padding-top:4px;">
          الدليل التغذوي لمرضى التهاب القولون التقرحي في مصر
        </div>
      `,
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#777;text-align:center;padding-bottom:4px;white-space:nowrap;">
          صفحة <span class="pageNumber"></span> من <span class="totalPages"></span>
        </div>
      `
    });

    const stats = fs.statSync(outputPath);
    const sizeKb = Math.round(stats.size / 1024);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("✅  تم إنشاء PDF بنجاح:");
    console.log("   الملف: " + OUTPUT_FILE);
    console.log(`   الحجم: ${sizeMb} MB (${sizeKb.toLocaleString()} KB)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌  فشل توليد PDF:");
  console.error(err);
  process.exit(1);
});
