const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SECRET_KEY = "SAMANLIVE_SUPER_SECRET_2026@#$%";

// Command: node generate-qr-batch.js "MGR_78" "Parle-G 5Rs" "OCT_2026_JPR" "01/2026" 1000 20 "logo.png"
const [,, manager_id, product_name, batch, mfg_date, quantity, qr_size_mm, logo_path] = process.argv;

if (!quantity) {
    console.log("Error: Saare parameter do");
    console.log('Example: node generate-qr-batch.js "MGR_78" "Parle-G 5Rs" "OCT_2026_JPR" "01/2026" 1000 20 "logo.png"');
    console.log('qr_size_mm: QR ka size mm me. Chote packet=15, Bade=25');
    process.exit(1);
}

const BATCH_DATA = {
    manager_id,
    product_name,
    batch,
    mfg_date,
    quantity: parseInt(quantity),
    qr_size_mm: parseInt(qr_size_mm) || 20, // Default 20mm
    logo_path: logo_path || null
};

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = path.join(__dirname, 'qr_output', `${batch}_${timestamp}`);
fs.mkdirSync(outputDir, { recursive: true });

let STOP_FLAG = false;
process.on('SIGINT', () => {
    console.log('\n\n⚠️ STOP SIGNAL MILA... Rok raha hu...');
    STOP_FLAG = true;
});

// Logo ke saath QR banao
async function generateQRWithLogo(data) {
    const qr_id = `QR_${uuidv4().split('-')[0].toUpperCase()}`;
    const product_id = `PRD_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const scratch_id = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const qrPayload = {
        qid: qr_id, pid: product_id, mid: data.manager_id,
        batch: data.batch, pname: data.product_name,
        mfg: data.mfg_date, sid: scratch_id, ts: Date.now()
    };
    
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(qrPayload), SECRET_KEY).toString();
    const finalQRData = `SMLV1:${encryptedData}`;
    
    // QR size pixels me: 1mm = ~3.78px at 96dpi. 20mm = 300px approx
    const qrSizePx = Math.round(data.qr_size_mm * 11.8); // 300dpi ke liye
    
    // 1. Pehle basic QR banao
    const qrBuffer = await QRCode.toBuffer(finalQRData, {
        errorCorrectionLevel: 'H', // High - logo ke liye jaruri
        width: qrSizePx,
        margin: 1
    });
    
    let finalImageBuffer = qrBuffer;
    
    // 2. Agar logo hai to beech me lagao
    if (data.logo_path && fs.existsSync(data.logo_path)) {
        const logoSize = Math.round(qrSizePx * 0.25); // QR ka 25% size
        const logoBuffer = await sharp(data.logo_path)
            .resize(logoSize, logoSize)
            .png()
            .toBuffer();
            
        finalImageBuffer = await sharp(qrBuffer)
            .composite([{
                input: logoBuffer,
                gravity: 'center'
            }])
            .png()
            .toBuffer();
    }
    
    return { 
        qr_id, 
        product_id, 
        scratch_id, 
        qr_image: finalImageBuffer,
        size_mm: data.qr_size_mm
    };
}

async function runBatch() {
    console.log(`Starting: ${BATCH_DATA.quantity} QR | Size: ${BATCH_DATA.qr_size_mm}mm | Product: ${BATCH_DATA.product_name}`);
    console.log(`Logo: ${BATCH_DATA.logo_path || 'Nahi'}`);
    console.log(`\n🛑 Rokne ke liye: Ctrl + C\n`);
    
    const csvRows = ['QR_ID,SCRATCH_ID,PRODUCT_ID,BATCH,MFG_DATE,QR_SIZE_MM']; 
    let generated = 0;
    
    for(let i = 1; i <= BATCH_DATA.quantity; i++) {
        if (STOP_FLAG) {
            console.log(`\n\n🛑 ROK DIYA GAYA at ${i-1}/${BATCH_DATA.quantity}`);
            break;
        }
        
        const result = await generateQRWithLogo(BATCH_DATA);
        
        fs.writeFileSync(path.join(outputDir, `${result.qr_id}.png`), result.qr_image);
        csvRows.push(`${result.qr_id},${result.scratch_id},${result.product_id},${BATCH_DATA.batch},${BATCH_DATA.mfg_date},${result.size_mm}`);
        generated++;
        
        if (i % 50 === 0 || i === BATCH_DATA.quantity) {
            console.log(`${i}/${BATCH_DATA.quantity} - ${result.qr_id} - ${result.size_mm}mm`);
        }
    }
    
    fs.writeFileSync(path.join(outputDir, 'scratch_list.csv'), csvRows.join('\n'));
    fs.writeFileSync(path.join(outputDir, 'batch_info.json'), JSON.stringify(BATCH_DATA, null, 2));
    
    console.log(`\n✅ DONE! Total: ${generated}/${BATCH_DATA.quantity}`);
    console.log(`📁 Folder: ${outputDir}`);
    console.log(`\nAgla Step: node make-pdf.js "${outputDir}"`);
}

runBatch();