const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS for the React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://nolo-alpha.vercel.app', '*'], // Allow localhost, Vercel, and any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Path to the research documentation (now inside backend)
const RESEARCH_DIR = path.join(__dirname, 'public', 'files');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Log startup info
console.log('Research Directory:', RESEARCH_DIR);
console.log('Directory exists:', fs.existsSync(RESEARCH_DIR));

// Endpoint to serve files
app.get('/api/files/*', (req, res) => {
  try {
    // Get the file path from the URL (everything after /api/files/)
    const requestedPath = req.params[0];
    
    // Try public/files first, then public/ for instagram_data and facebook_data
    let filePath = path.join(RESEARCH_DIR, requestedPath);
    let baseDir = RESEARCH_DIR;
    
    // If file not found in public/files and path starts with social media data, try public/
    if (!fs.existsSync(filePath) && (requestedPath.startsWith('instagram_data') || requestedPath.startsWith('facebook_data') || requestedPath.startsWith('twitter_data') || requestedPath.startsWith('youtube_data') || requestedPath.startsWith('meta_ads_data'))) {
      filePath = path.join(PUBLIC_DIR, requestedPath);
      baseDir = PUBLIC_DIR;
    }

    console.log('Requested file:', requestedPath);
    console.log('Full path:', filePath);

    // Security check: make sure the file is within allowed directories
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(RESEARCH_DIR) && !normalizedPath.startsWith(PUBLIC_DIR)) {
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
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.csv': 'text/csv',
      '.tex': 'text/plain',
      '.txt': 'text/plain',
      '.md': 'text/markdown'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

// Instagram data endpoints
app.get('/api/instagram/:username', (req, res) => {
  try {
    const username = req.params.username;
    const dataPath = path.join(__dirname, 'public', 'instagram_data', `${username}_posts.json`);
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Data not found', 
        message: `No data found for @${username}. Run 'npm run scrape:instagram' first.` 
      });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Facebook data endpoints
app.get('/api/facebook/:pagename', (req, res) => {
  try {
    const pagename = req.params.pagename.toLowerCase();
    const dataPath = path.join(__dirname, 'public', 'facebook_data', `${pagename}_posts.json`);
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Data not found', 
        message: `No data found for ${pagename}. Run 'npm run scrape:facebook' first.` 
      });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Twitter data endpoints
app.get('/api/twitter/:username', (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const dataPath = path.join(__dirname, 'public', 'twitter_data', `${username}_tweets.json`);
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Data not found', 
        message: `No data found for @${username}. Run 'npm run scrape:twitter' first.` 
      });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// YouTube data endpoints
app.get('/api/youtube/:channel', (req, res) => {
  try {
    const channel = req.params.channel.toLowerCase();
    const dataPath = path.join(__dirname, 'public', 'youtube_data', `${channel}_videos.json`);
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Data not found', 
        message: `No data found for ${channel}. Run 'npm run scrape:youtube' first.` 
      });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meta Ads data endpoints
app.get('/api/meta-ads/:university', (req, res) => {
  try {
    const university = req.params.university.toLowerCase();
    const dataPath = path.join(__dirname, 'public', 'meta_ads_data', `${university}_ads.json`);
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Data not found', 
        message: `No data found for ${university}. Run 'npm run scrape:meta-ads' first.` 
      });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/instagram', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'public', 'instagram_data', 'all_universities.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Data not found', 
        message: 'Run "npm run scrape:all" first to scrape all universities.' 
      });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
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
