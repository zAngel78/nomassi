const { ApifyClient } = require('apify-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load universities configuration
const universitiesConfig = require('./universities-config.json');

// Initialize Apify client
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || 'apify_api_EbgrxI7NdtNprUO2oGxDDgKI2ILLX429HuSk',
});

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
 * Helper functions for Twitter
 */
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

/**
 * Universal scraper for all social media platforms
 * Usage: node scrape-all-university.js <university_key> [platforms]
 *
 * Examples:
 *   node scrape-all-university.js nyu
 *   node scrape-all-university.js brandeis instagram,facebook
 *   node scrape-all-university.js columbia all
 */

async function scrapeUniversityPlatforms(universityKey, platformsToScrape = 'all') {
    // Validate university
    if (!universitiesConfig[universityKey]) {
        console.error(`❌ University "${universityKey}" not found in config.`);
        console.log(`\nAvailable universities: ${Object.keys(universitiesConfig).join(', ')}`);
        process.exit(1);
    }

    const university = universitiesConfig[universityKey];
    console.log(`\n🎓 Starting scrape for: ${university.name}`);
    console.log(`📁 Output folder: ${university.output_folder}`);

    // Determine which platforms to scrape
    let platforms = [];
    if (platformsToScrape === 'all') {
        // Only scrape Meta Ads for Yeshiva (already done)
        if (universityKey === 'yeshiva') {
            platforms = ['instagram', 'facebook', 'twitter', 'youtube', 'meta-ads'];
        } else {
            platforms = ['instagram', 'facebook', 'twitter', 'youtube'];
        }
    } else {
        platforms = platformsToScrape.split(',').map(p => p.trim());
    }

    console.log(`\n🎯 Platforms to scrape: ${platforms.join(', ')}\n`);

    const results = {
        university: university.name,
        scraped_at: new Date().toISOString(),
        platforms: {}
    };

    // Scrape each platform
    for (const platform of platforms) {
        // Skip if platform not configured for this university
        if (platform === 'twitter' && !university.twitter) {
            console.log(`⚠️  Skipping Twitter - not configured for ${university.name}`);
            continue;
        }

        try {
            switch (platform) {
                case 'instagram':
                    console.log(`\n📸 Scraping Instagram (@${university.instagram})...`);
                    results.platforms.instagram = await scrapeInstagram(university);
                    break;

                case 'facebook':
                    console.log(`\n👥 Scraping Facebook (${university.facebook})...`);
                    results.platforms.facebook = await scrapeFacebook(university);
                    break;

                case 'twitter':
                    if (university.twitter) {
                        console.log(`\n🐦 Scraping Twitter (@${university.twitter})...`);
                        results.platforms.twitter = await scrapeTwitter(university);
                    }
                    break;

                case 'youtube':
                    console.log(`\n📺 Scraping YouTube (${university.youtube})...`);
                    results.platforms.youtube = await scrapeYouTube(university);
                    break;

                case 'meta-ads':
                    console.log(`\n📢 Scraping Meta Ads Library...`);
                    results.platforms.meta_ads = await scrapeMetaAds(university);
                    break;

                default:
                    console.log(`⚠️  Unknown platform: ${platform}`);
            }
        } catch (error) {
            console.error(`❌ Error scraping ${platform}:`, error.message);
            results.platforms[platform] = { error: error.message };
        }
    }

    // Save summary report
    const reportPath = path.join(__dirname, 'public', 'social_data', university.output_folder, 'scrape_report.json');
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log(`\n\n✅ SCRAPING COMPLETED for ${university.name}`);
    console.log(`📊 Report saved to: ${reportPath}\n`);

    return results;
}

/**
 * Scrape Instagram using Apify (WITH IMAGE DOWNLOAD)
 */
