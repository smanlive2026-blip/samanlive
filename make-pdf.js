const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const [,, folderPath] = process.argv;
if (!folderPath) process.exit(1);

const batchInfo = JSON.parse(fs.readFileSync(path.join(folderPath, 'batch_info.json'), 'utf8'));
const qrSizeMM = batchInfo.qr_size_mm;
const gapMM = 5;
const qrWithGap = qrSizeMM + gapMM;
const cols = Math.floor(190 / qrWithGap);
const rows = Math.floor(277 / (qrWithGap + 8)); // 8mm extra for ID + Scratch
const perPage = cols * rows;

const MM_TO_PT = 2.83465;
const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'));

// PDF 1: Sirf ID Layer
function makeIdPdf() {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    doc.pipe(fs.createWriteStream(path.join(folderPath, '1_ID_LAYER.pdf')));

    let x = 10 * MM_TO_PT, y = 10 * MM_TO_PT, count = 0;

    files.forEach((file, i) => {
        if (count === perPage) {
            doc.addPage();
            x = 10 * MM_TO_PT; y = 10 * MM_TO_PT; count = 0;
        }
        const qrId = file.replace('.png', '');
        doc.fontSize(8).font('Helvetica-Bold').text(qrId, x, y, { width: qrSizeMM * MM_TO_PT, align: 'center' });

        x += qrWithGap * MM_TO_PT;
        if (x + qrSizeMM * MM_TO_PT > 200 * MM_TO_PT) {
            x = 10 * MM_TO_PT; y += (qrSizeMM + gapMM + 8) * MM_TO_PT;
        }
        count++;
    });
    doc.end();
}

// PDF 2: QR + Logo + Scratch Box Layer
function makeQrPdf() {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    doc.pipe(fs.createWriteStream(path.join(folderPath, '2_QR_LAYER.pdf')));

    let x = 10 * MM_TO_PT, y = 10 * MM_TO_PT, count = 0;

    files.forEach((file, i) => {
        if (count === perPage) {
            doc.addPage();
            x = 10 * MM_TO_PT; y = 10 * MM_TO_PT; count = 0;
        }

        // QR Image with Logo
        doc.image(path.join(folderPath, file), x, y + 8 * MM_TO_PT, { width: qrSizeMM * MM_TO_PT });

        // Scratch Box - Machine iske upar scratch lagayegi
        doc.rect(x, y + (8 + qrSizeMM) * MM_TO_PT, qrSizeMM * MM_TO_PT, 5 * MM_TO_PT).stroke();
        doc.fontSize(5).text('SCRATCH HERE', x, y + (9 + qrSizeMM) * MM_TO_PT, { width: qrSizeMM * MM_TO_PT, align: 'center' });

        x += qrWithGap * MM_TO_PT;
        if (x + qrSizeMM * MM_TO_PT > 200 * MM_TO_PT) {
            x = 10 * MM_TO_PT; y += (qrSizeMM + gapMM + 8) * MM_TO_PT;
        }
        count++;
    });
    doc.end();
}

makeIdPdf();
makeQrPdf();
console.log(`PDF DONE: 1_ID_LAYER.pdf & 2_QR_LAYER.pdf created in ${folderPath}`);