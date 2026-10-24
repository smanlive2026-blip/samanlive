// LOCATION: server/routes/common/code-export.routes.js - FULL PROJECT CODE EXPORT API V1
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../../');
const IGNORE_DIRS = ['node_modules', '.git', '___vc', '.next', 'dist', 'build', '.vscode', 'uploads', 'coverage', 'tmp'];
const IGNORE_FILES = ['.env', 'package-lock.json', 'yarn.lock', '.DS_Store'];
const ALLOWED_EXT = ['.js', '.html', '.css', '.json', '.jsx', '.ts', '.tsx', '.md'];

function walk(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!IGNORE_DIRS.includes(file) && !file.startsWith('.')) {
            walk(fullPath, fileList);
          }
        } else {
          const ext = path.extname(file);
          if (ALLOWED_EXT.includes(ext) && !IGNORE_FILES.includes(file) && stat.size < 500 * 1024) {
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
      const stat = fs.statSync(f);
      return {
        fullPath: f,
        relativePath: path.relative(PROJECT_ROOT, f).replace(/\\/g, '/'),
        size: stat.size,
        modified: stat.mtime
      };
    }).sort((a,b)=> a.relativePath.localeCompare(b.relativePath));
    
    res.json({ success: true, total: relative.length, files: relative });
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
    res.json({ success: true, path: relPath, content: content.slice(0, 100000) });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/common/code-export/download-all - TXT
router.get('/download-all', (req, res) => {
  try {
    const files = walk(PROJECT_ROOT);
    let combined = `PROJECT CODE EXPORT - ${new Date().toISOString()}\nTotal Files: ${files.length}\n========================================\n\n`;
    files.forEach(fullPath => {
      const rel = path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/');
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        combined += `\n\n// ================= LOCATION: ${rel} =================\n// FILE: ${rel}\n${content}\n// ================= END: ${rel} =================\n`;
      } catch(e) {}
    });
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="full-project-code-${Date.now()}.txt"`);
    res.send(combined);
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;