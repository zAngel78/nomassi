const { ApifyClient } = require('apify-client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Initialize Apify client
// Get your API token from: https://console.apify.com/account/integrations
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
 * Scrape Instagram profile and posts
 * @param {string} username - Instagram username (e.g., 'yeshiva_university')
 * @param {number} resultsLimit - Number of posts to scrape
 */
async function scrapeInstagramProfile(username, resultsLimit = 50) {
    console.log(`🔍 Starting scrape for @${username}...`);
    
    try {
        // Prepare Actor input
        const input = {
            directUrls: [`https://www.instagram.com/${username}/`],
            resultsType: 'posts',
            resultsLimit: resultsLimit,
            searchType: 'user',
            searchLimit: 1,
        };

        // Run the Actor and wait for it to finish
        console.log('⏳ Running Apify Instagram scraper...');
        const run = await client.actor("apify/instagram-scraper").call(input);

        // Fetch results from the run's dataset
        console.log('📥 Fetching results...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`✅ Successfully scraped ${items.length} posts`);

        // Create directories
        const outputDir = path.join(__dirname, 'public', 'instagram_data');
        const imagesDir = path.join(outputDir, username, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        console.log('📸 Downloading images...');

        // Process and format the data with image downloads
        const processedPosts = await Promise.all(items.map(async (post, index) => {
            let localImagePath = '';
            
            // Download image if available
            if (post.displayUrl || post.thumbnailUrl) {
                const imageUrl = post.displayUrl || post.thumbnailUrl;
                const imageExt = imageUrl.includes('.jpg') ? 'jpg' : 'webp';
                const imageName = `${post.id || `post_${index}`}.${imageExt}`;
                const imagePath = path.join(imagesDir, imageName);
                
                try {
                    await downloadImage(imageUrl, imagePath);
                    localImagePath = `/api/files/instagram_data/${username}/images/${imageName}`;
                    console.log(`  ✓ Downloaded image ${index + 1}/${items.length}`);
                } catch (err) {
                    console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
                    localImagePath = imageUrl; // Fallback to original URL
                }
            }

            return {
                id: post.id || `post_${index}`,
                university: username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                caption: post.caption || '',
                image_url: localImagePath,
                original_image_url: post.displayUrl || post.thumbnailUrl || '',
                video_url: post.videoUrl || null,
                likes: post.likesCount || 0,
                comments: post.commentsCount || 0,
                date: post.timestamp || new Date().toISOString(),
                post_type: post.type || (post.videoUrl ? 'video' : 'image'),
                url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
                hashtags: extractHashtags(post.caption || ''),
                engagement_rate: calculateEngagementRate(
                    post.likesCount || 0,
                    post.commentsCount || 0,
                    post.ownerFullName || username
                ),
            };
        }));

        const outputFile = path.join(outputDir, `${username}_posts.json`);
        fs.writeFileSync(outputFile, JSON.stringify(processedPosts, null, 2));

        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total posts: ${processedPosts.length}`);
        console.log(`   - Total likes: ${processedPosts.reduce((sum, p) => sum + p.likes, 0)}`);
        console.log(`   - Total comments: ${processedPosts.reduce((sum, p) => sum + p.comments, 0)}`);
        console.log(`   - Avg engagement: ${(processedPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / processedPosts.length).toFixed(2)}%`);

        return processedPosts;

    } catch (error) {
        console.error('❌ Error scraping Instagram:', error.message);
        throw error;
    }
}

/**
 * Extract hashtags from caption
 */
function extractHashtags(caption) {
    const hashtagRegex = /#[\w]+/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

/**
 * Calculate engagement rate
 * Formula: (likes + comments) / followers * 100
 * Note: We'll use a placeholder for followers since we need profile data
 */
function calculateEngagementRate(likes, comments, username) {
    // Placeholder - in real scenario, fetch follower count from profile
    const estimatedFollowers = 15000; // YU has ~15K followers
    return ((likes + comments) / estimatedFollowers * 100).toFixed(2);
}

/**
 * Scrape multiple universities
 */
async function scrapeMultipleProfiles(usernames, resultsPerProfile = 30) {
    console.log(`\n🎯 Scraping ${usernames.length} profiles...\n`);
    
    const allResults = {};
    
    for (const username of usernames) {
        try {
            const posts = await scrapeInstagramProfile(username, resultsPerProfile);
            allResults[username] = posts;
            
            // Wait 2 seconds between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Failed to scrape ${username}:`, error.message);
            allResults[username] = [];
        }
    }
    
    // Save combined data
    const outputFile = path.join(__dirname, 'public', 'instagram_data', 'all_universities.json');
    fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));
    console.log(`\n✅ All data saved to: ${outputFile}`);
    
    return allResults;
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Default: scrape all universities from the research
        const universities = [
            'yeshiva_university',
            'nyuniversity',
            'columbia',
            'rutgersu',
            'brandeisuniversity',
        ];
        
        scrapeMultipleProfiles(universities, 30)
            .then(() => console.log('\n🎉 Scraping completed!'))
            .catch(err => console.error('Error:', err));
    } else {
        // Scrape single profile
        const username = args[0];
        const limit = parseInt(args[1]) || 50;
        
        scrapeInstagramProfile(username, limit)
            .then(() => console.log('\n🎉 Scraping completed!'))
            .catch(err => console.error('Error:', err));
    }
}

module.exports = {
    scrapeInstagramProfile,
    scrapeMultipleProfiles,
};
