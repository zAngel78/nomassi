const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Download image from URL and save locally
 */
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
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
 * Scrape Twitter profile using Puppeteer
 */
async function scrapeTwitterProfile(username, limit = 50) {
    console.log(`🔍 Starting Twitter scrape for @${username}...`);
    
    let browser;
    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate to Twitter profile
        const url = `https://x.com/${username}`;
        console.log(`📱 Navigating to ${url}...`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        // Wait for tweets to load
        console.log('⏳ Waiting for tweets to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Scroll to load more tweets
        console.log('📜 Scrolling to load tweets...');
        for (let i = 0; i < 15; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log(`  Scroll ${i + 1}/15...`);
        }
        
        // Extract tweets
        console.log('📥 Extracting tweets...');
        const tweets = await page.evaluate(() => {
            const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
            const results = [];
            
            tweetElements.forEach((tweet, index) => {
                try {
                    // Extract text
                    const textElement = tweet.querySelector('[data-testid="tweetText"]');
                    const text = textElement ? textElement.innerText : '';
                    
                    // Extract time
                    const timeElement = tweet.querySelector('time');
                    const date = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();
                    
                    // Extract engagement metrics
                    const replyElement = tweet.querySelector('[data-testid="reply"]');
                    const retweetElement = tweet.querySelector('[data-testid="retweet"]');
                    const likeElement = tweet.querySelector('[data-testid="like"]');
                    
                    const replies = replyElement ? parseInt(replyElement.innerText.replace(/[^0-9]/g, '') || '0') : 0;
                    const retweets = retweetElement ? parseInt(retweetElement.innerText.replace(/[^0-9]/g, '') || '0') : 0;
                    const likes = likeElement ? parseInt(likeElement.innerText.replace(/[^0-9]/g, '') || '0') : 0;
                    
                    // Extract images
                    const images = [];
                    const imageElements = tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]');
                    imageElements.forEach(img => {
                        const src = img.getAttribute('src');
                        if (src && !src.includes('profile_images')) {
                            images.push(src);
                        }
                    });
                    
                    // Extract tweet URL
                    const linkElement = tweet.querySelector('a[href*="/status/"]');
                    const tweetUrl = linkElement ? 'https://x.com' + linkElement.getAttribute('href') : '';
                    const tweetId = tweetUrl.split('/status/')[1]?.split('?')[0] || `tweet_${index}`;
                    
                    results.push({
                        id: tweetId,
                        text: text,
                        date: date,
                        replies: replies,
                        retweets: retweets,
                        likes: likes,
                        images: images,
                        url: tweetUrl
                    });
                } catch (err) {
                    console.error('Error extracting tweet:', err);
                }
            });
            
            return results;
        });
        
        console.log(`✅ Successfully scraped ${tweets.length} tweets`);
        
        // Close browser
        await browser.close();
        
        // Create directories
        const outputDir = path.join(__dirname, 'public', 'twitter_data');
        const imagesDir = path.join(outputDir, username.toLowerCase(), 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        console.log('📸 Downloading images...');
        
        // Process tweets and download images
        const processedTweets = await Promise.all(tweets.slice(0, limit).map(async (tweet, index) => {
            let localImagePath = '';
            let originalImageUrl = '';
            
            if (tweet.images && tweet.images.length > 0) {
                originalImageUrl = tweet.images[0];
                const imageExt = 'jpg';
                const imageName = `${tweet.id}.${imageExt}`;
                const imagePath = path.join(imagesDir, imageName);
                
                try {
                    await downloadImage(originalImageUrl, imagePath);
                    localImagePath = `/api/files/twitter_data/${username.toLowerCase()}/images/${imageName}`;
                    console.log(`  ✓ Downloaded image ${index + 1}/${tweets.length}`);
                } catch (err) {
                    console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
                    localImagePath = originalImageUrl;
                }
            }
            
            return {
                id: tweet.id,
                university: 'Yeshiva University',
                text: tweet.text,
                image_url: localImagePath,
                original_image_url: originalImageUrl,
                video_url: null,
                likes: tweet.likes,
                retweets: tweet.retweets,
                replies: tweet.replies,
                views: Math.floor(tweet.likes * 50), // Estimate views
                date: tweet.date,
                post_type: originalImageUrl ? 'Image' : 'Text',
                url: tweet.url,
                hashtags: extractHashtags(tweet.text),
                mentions: extractMentions(tweet.text),
                engagement_rate: calculateEngagementRate(tweet.likes, tweet.retweets, tweet.replies, tweet.likes * 50),
            };
        }));
        
        // Save to JSON
        const outputFile = path.join(outputDir, `${username.toLowerCase()}_tweets.json`);
        fs.writeFileSync(outputFile, JSON.stringify(processedTweets, null, 2));
        
        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total tweets: ${processedTweets.length}`);
        console.log(`   - Total likes: ${processedTweets.reduce((sum, t) => sum + t.likes, 0)}`);
        console.log(`   - Total retweets: ${processedTweets.reduce((sum, t) => sum + t.retweets, 0)}`);
        console.log(`   - Total replies: ${processedTweets.reduce((sum, t) => sum + t.replies, 0)}`);
        
        return processedTweets;
        
    } catch (error) {
        console.error('❌ Error scraping Twitter:', error.message);
        if (browser) await browser.close();
        throw error;
    }
}

function extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

function extractMentions(text) {
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.toLowerCase()) : [];
}

function calculateEngagementRate(likes, retweets, replies, views) {
    if (views === 0) return '0.00';
    const totalEngagement = likes + retweets + replies;
    const rate = (totalEngagement / views) * 100;
    return rate.toFixed(2);
}

// Run if called directly
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
