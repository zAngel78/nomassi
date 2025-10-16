const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS for the React frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));

// Path to the research documentation (now inside backend)
const RESEARCH_DIR = path.join(__dirname, 'public', 'files');

// Log startup info
console.log('Research Directory:', RESEARCH_DIR);
console.log('Directory exists:', fs.existsSync(RESEARCH_DIR));

// Endpoint to serve files
app.get('/api/files/*', (req, res) => {
  try {
    // Get the file path from the URL (everything after /api/files/)
    const requestedPath = req.params[0];
    const filePath = path.join(RESEARCH_DIR, requestedPath);

    console.log('Requested file:', requestedPath);
    console.log('Full path:', filePath);

    // Security check: make sure the file is within the research directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(RESEARCH_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.csv': 'text/csv',
      '.tex': 'text/plain',
      '.txt': 'text/plain'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Set headers for inline display (not download)
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('Serving file:', filePath, 'Type:', contentType);

  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Endpoint to download files (forces download instead of inline display)
app.get('/api/download/*', (req, res) => {
  try {
    const requestedPath = req.params[0];
    const filePath = path.join(RESEARCH_DIR, requestedPath);

    // Security check
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(RESEARCH_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Force download
    res.download(filePath);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all files in the research directory (for debugging)
app.get('/api/debug/structure', (req, res) => {
  try {
    const structure = {};

    const folders = fs.readdirSync(RESEARCH_DIR);
    folders.forEach(folder => {
      const folderPath = path.join(RESEARCH_DIR, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        structure[folder] = files;
      }
    });

    res.json(structure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    researchDirExists: fs.existsSync(RESEARCH_DIR),
    researchDir: RESEARCH_DIR
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 YU Research Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${RESEARCH_DIR}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  - GET /api/files/* - Serve files for preview`);
  console.log(`  - GET /api/download/* - Download files`);
  console.log(`  - GET /api/health - Health check`);
  console.log(`  - GET /api/debug/structure - View file structure\n`);
});
