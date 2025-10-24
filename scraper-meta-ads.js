const { ApifyClient } = require('apify-client');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Apify client
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || 'apify_api_rERqfaqdkTNgV6X2Lu2Un7eUDvOfSm2Q1I28',
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
 * Scrape Meta Ads Library
 * @param {string} pageId - Facebook Page ID
 * @param {number} resultsLimit - Number of ads to scrape
 */
async function scrapeMetaAds(pageId, resultsLimit = 20) {
    console.log(`🔍 Starting Meta Ads Library scrape for page ID: ${pageId}...`);
    
    try {
        // Prepare Actor input - Using Meta Ads Library URL
        const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=${pageId}`;
        const input = {
            startUrls: [{ url: adsLibraryUrl }],
            maxItems: resultsLimit,
        };

        // Run the Actor and wait for it to finish
        console.log('⏳ Running Apify Meta Ads Library scraper...');
        const run = await client.actor("apify/facebook-ads-scraper").call(input);

        // Fetch results from the run's dataset
        console.log('📥 Fetching results...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`✅ Successfully scraped ${items.length} ads`);
        
        // Debug: Show first ad structure
        if (items.length > 0) {
            console.log('\n📋 Sample ad structure:');
            console.log(JSON.stringify(items[0], null, 2));
        }

        // Create directories
        const outputDir = path.join(__dirname, 'public', 'meta_ads_data');
        const imagesDir = path.join(outputDir, 'yeshiva_university', 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        console.log('📸 Downloading ad images...');

        // Process and format the data with image downloads
        const processedAds = await Promise.all(items.slice(0, resultsLimit).map(async (ad, index) => {
            let localImagePath = '';
            let originalImageUrl = '';
            let videoUrl = null;
            
            // Extract image URL (try multiple sources)
            if (ad.snapshot?.videos && ad.snapshot.videos.length > 0) {
                originalImageUrl = ad.snapshot.videos[0].videoPreviewImageUrl || '';
                videoUrl = ad.snapshot.videos[0].videoHdUrl || ad.snapshot.videos[0].videoSdUrl || null;
            } else if (ad.snapshot?.images && ad.snapshot.images.length > 0) {
                originalImageUrl = ad.snapshot.images[0];
            } else if (ad.snapshot?.cards && ad.snapshot.cards.length > 0) {
                // Try to get from cards (carousel ads)
                originalImageUrl = ad.snapshot.cards[0]?.original_image_url || ad.snapshot.cards[0]?.resized_image_url || '';
            } else if (ad.snapshot?.link_url) {
                // For dynamic ads, try to get page profile picture as fallback
                originalImageUrl = ad.snapshot.pageProfilePictureUrl || '';
            }
            
            if (originalImageUrl) {
                const imageExt = 'jpg';
                const imageName = `${ad.adArchiveID || `ad_${index}`}.${imageExt}`;
                const imagePath = path.join(imagesDir, imageName);
                
                try {
                    await downloadImage(originalImageUrl, imagePath);
                    localImagePath = `/api/files/meta_ads_data/yeshiva_university/images/${imageName}`;
                    console.log(`  ✓ Downloaded image ${index + 1}/${items.length}`);
                } catch (err) {
                    console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
                    // Keep original URL as fallback
                    localImagePath = originalImageUrl;
                }
            } else {
                console.log(`  ⚠ No image found for ad ${index + 1}`);
            }

            return {
                id: ad.adArchiveID || `ad_${index}`,
                university: 'Yeshiva University',
                title: ad.snapshot?.title || '',
                body: ad.snapshot?.body?.text || '',
                link_description: ad.snapshot?.linkDescription || '',
                image_url: localImagePath,
                original_image_url: originalImageUrl,
                video_url: videoUrl,
                start_date: ad.startDateFormatted || new Date().toISOString(),
                end_date: ad.endDateFormatted || null,
                platforms: ad.publisherPlatform || [],
                is_active: ad.isActive || false,
                page_name: ad.pageName || 'Yeshiva University',
                ad_url: ad.adArchiveID ? `https://www.facebook.com/ads/library/?id=${ad.adArchiveID}` : '',
                spend: ad.spend || 'N/A',
                reach_estimate: ad.reachEstimate || 'N/A',
                impressions: ad.impressionsWithIndex?.impressionsText || 'N/A',
            };
        }));

        const outputFile = path.join(outputDir, 'yeshiva_university_ads.json');
        fs.writeFileSync(outputFile, JSON.stringify(processedAds, null, 2));

        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total ads: ${processedAds.length}`);
        console.log(`   - Active ads: ${processedAds.filter(ad => ad.is_active).length}`);
        console.log(`   - Platforms: ${[...new Set(processedAds.flatMap(ad => ad.platforms))].join(', ')}`);

        return processedAds;

    } catch (error) {
        console.error('❌ Error scraping Meta Ads:', error.message);
        throw error;
    }
}

// Run the scraper if called directly
if (require.main === module) {
    const pageId = process.argv[2] || '8301814001'; // YU Page ID
    const limit = parseInt(process.argv[3]) || 20;

    scrapeMetaAds(pageId, limit)
        .then(() => {
            console.log('\n🎉 Scraping completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMetaAds };
