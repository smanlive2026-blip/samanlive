const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static('public'));
app.use('/qr_output', express.static('qr_output'));

// Logo upload ke liye
const upload = multer({ dest: 'public/logos/' });
let CURRENT_LOGO = 'public/logos/default.png';

// Default logo banao agar nahi hai
if (!fs.existsSync('public/logos')) fs.mkdirSync('public/logos', { recursive: true });
if (!fs.existsSync(CURRENT_LOGO)) {
    // 1x1 transparent png
    fs.writeFileSync(CURRENT_LOGO, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
}

// 1. QR Generate API - UPDATED: Ab direct PDF naam aur link bhejega
app.post('/api/generate', (req, res) => {
    const { manager_id, product_name, batch, mfg_date, quantity, qr_size_mm, area_manager_name, area_manager_id } = req.body;
    const cmd = `node generate-qr-batch.js "${manager_id}" "${product_name}" "${batch}" "${mfg_date}" ${quantity} ${qr_size_mm} "${CURRENT_LOGO}"`;

    console.log('Running:', cmd);
    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr });

        // Output folder nikalo
        const match = stdout.match(/Folder: (.*)/);
        const outputDir = match ? match[1].trim() : null;
        
        if (!outputDir) return res.status(500).json({ success: false, error: 'Folder not found in output' });

        // PDF ka naam banao - Area Manager + ID + Size ke hisab se
        const safeName = area_manager_name.replace(/[^a-zA-Z0-9]/g, '_');
        const pdf1Name = `${safeName}_${area_manager_id}_${qr_size_mm}mm_ID_LAYER.pdf`;
        const pdf2Name = `${safeName}_${area_manager_id}_${qr_size_mm}mm_QR_LAYER.pdf`;

        // Purane PDF ka naam badal do
        const oldPdf1 = path.join(outputDir, '1_ID_LAYER.pdf');
        const oldPdf2 = path.join(outputDir, '2_QR_LAYER.pdf');
        const newPdf1 = path.join(outputDir, pdf1Name);
        const newPdf2 = path.join(outputDir, pdf2Name);

        // Make-pdf.js chalane ke baad rename karna hai, to abhi bas folder bhej dete hain
        // Aur make-pdf ke baad rename karenge
        res.json({ 
            success: true, 
            log: stdout, 
            outputDir,
            tempPdf1: '1_ID_LAYER.pdf',
            tempPdf2: '2_QR_LAYER.pdf',
            finalPdf1Name: pdf1Name,
            finalPdf2Name: pdf2Name
        });
    });
});

// 2. PDF Generate API - UPDATED: PDF banane ke baad naam badal dega aur link bhejega
app.post('/api/make-pdf', (req, res) => {
    const { folderPath, finalPdf1Name, finalPdf2Name } = req.body;
    const cmd = `node make-pdf.js "${folderPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr });

        // PDF ban gaya, ab naam badal do
        const oldPdf1 = path.join(folderPath, '1_ID_LAYER.pdf');
        const oldPdf2 = path.join(folderPath, '2_QR_LAYER.pdf');
        const newPdf1 = path.join(folderPath, finalPdf1Name);
        const newPdf2 = path.join(folderPath, finalPdf2Name);

        try {
            if (fs.existsSync(oldPdf1)) fs.renameSync(oldPdf1, newPdf1);
            if (fs.existsSync(oldPdf2)) fs.renameSync(oldPdf2, newPdf2);

            // Final download link banao
            const relativePath = folderPath.replace(/\\/g, '/').replace('qr_output/', '');
            const url1 = `/qr_output/${relativePath}/${finalPdf1Name}`;
            const url2 = `/qr_output/${relativePath}/${finalPdf2Name}`;

            res.json({ 
                success: true, 
                log: stdout,
                url1: url1,
                name1: finalPdf1Name,
                url2: url2,
                name2: finalPdf2Name
            });
        } catch (e) {
            res.status(500).json({ success: false, error: 'Rename failed: ' + e.message });
        }
    });
});

// 3. Logo Upload API
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
    CURRENT_LOGO = req.file.path.replace(/\\/g, '/');
    res.json({ success: true, logoPath: CURRENT_LOGO });
});

// 4. Sare Batch List Karo
app.get('/api/batches', (req, res) => {
    const dir = './qr_output';
    if (!fs.existsSync(dir)) return res.json([]);

    const batches = fs.readdirSync(dir).map(folder => {
        const folderPath = path.join(dir, folder);
        const infoPath = path.join(folderPath, 'batch_info.json');
        const pdf1 = path.join(folderPath, '1_ID_LAYER.pdf');
        const pdf2 = path.join(folderPath, '2_QR_LAYER.pdf');

        return {
            name: folder,
            path: folderPath,
            info: fs.existsSync(infoPath) ? JSON.parse(fs.readFileSync(infoPath)) : null,
            pdf1: fs.existsSync(pdf1) ? pdf1 : null,
            pdf2: fs.existsSync(pdf2) ? pdf2 : null
        };
    });
    res.json(batches);
});

app.listen(PORT, () => {
    console.log(`✅ Admin Panel: http://localhost:${PORT}/admin.html`);
});