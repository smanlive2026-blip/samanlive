// LOCATION: server/routes/common/code-export.routes.js - V2 FINAL - FULL PROJECT SCAN FIX
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// FIX: 3 level up = PROJECT ROOT - pehle 2 level tha isliye sirf server/ scan ho raha tha
const PROJECT_ROOT = path.join(__dirname, '../../../');
const IGNORE_DIRS = ['node_modules', '.git', '.vercel'];
const IGNORE_FILES = [];

function walk(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!IGNORE_DIRS.includes(file)) {
            walk(fullPath, fileList);
          }
        } else {
          // NO SIZE LIMIT - NO EXT FILTER - SAB FILE INCLUDE
          if (!IGNORE_FILES.includes(file)) {
            fileList.push(fullPath);
          }
        }
      } catch(e) {}
    });
  } catch(e) {}
  return fileList;
}

// GET /api/common/code-export/files - list
router.get('/files', (req, res) => {
  try {
    const files = walk(PROJECT_ROOT);
    const relative = files.map(f => {
      try{
        const stat = fs.statSync(f);
        return {
          fullPath: f,
          relativePath: path.relative(PROJECT_ROOT, f).replace(/\\/g, '/'),
          size: stat.size,
          modified: stat.mtime
        };
      }catch(e){ return null; }
    }).filter(Boolean).sort((a,b)=> a.relativePath.localeCompare(b.relativePath));
    
    res.json({ success: true, total: relative.length, files: relative, root: PROJECT_ROOT });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/common/code-export/file-content?path=...
router.get('/file-content', (req, res) => {
  try {
    const relPath = req.query.path;
    if (!relPath || relPath.includes('..')) return res.status(400).json({ success: false, message: 'Invalid path' });
    const fullPath = path.join(PROJECT_ROOT, relPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ success: false, message: 'Not found' });
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ success: true, path: relPath, content: content });
  } catch(e) {
    // Binary file hogi to error ayega - usko bhi bhejo
    try{
      const fullPath = path.join(PROJECT_ROOT, req.query.path);
      const buf = fs.readFileSync(fullPath);
      res.json({ success: true, path: req.query.path, content: buf.toString('base64'), binary: true });
    }catch(e2){
      res.status(500).json({ success: false, message: e.message });
    }
  }
});

// GET /api/common/code-export/download-all - TXT
router.get('/download-all', (req, res) => {
  try {
    const files = walk(PROJECT_ROOT);
    let combined = `PROJECT CODE EXPORT - ${new Date().toISOString()}\nTotal Files: ${files.length}\nROOT: ${PROJECT_ROOT}\n========================================\n\n`;
    files.forEach(fullPath => {
      const rel = path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/');
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        combined += `\n\n// ================= LOCATION: ${rel} =================\n${content}\n// ================= END: ${rel} =================\n`;
      } catch(e) {
        combined += `\n\n// ================= LOCATION: ${rel} =================\n// BINARY FILE - ${e.message}\n// ================= END: ${rel} =================\n`;
      }
    });
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="full-project-code-${Date.now()}.txt"`);
    res.send(combined);
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;