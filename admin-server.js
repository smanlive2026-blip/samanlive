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

// 1. QR Generate API
app.post('/api/generate', (req, res) => {
    const { manager_id, product_name, batch, mfg_date, quantity, qr_size_mm } = req.body;
    const cmd = `node generate-qr-batch.js "${manager_id}" "${product_name}" "${batch}" "${mfg_date}" ${quantity} ${qr_size_mm} "${CURRENT_LOGO}"`;

    console.log('Running:', cmd);
    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr });

        // Output folder nikalo
        const match = stdout.match(/Folder: (.*)/);
        const outputDir = match? match[1].trim() : null;
        res.json({ success: true, log: stdout, outputDir });
    });
});

// 2. PDF Generate API - 2 PDF banayega
app.post('/api/make-pdf', (req, res) => {
    const { folderPath } = req.body;
    const cmd = `node make-pdf.js "${folderPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr });
        res.json({ success: true, log: stdout });
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
            info: fs.existsSync(infoPath)? JSON.parse(fs.readFileSync(infoPath)) : null,
            pdf1: fs.existsSync(pdf1)? pdf1 : null,
            pdf2: fs.existsSync(pdf2)? pdf2 : null
        };
    });
    res.json(batches);
});

app.listen(PORT, () => {
    console.log(`✅ Admin Panel: http://localhost:${PORT}/admin.html`);
});