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
 * Scrape Twitter/X profile tweets
 * @param {string} username - Twitter username (e.g., 'YUNews')
 * @param {number} resultsLimit - Number of tweets to scrape
 */
async function scrapeTwitterProfile(username, resultsLimit = 50) {
    console.log(`🔍 Starting Twitter/X scrape for @${username}...`);
    
    try {
        // Prepare Actor input
        const input = {
            handles: [username],
            tweetsDesired: resultsLimit,
            withReplies: false,
            includeUserInfo: true,
        };

        // Run the Actor and wait for it to finish
        console.log('⏳ Running Apify Twitter scraper...');
        console.log('⚠️  Note: Twitter scraping may be limited due to API restrictions.');
        const run = await client.actor("web.harvester/twitter-scraper").call(input);

        // Fetch results from the run's dataset
        console.log('📥 Fetching results...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`✅ Successfully scraped ${items.length} tweets`);
        
        // Debug: Show first tweet structure
        if (items.length > 0) {
            console.log('\n📋 Sample tweet structure:');
            console.log(JSON.stringify(items[0], null, 2));
        }

        // Create directories
        const outputDir = path.join(__dirname, 'public', 'twitter_data');
        const imagesDir = path.join(outputDir, username.toLowerCase(), 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        console.log('📸 Downloading images...');

        // Process and format the data with image downloads
        const processedTweets = await Promise.all(items.map(async (tweet, index) => {
            let localImagePath = '';
            let originalImageUrl = '';
            
            // Extract image URL from photos array
            if (tweet.photos && tweet.photos.length > 0) {
                originalImageUrl = tweet.photos[0].url || '';
                
                if (originalImageUrl) {
                    const imageExt = originalImageUrl.includes('.jpg') ? 'jpg' : 'png';
                    const imageName = `${tweet.id || `tweet_${index}`}.${imageExt}`;
                    const imagePath = path.join(imagesDir, imageName);
                    
                    try {
                        await downloadImage(originalImageUrl, imagePath);
                        localImagePath = `/api/files/twitter_data/${username.toLowerCase()}/images/${imageName}`;
                        console.log(`  ✓ Downloaded image ${index + 1}/${items.length}`);
                    } catch (err) {
                        console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
                        localImagePath = originalImageUrl; // Fallback to original URL
                    }
                }
            }

            return {
                id: tweet.id || `tweet_${index}`,
                university: 'Yeshiva University',
                text: tweet.text || '',
                image_url: localImagePath,
                original_image_url: originalImageUrl,
                video_url: tweet.video?.variants?.[0]?.url || null,
                likes: tweet.likeCount || 0,
                retweets: tweet.retweetCount || 0,
                replies: tweet.replyCount || 0,
                views: tweet.viewCount || 0,
                date: tweet.createdAt || new Date().toISOString(),
                post_type: tweet.video ? 'Video' : (originalImageUrl ? 'Image' : 'Text'),
                url: tweet.url || `https://twitter.com/${username}/status/${tweet.id}`,
                hashtags: extractHashtags(tweet.text || ''),
                mentions: extractMentions(tweet.text || ''),
                engagement_rate: calculateEngagementRate(
                    tweet.likeCount || 0,
                    tweet.retweetCount || 0,
                    tweet.replyCount || 0,
                    tweet.viewCount || 0
                ),
            };
        }));

        const outputFile = path.join(outputDir, `${username.toLowerCase()}_tweets.json`);
        fs.writeFileSync(outputFile, JSON.stringify(processedTweets, null, 2));

        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total tweets: ${processedTweets.length}`);
        console.log(`   - Total likes: ${processedTweets.reduce((sum, t) => sum + t.likes, 0)}`);
        console.log(`   - Total retweets: ${processedTweets.reduce((sum, t) => sum + t.retweets, 0)}`);
        console.log(`   - Total replies: ${processedTweets.reduce((sum, t) => sum + t.replies, 0)}`);
        console.log(`   - Total views: ${processedTweets.reduce((sum, t) => sum + t.views, 0)}`);
        console.log(`   - Avg engagement: ${(processedTweets.reduce((sum, t) => sum + parseFloat(t.engagement_rate), 0) / processedTweets.length).toFixed(2)}%`);

        return processedTweets;

    } catch (error) {
        console.error('❌ Error scraping Twitter:', error.message);
        throw error;
    }
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

/**
 * Extract mentions from text
 */
function extractMentions(text) {
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.toLowerCase()) : [];
}

/**
 * Calculate engagement rate for Twitter
 * Engagement = (likes + retweets + replies) / views * 100
 */
function calculateEngagementRate(likes, retweets, replies, views) {
    if (views === 0) return '0.00';
    const totalEngagement = likes + retweets + replies;
    const rate = (totalEngagement / views) * 100;
    return rate.toFixed(2);
}

// Run the scraper if called directly
if (require.main === module) {
    const username = process.argv[2] || 'YUNews';
    const limit = parseInt(process.argv[3]) || 50;

    scrapeTwitterProfile(username, limit)
        .then(() => {
            console.log('\n🎉 Scraping completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeTwitterProfile };
