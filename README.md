# الدليل التغذوي لمرضى التهاب القولون التقرحي في مصر

هذا المجلد جاهز للرفع مباشرة إلى GitHub Pages.

## ملفات الموقع المهمة

- `index.html` — صفحة الموقع الرئيسية.
- `assets/` — صور البوسترات المستخدمة داخل الموقع.
- `print-improved.css` — تنسيق خاص بالطباعة وتصدير PDF.
- `generate-pdf.js` — سكريبت Puppeteer لتوليد PDF احترافي.
- `package.json` — أوامر توليد PDF محلياً.
- `.nojekyll` — لضمان نشر الملفات كما هي على GitHub Pages.

## النشر على GitHub Pages

1. أنشئ Repository جديد على GitHub.
2. ارفع محتويات هذا المجلد كما هي، وليس ملف ZIP نفسه.
3. تأكد أن `index.html` موجود في جذر المستودع.
4. من Settings > Pages:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
5. اضغط Save وانتظر حتى يظهر رابط GitHub Pages.

## توليد PDF محلياً

تحتاج Node.js مثبتاً على جهازك.

```bash
npm install
npm run pdf
```

لنسخة أخف بدون الصور الكبيرة:

```bash
npm run pdf:light
```

سيتم إنشاء ملف PDF باسم:

`دليل_القولون_التقرحي.pdf`

## ملاحظات

- الموقع Static ولا يحتاج Backend.
- GitHub Pages سيعرض الموقع فقط، ولن يشغّل سكريبت Puppeteer تلقائياً.
- لتحديث PDF، شغّل السكريبت محلياً ثم ارفع ملف PDF الناتج إذا أردت توفير رابط تحميل مباشر.
