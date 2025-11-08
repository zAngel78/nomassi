const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { ApifyClient } = require('apify-client');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors({
  origin: '*', // Allow any origin
  credentials: false, // Must be false when origin is '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add JSON body parser
app.use(express.json());

// Path to the research documentation (now inside backend)
const RESEARCH_DIR = path.join(__dirname, 'public', 'files');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DASHBOARD_DIR = path.join(__dirname, '..', 'dashboard_proposal');

// Serve dashboard static files
app.use(express.static(DASHBOARD_DIR));

// Log startup info
console.log('Research Directory:', RESEARCH_DIR);
console.log('Directory exists:', fs.existsSync(RESEARCH_DIR));

// Endpoint to list all files
app.get('/api/files', (req, res) => {
  try {
    const files = [];

    // Function to recursively scan directory
    function scanDirectory(dir, baseDir = '') {
      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const relativePath = path.join(baseDir, item);

        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(fullPath, relativePath);
        } else if (stats.isFile()) {
          const ext = path.extname(item).toLowerCase();
          // Include PDFs, TeX, documents, and images
          const allowedExtensions = ['.pdf', '.tex', '.md', '.txt', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];

          if (allowedExtensions.includes(ext)) {
            // Determine file type
            let fileType = 'Document';
            if (ext === '.pdf') fileType = 'PDF';
            else if (ext === '.tex') fileType = 'LaTeX';
            else if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext)) fileType = 'Image';
            else if (ext === '.md') fileType = 'Markdown';

            files.push({
              name: item,
              path: relativePath,
              size: stats.size,
              date: stats.mtime.toISOString().split('T')[0],
              type: fileType,
              extension: ext,
              category: categorizeFile(relativePath, fileType)
            });
          }
        }
      });
    }

    // Categorize files based on their path and type
    function categorizeFile(filePath, fileType) {
      const lower = filePath.toLowerCase();

      // If it's an image/chart, check for specific folders
      if (fileType === 'Image') {
        if (lower.includes('chart') || lower.includes('graph') || lower.includes('metric') || lower.includes('visual')) return 'analytics';
        if (lower.includes('social')) return 'social';
        if (lower.includes('email')) return 'email';
        if (lower.includes('ads')) return 'ads';
        if (lower.includes('image') || lower.includes('asset')) return 'reports';
      }

      // Regular categorization for documents
      if (lower.includes('social_media') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('twitter')) return 'social';
      if (lower.includes('email')) return 'email';
      if (lower.includes('ads') || lower.includes('digital_ads')) return 'ads';
      if (lower.includes('competitive') || lower.includes('universities')) return 'universities';
      if (lower.includes('analytics') || lower.includes('metrics') || lower.includes('data')) return 'analytics';
      if (lower.includes('report') || lower.includes('summary')) return 'reports';

      return 'analytics'; // Default category
    }

    scanDirectory(RESEARCH_DIR);

    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

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

// Influencer Audience Scraping Endpoint
app.post('/api/scrape-influencer', async (req, res) => {
  try {
    const { username, platform } = req.body;

    if (!username || !platform) {
      return res.status(400).json({ error: 'Username and platform are required' });
    }

    // Initialize Apify client (using free tier - $5/month credit)
    const apifyToken = process.env.APIFY_TOKEN || 'apify_api_LnTzQHqz6zthGn3iTcDMp0CEoX3pRn21ZSH2';
    const client = new ApifyClient({ token: apifyToken });

    console.log(`Scraping ${platform} influencer: @${username}`);

    let actorId, input;

    if (platform === 'instagram') {
      // Instagram Scraper - Get profile details and recent posts with commenters
      // This is faster and more reliable than scraping all followers
      actorId = 'apify/instagram-scraper';
      input = {
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsType: 'posts',
        resultsLimit: 50, // Get last 50 posts
        searchLimit: 1,
        addParentData: false
      };
    } else if (platform === 'tiktok') {
      // TikTok Follower Scraper
      actorId = 'clockworks/tiktok-profile-scraper';
      input = {
        profiles: [username],
        maxProfilesPerQuery: 1000
      };
    } else {
      return res.status(400).json({ error: 'Invalid platform. Use "instagram" or "tiktok"' });
    }

    // Run the Apify actor
    console.log('Starting Apify actor...');
    console.log('Input:', JSON.stringify(input, null, 2));
    const run = await client.actor(actorId).call(input, {
      waitSecs: 300 // Wait max 5 minutes
    });

    console.log('Actor run status:', run.status);
    console.log('Actor run ID:', run.id);

    // Get results from dataset
    console.log('Fetching results...');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Total items received: ${items.length}`);

    // Extract emails from bios/captions using regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

    // For Instagram posts, extract users who engage (owner info from posts)
    const followers = [];

    if (platform === 'instagram') {
      // Get profile owner info and extract emails from captions
      items.forEach(post => {
        const caption = post.caption || '';
        const emails = caption.match(emailRegex);

        if (emails && post.ownerUsername) {
          followers.push({
            username: post.ownerUsername,
            full_name: post.ownerFullName || '',
            email: emails[0],
            follower_count: 0,
            biography: caption.substring(0, 200),
            profile_pic_url: '',
            profile_url: `https://www.instagram.com/${post.ownerUsername}`,
            is_verified: false,
            external_url: null
          });
        }
      });
    } else {
      // For TikTok, process normally
      items.forEach(follower => {
        const bio = follower.biography || follower.bio || follower.bioText || '';
        const emails = bio.match(emailRegex);

        if (follower.username || follower.userName) {
          followers.push({
            username: follower.username || follower.userName,
            full_name: follower.full_name || follower.fullName || follower.nickname || follower.name || '',
            email: emails ? emails[0] : null,
            follower_count: follower.followerCount || follower.followersCount || follower.followers || 0,
            biography: bio,
            profile_pic_url: follower.profile_pic_url || follower.avatarThumb || follower.profilePicUrl || follower.picture || '',
            profile_url: follower.url || follower.profileUrl || `https://www.tiktok.com/@${follower.username || follower.userName}`,
            is_verified: follower.is_verified || follower.verified || follower.isVerified || false,
            external_url: follower.external_url || follower.externalUrl || null
          });
        }
      });
    }

    // Filter only followers with emails
    const followersWithEmails = followers.filter(f => f.email);

    const stats = {
      totalFollowers: items.length,
      analyzedCount: followers.length,
      emailsFound: followersWithEmails.length,
      successRate: followers.length > 0
        ? Math.round((followersWithEmails.length / followers.length) * 100)
        : 0
    };

    console.log(`Results: ${stats.emailsFound} emails found from ${stats.analyzedCount} followers`);

    res.json({
      ...stats,
      followers: followersWithEmails // Only return followers with emails
    });

  } catch (error) {
    console.error('Error scraping influencer:', error);
    res.status(500).json({
      error: 'Failed to scrape influencer data',
      message: error.message,
      details: 'Make sure you have set up your Apify API token in environment variables'
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 YU Research Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${RESEARCH_DIR}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  - GET /api/files/* - Serve files for preview`);
  console.log(`  - GET /api/download/* - Download files`);
  console.log(`  - POST /api/scrape-influencer - Scrape influencer audience emails`);
  console.log(`  - GET /api/health - Health check`);
  console.log(`  - GET /api/debug/structure - View file structure\n`);
});