async function scrapeInstagram(university) {
    console.log('   Using Apify Instagram Scraper...');

    const input = {
        directUrls: [`https://www.instagram.com/${university.instagram}/`],
        resultsType: "posts",
        resultsLimit: 50,
    };

    const run = await client.actor("apify/instagram-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`   ✓ Found ${items.length} Instagram posts`);

    // Create directories for images
    const imagesDir = path.join(__dirname, 'public', 'instagram_data', university.output_folder, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    console.log('   📸 Downloading Instagram images...');

    // Process posts with image download
    const processedPosts = await Promise.all(items.map(async (post, index) => {
        let localImagePath = '';
        let originalImageUrl = '';

        // Extract image URL (Instagram format)
        if (post.displayUrl) {
            originalImageUrl = post.displayUrl;
        } else if (post.imageUrl) {
            originalImageUrl = post.imageUrl;
        } else if (post.images && post.images.length > 0) {
            originalImageUrl = post.images[0];
        }

        // Download image locally
        if (originalImageUrl && originalImageUrl.startsWith('http')) {
            const imageExt = 'jpg';
            const imageName = `${university.output_folder}_ig_${index}_${Date.now()}.${imageExt}`;
            const imagePath = path.join(imagesDir, imageName);

            try {
                await downloadImage(originalImageUrl, imagePath);
                localImagePath = `/api/files/instagram_data/${university.output_folder}/images/${imageName}`;
                console.log(`     ✓ Downloaded image ${index + 1}/${items.length}`);
            } catch (err) {
                console.log(`     ✗ Failed to download image ${index + 1}: ${err.message}`);
                localImagePath = originalImageUrl;
            }
        }

        return {
            ...post,
            local_image_path: localImagePath,
            original_image_url: originalImageUrl,
        };
    }));

    // Save to file
    const outputPath = path.join(__dirname, 'public', 'instagram_data', `${university.output_folder}_posts.json`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(processedPosts, null, 2));

    return {
        posts_count: processedPosts.length,
        file: outputPath,
        status: 'success'
    };
}

/**
 * Scrape Facebook using Apify (WITH IMAGE DOWNLOAD)
 */
async function scrapeFacebook(university) {
    console.log('   Using Apify Facebook Posts Scraper...');

    const input = {
        startUrls: [{ url: `https://www.facebook.com/${university.facebook}` }],
        resultsLimit: 50,
    };

    const run = await client.actor("apify/facebook-posts-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`   ✓ Found ${items.length} Facebook posts`);

    // Create directories for images
    const imagesDir = path.join(__dirname, 'public', 'facebook_data', university.output_folder, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    console.log('   📸 Downloading Facebook images...');

    // Process posts with image download
    const processedPosts = await Promise.all(items.map(async (post, index) => {
        let localImagePath = '';
        let originalImageUrl = '';

        // Extract image URL (Facebook format - different fields for different post types)
        if (post.media && post.media.length > 0) {
            const media = post.media[0];

            // Video posts
            if (media.thumbnailImage && media.thumbnailImage.uri) {
                originalImageUrl = media.thumbnailImage.uri;
            } else if (media.thumbnail) {
                originalImageUrl = media.thumbnail;
            }
            // Link/preview posts
            else if (media.large_share_image && media.large_share_image.uri) {
                originalImageUrl = media.large_share_image.uri;
            }
            // Regular image posts
            else if (media.image && media.image.uri) {
                originalImageUrl = media.image.uri;
            } else if (media.image) {
                originalImageUrl = media.image;
            }
        } else if (post.imageUrl) {
            originalImageUrl = post.imageUrl;
        } else if (post.images && post.images.length > 0) {
            originalImageUrl = post.images[0];
        }

        // Download image locally
        if (originalImageUrl && originalImageUrl.startsWith('http')) {
            const imageExt = 'jpg';
            const imageName = `${university.output_folder}_fb_${index}_${Date.now()}.${imageExt}`;
            const imagePath = path.join(imagesDir, imageName);

            try {
                await downloadImage(originalImageUrl, imagePath);
                localImagePath = `/api/files/facebook_data/${university.output_folder}/images/${imageName}`;
                console.log(`     ✓ Downloaded image ${index + 1}/${items.length}`);
            } catch (err) {
                console.log(`     ✗ Failed to download image ${index + 1}: ${err.message}`);
                localImagePath = originalImageUrl;
            }
        }

        return {
            ...post,
            local_image_path: localImagePath,
            original_image_url: originalImageUrl,
        };
    }));

    // Save to file
    const outputPath = path.join(__dirname, 'public', 'facebook_data', `${university.output_folder}_posts.json`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(processedPosts, null, 2));

    return {
        posts_count: processedPosts.length,
        file: outputPath,
        status: 'success'
    };
}

/**
 * Scrape Twitter using Puppeteer (WITH IMAGE DOWNLOAD)
 */
async function scrapeTwitter(university) {
    console.log('   Using Puppeteer Twitter Scraper...');

    const username = university.twitter;
    const limit = 50;

    let browser;
    try {
        // Launch browser
        console.log('   🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to Twitter profile
        const url = `https://x.com/${username}`;
        console.log(`   📱 Navigating to ${url}...`);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for tweets to load
        console.log('   ⏳ Waiting for tweets to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Scroll to load more tweets
        console.log('   📜 Scrolling to load tweets...');
        for (let i = 0; i < 15; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Extract tweets
        console.log('   📥 Extracting tweets...');
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

        console.log(`   ✅ Successfully scraped ${tweets.length} tweets`);

        // Close browser
        await browser.close();

        // Create directories
        const imagesDir = path.join(__dirname, 'public', 'twitter_data', university.output_folder, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        console.log('   📸 Downloading images...');

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
                    localImagePath = `/api/files/twitter_data/${university.output_folder}/images/${imageName}`;
                    console.log(`     ✓ Downloaded image ${index + 1}/${tweets.slice(0, limit).length}`);
                } catch (err) {
                    console.log(`     ✗ Failed to download image ${index + 1}: ${err.message}`);
                    localImagePath = originalImageUrl;
                }
            }

            return {
                id: tweet.id,
                university: university.name,
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
        const outputPath = path.join(__dirname, 'public', 'twitter_data', `${university.output_folder}_tweets.json`);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(processedTweets, null, 2));

        console.log(`   📊 Summary:`);
        console.log(`      - Total tweets: ${processedTweets.length}`);
        console.log(`      - Total likes: ${processedTweets.reduce((sum, t) => sum + t.likes, 0)}`);
        console.log(`      - Total retweets: ${processedTweets.reduce((sum, t) => sum + t.retweets, 0)}`);

        return {
            tweets_count: processedTweets.length,
            file: outputPath,
            status: 'success'
        };

    } catch (error) {
        console.error(`   ❌ Error scraping Twitter: ${error.message}`);
        if (browser) await browser.close();

        return {
            tweets_count: 0,
            file: '',
            status: 'error',
            error: error.message
        };
    }
}

/**
 * Scrape YouTube using Apify (WITH THUMBNAIL DOWNLOAD)
 */
async function scrapeYouTube(university) {
    console.log('   Using Apify YouTube Scraper (streamers/youtube-scraper)...');

    const input = {
        searchQueries: [`${university.youtube}`],
        maxResults: 20,
    };

    const run = await client.actor("streamers/youtube-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`   ✓ Found ${items.length} YouTube videos`);

    // Create directories for thumbnails
    const imagesDir = path.join(__dirname, 'public', 'youtube_data', university.output_folder, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    console.log('   📸 Downloading YouTube thumbnails...');

    // Process videos with thumbnail download
    const processedVideos = await Promise.all(items.map(async (video, index) => {
        let localImagePath = '';
        let originalImageUrl = '';

        // Extract thumbnail URL (YouTube format)
        if (video.thumbnailUrl) {
            originalImageUrl = video.thumbnailUrl;
        } else if (video.thumbnail) {
            originalImageUrl = video.thumbnail;
        } else if (video.thumbnails && video.thumbnails.length > 0) {
            originalImageUrl = video.thumbnails[0].url || video.thumbnails[0];
        }

        // Download thumbnail locally
        if (originalImageUrl && originalImageUrl.startsWith('http')) {
            const imageExt = 'jpg';
            const imageName = `${university.output_folder}_yt_${index}_${Date.now()}.${imageExt}`;
            const imagePath = path.join(imagesDir, imageName);

            try {
                await downloadImage(originalImageUrl, imagePath);
                localImagePath = `/api/files/youtube_data/${university.output_folder}/images/${imageName}`;
                console.log(`     ✓ Downloaded thumbnail ${index + 1}/${items.length}`);
            } catch (err) {
                console.log(`     ✗ Failed to download thumbnail ${index + 1}: ${err.message}`);
                localImagePath = originalImageUrl;
            }
        }

        return {
            ...video,
            local_image_path: localImagePath,
            original_image_url: originalImageUrl,
        };
    }));

    // Save to file
    const outputPath = path.join(__dirname, 'public', 'youtube_data', `${university.output_folder}_videos.json`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(processedVideos, null, 2));

    return {
        videos_count: processedVideos.length,
        file: outputPath,
        status: 'success'
    };
}

/**
 * Scrape Meta Ads Library using Apify (WITH IMAGE DOWNLOAD)
 */
async function scrapeMetaAds(university) {
    console.log('   Using Apify Meta Ads Library Scraper...');

    const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(university.meta_ads)}&search_type=keyword_unordered&media_type=all`;

    const input = {
        startUrls: [adsLibraryUrl],
        maxItems: 25,
        scrapeAdDetails: true,
    };

    const run = await client.actor("memo23/facebook-ads-library-scraper-cheerio").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`   ✓ Found ${items.length} Meta Ads`);

    // Create directories for images
    const imagesDir = path.join(__dirname, 'public', 'meta_ads_data', university.output_folder, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    console.log('   📸 Downloading ad images...');

    // Process ads with image download
    const processedAds = await Promise.all(items.map(async (ad, index) => {
        let localImagePath = '';
        let originalImageUrl = '';

        // Extract image URL from snapshot (Apify format)
        if (ad.snapshot?.videos && ad.snapshot.videos.length > 0) {
            originalImageUrl = ad.snapshot.videos[0].video_preview_image_url || '';
        } else if (ad.snapshot?.images && ad.snapshot.images.length > 0) {
            originalImageUrl = ad.snapshot.images[0] || '';
        } else if (ad.snapshot?.page_profile_picture_url) {
            originalImageUrl = ad.snapshot.page_profile_picture_url || '';
        }

        // Ensure it's a string
        originalImageUrl = String(originalImageUrl || '');

        // Download image locally
        if (originalImageUrl && originalImageUrl.startsWith('http')) {
            const imageExt = 'jpg';
            const imageName = `${university.output_folder}_${ad.ad_archive_id || index}_${Date.now()}.${imageExt}`;
            const imagePath = path.join(imagesDir, imageName);

            try {
                await downloadImage(originalImageUrl, imagePath);
                localImagePath = `/api/files/meta_ads_data/${university.output_folder}/images/${imageName}`;
                console.log(`     ✓ Downloaded image ${index + 1}/${items.length}`);
            } catch (err) {
                console.log(`     ✗ Failed to download image ${index + 1}: ${err.message}`);
                localImagePath = originalImageUrl;
            }
        }

        // Extract platforms from Apify format
        let platforms = ad.publisher_platform || ad.publisherPlatform || ['Facebook'];
        if (!Array.isArray(platforms)) {
            platforms = [platforms];
        }

        // Extract reach and impressions from Apify format
        const reach = ad.reach_estimate || ad.reach || 'N/A';
        const impressionsData = ad.impressions_with_index || ad.impressionsWithIndex;
        const impressions = impressionsData?.impressions_text || impressionsData?.impressionsText || 'N/A';
        const spend = ad.spend || 'N/A';

        // Extract text from snapshot
        const body = ad.snapshot?.body?.text || '';
        const title = ad.snapshot?.title || '';
        const linkDescription = ad.snapshot?.link_description || ad.snapshot?.caption || '';
        const videoUrl = ad.snapshot?.videos?.[0]?.video_hd_url || ad.snapshot?.videos?.[0]?.video_sd_url || null;

        return {
            id: ad.ad_archive_id || ad.adArchiveID || `ad_${Date.now()}_${index}`,
            university: university.name,
            title: title,
            body: body,
            link_description: linkDescription,
            image_url: localImagePath,
            original_image_url: originalImageUrl,
            video_url: videoUrl,
            start_date: ad.start_date ? new Date(ad.start_date * 1000).toISOString() : new Date().toISOString(),
            end_date: ad.end_date ? new Date(ad.end_date * 1000).toISOString() : '',
            platforms: platforms,
            is_active: ad.is_active !== false,
            page_name: ad.page_name || ad.pageName || university.name,
            ad_url: ad.ad_archive_id
                ? `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`
                : `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(university.meta_ads)}`,
            spend: spend,
            reach_estimate: reach,
            impressions: impressions,
        };
    }));

    // Save to file
    const outputPath = path.join(__dirname, 'public', 'meta_ads_data', `${university.output_folder}_ads.json`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(processedAds, null, 2));

    console.log(`   📊 Summary:`);
    console.log(`      - Total ads: ${processedAds.length}`);
    console.log(`      - Active ads: ${processedAds.filter(ad => ad.is_active).length}`);
    console.log(`      - Ads with Reach data: ${processedAds.filter(ad => ad.reach_estimate !== 'N/A').length}`);
    console.log(`      - Ads with Impressions data: ${processedAds.filter(ad => ad.impressions !== 'N/A').length}`);

    return {
        ads_count: processedAds.length,
        file: outputPath,
        status: 'success'
    };
}

// Run if called directly
if (require.main === module) {
    const universityKey = process.argv[2];
    const platforms = process.argv[3] || 'all';

    if (!universityKey) {
        console.log('Usage: node scrape-all-university.js <university_key> [platforms]');
        console.log('\nAvailable universities:');
        Object.keys(universitiesConfig).forEach(key => {
            console.log(`  - ${key}: ${universitiesConfig[key].name}`);
        });
        console.log('\nPlatforms: all, instagram, facebook, twitter, youtube, meta-ads');
        console.log('\nExamples:');
        console.log('  node scrape-all-university.js nyu');
        console.log('  node scrape-all-university.js brandeis instagram,facebook');
        process.exit(1);
    }

    scrapeUniversityPlatforms(universityKey, platforms)
        .then(() => {
            console.log('🎉 All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeUniversityPlatforms };
