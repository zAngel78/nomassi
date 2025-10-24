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
            fs.unlink(filepath, () => {}); // Delete the file if error
            reject(err);
        });
    });
}

/**
 * Scrape Facebook page posts
 * @param {string} pageUrl - Facebook page URL (e.g., 'https://www.facebook.com/YeshivaUniversity')
 * @param {number} resultsLimit - Number of posts to scrape
 */
async function scrapeFacebookPage(pageUrl, resultsLimit = 50) {
    console.log(`🔍 Starting Facebook scrape for ${pageUrl}...`);
    
    try {
        // Prepare Actor input
        const input = {
            startUrls: [{ url: pageUrl }],
            resultsLimit: resultsLimit,
            maxPosts: resultsLimit,
            scrapeAbout: false,
            scrapeReviews: false,
            scrapeServices: false,
            onlyPosts: true,
        };

        // Run the Actor and wait for it to finish
        console.log('⏳ Running Apify Facebook scraper...');
        console.log('⚠️  Note: Facebook scraping is limited. May get fewer posts than requested.');
        const run = await client.actor("apify/facebook-posts-scraper").call(input);

        // Fetch results from the run's dataset
        console.log('📥 Fetching results...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`✅ Successfully scraped ${items.length} posts`);
        
        // Debug: Show first post structure
        if (items.length > 0) {
            console.log('\n📋 Sample post structure:');
            console.log(JSON.stringify(items[0], null, 2));
        }

        // Extract page name from URL
        const pageName = pageUrl.split('/').pop().toLowerCase();

        // Create directories
        const outputDir = path.join(__dirname, 'public', 'facebook_data');
        const imagesDir = path.join(outputDir, pageName, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        console.log('📸 Downloading images...');

        // Process and format the data with image downloads
        const processedPosts = await Promise.all(items.map(async (post, index) => {
            let localImagePath = '';
            let originalImageUrl = '';
            
            // Extract image URL from media array
            if (post.media && post.media.length > 0) {
                const media = post.media[0];
                // Try different possible image URL fields
                originalImageUrl = media.photo_image?.uri || media.thumbnail || '';
                
                if (originalImageUrl) {
                    const imageExt = originalImageUrl.includes('.jpg') ? 'jpg' : 'png';
                    const imageName = `${post.postId || `post_${index}`}.${imageExt}`;
                    const imagePath = path.join(imagesDir, imageName);
                    
                    try {
                        await downloadImage(originalImageUrl, imagePath);
                        localImagePath = `/api/files/facebook_data/${pageName}/images/${imageName}`;
                        console.log(`  ✓ Downloaded image ${index + 1}/${items.length}`);
                    } catch (err) {
                        console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
                        localImagePath = originalImageUrl; // Fallback to original URL
                    }
                }
            }

            return {
                id: post.postId || `post_${index}`,
                university: 'Yeshiva University',
                text: post.text || '',
                image_url: localImagePath,
                original_image_url: originalImageUrl,
                video_url: post.video || null,
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0,
                date: post.time || new Date().toISOString(),
                post_type: post.video ? 'Video' : (originalImageUrl ? 'Image' : 'Text'),
                url: post.url || '',
                engagement_rate: calculateEngagementRate(
                    post.likes || 0,
                    post.comments || 0,
                    post.shares || 0
                ),
            };
        }));

        const outputFile = path.join(outputDir, `${pageName}_posts.json`);
        fs.writeFileSync(outputFile, JSON.stringify(processedPosts, null, 2));

        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total posts: ${processedPosts.length}`);
        console.log(`   - Total likes: ${processedPosts.reduce((sum, p) => sum + p.likes, 0)}`);
        console.log(`   - Total comments: ${processedPosts.reduce((sum, p) => sum + p.comments, 0)}`);
        console.log(`   - Total shares: ${processedPosts.reduce((sum, p) => sum + p.shares, 0)}`);
        console.log(`   - Avg engagement: ${(processedPosts.reduce((sum, p) => sum + parseFloat(p.engagement_rate), 0) / processedPosts.length).toFixed(2)}%`);

        return processedPosts;

    } catch (error) {
        console.error('❌ Error scraping Facebook:', error.message);
        throw error;
    }
}

/**
 * Calculate engagement rate
 * Facebook engagement = (likes + comments + shares) / estimated reach
 * We'll use a simplified version based on total interactions
 */
function calculateEngagementRate(likes, comments, shares) {
    // Assuming average page reach is ~15,000 for YU (based on follower count)
    const estimatedReach = 15000;
    const totalEngagement = likes + comments + (shares * 2); // Shares count double
    const rate = (totalEngagement / estimatedReach) * 100;
    return rate.toFixed(2);
}

// Run the scraper if called directly
if (require.main === module) {
    const pageUrl = process.argv[2] || 'https://www.facebook.com/YeshivaUniversity';
    const limit = parseInt(process.argv[3]) || 50;

    scrapeFacebookPage(pageUrl, limit)
        .then(() => {
            console.log('\n🎉 Scraping completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeFacebookPage };
