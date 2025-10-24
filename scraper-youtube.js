const { ApifyClient } = require('apify-client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Initialize Apify client
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || 'apify_api_rERqfaqdkTNgV6X2Lu2Un7eUDvOfSm2Q1I28',
});

/**
 * Download image from URL and save locally
 */
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);
        
        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

/**
 * Scrape YouTube channel videos
 * @param {string} channelUrl - YouTube channel URL
 * @param {number} resultsLimit - Number of videos to scrape
 */
async function scrapeYouTubeChannel(channelUrl, resultsLimit = 20) {
    console.log(`🔍 Starting YouTube scrape for ${channelUrl}...`);
    
    try {
        // Prepare Actor input
        const input = {
            startUrls: [{ url: channelUrl }],
            maxResults: resultsLimit,
        };

        // Run the Actor and wait for it to finish
        console.log('⏳ Running Apify YouTube scraper...');
        const run = await client.actor("streamers/youtube-scraper").call(input);

        // Fetch results from the run's dataset
        console.log('📥 Fetching results...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`✅ Successfully scraped ${items.length} videos`);
        
        // Debug: Show first video structure
        if (items.length > 0) {
            console.log('\n📋 Sample video structure:');
            console.log(JSON.stringify(items[0], null, 2));
        }

        // Extract channel name from URL
        const channelName = channelUrl.split('/').pop().toLowerCase().replace('@', '');

        // Create directories
        const outputDir = path.join(__dirname, 'public', 'youtube_data');
        const thumbnailsDir = path.join(outputDir, channelName, 'thumbnails');
        if (!fs.existsSync(thumbnailsDir)) {
            fs.mkdirSync(thumbnailsDir, { recursive: true });
        }

        console.log('📸 Downloading thumbnails...');

        // Process and format the data with thumbnail downloads
        const processedVideos = await Promise.all(items.slice(0, resultsLimit).map(async (video, index) => {
            let localThumbnailPath = '';
            let originalThumbnailUrl = '';
            
            // Extract thumbnail URL
            if (video.thumbnailUrl) {
                originalThumbnailUrl = video.thumbnailUrl;
                const imageExt = 'jpg';
                const imageName = `${video.id || `video_${index}`}.${imageExt}`;
                const imagePath = path.join(thumbnailsDir, imageName);
                
                try {
                    await downloadImage(originalThumbnailUrl, imagePath);
                    localThumbnailPath = `/api/files/youtube_data/${channelName}/thumbnails/${imageName}`;
                    console.log(`  ✓ Downloaded thumbnail ${index + 1}/${items.length}`);
                } catch (err) {
                    console.log(`  ✗ Failed to download thumbnail ${index + 1}: ${err.message}`);
                    localThumbnailPath = originalThumbnailUrl;
                }
            }

            return {
                id: video.id || `video_${index}`,
                university: 'Yeshiva University',
                title: video.title || '',
                description: video.text || video.description || '',
                thumbnail_url: localThumbnailPath,
                original_thumbnail_url: originalThumbnailUrl,
                video_url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
                views: video.viewCount || 0,
                likes: video.likes || 0,
                comments: video.commentsCount || 0,
                duration: video.duration || '',
                date: video.date || new Date().toISOString(),
                channel: video.channelName || 'Yeshiva University',
                engagement_rate: calculateEngagementRate(
                    video.likes || 0,
                    video.commentsCount || 0,
                    video.viewCount || 0
                ),
            };
        }));

        const outputFile = path.join(outputDir, `${channelName}_videos.json`);
        fs.writeFileSync(outputFile, JSON.stringify(processedVideos, null, 2));

        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total videos: ${processedVideos.length}`);
        console.log(`   - Total views: ${processedVideos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}`);
        console.log(`   - Total likes: ${processedVideos.reduce((sum, v) => sum + v.likes, 0).toLocaleString()}`);
        console.log(`   - Total comments: ${processedVideos.reduce((sum, v) => sum + v.comments, 0).toLocaleString()}`);
        console.log(`   - Avg engagement: ${(processedVideos.reduce((sum, v) => sum + parseFloat(v.engagement_rate), 0) / processedVideos.length).toFixed(2)}%`);

        return processedVideos;

    } catch (error) {
        console.error('❌ Error scraping YouTube:', error.message);
        throw error;
    }
}

/**
 * Calculate engagement rate for YouTube
 * Engagement = (likes + comments) / views * 100
 */
function calculateEngagementRate(likes, comments, views) {
    if (views === 0) return '0.00';
    const totalEngagement = likes + comments;
    const rate = (totalEngagement / views) * 100;
    return rate.toFixed(2);
}

// Run the scraper if called directly
if (require.main === module) {
    const channelUrl = process.argv[2] || 'https://www.youtube.com/@YeshivaUniversity';
    const limit = parseInt(process.argv[3]) || 20;

    scrapeYouTubeChannel(channelUrl, limit)
        .then(() => {
            console.log('\n🎉 Scraping completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeYouTubeChannel };
