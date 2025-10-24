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
 * Scrape Meta Ads Library with RICH OUTPUT (includes Reach & Impressions)
 * Using memo23/facebook-ads-library-scraper-cheerio - Best for metrics
 */
async function scrapeMetaAdsRich(searchQuery = 'Yeshiva University', resultsLimit = 25) {
    console.log(`🔍 Starting RICH Meta Ads Library scrape for: "${searchQuery}"...`);
    console.log(`📊 Using Apify actor: memo23/facebook-ads-library-scraper-cheerio (Richest Output)`);

    try {
        // Prepare Actor input - this actor needs startUrls format
        const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(searchQuery)}&search_type=keyword_unordered&media_type=all`;

        const input = {
            startUrls: [adsLibraryUrl],
            maxItems: resultsLimit,
            scrapeAdDetails: true, // Enable to get reach/impressions
        };

        console.log(`📎 URL: ${adsLibraryUrl}`);

        // Run the Actor and wait for it to finish
        console.log('⏳ Running Apify scraper (this may take 30-60 seconds)...');
        const run = await client.actor("memo23/facebook-ads-library-scraper-cheerio").call(input);

        // Fetch results from the run's dataset
        console.log('📥 Fetching results...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`✅ Successfully scraped ${items.length} ads`);

        // Debug: Show first ad structure to understand data format
        if (items.length > 0) {
            console.log('\n📋 Sample ad structure (first result):');
            console.log(JSON.stringify(items[0], null, 2));
        }

        // Create directories
        const outputDir = path.join(__dirname, 'public', 'meta_ads_data');
        const imagesDir = path.join(outputDir, 'yeshiva_university', 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        console.log('\n📸 Downloading ad images...');

        // Process and format the data
        const processedAds = await Promise.all(items.slice(0, resultsLimit).map(async (ad, index) => {
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

            if (originalImageUrl && originalImageUrl.startsWith('http')) {
                const imageExt = 'jpg';
                const imageName = `apify_rich_${ad.ad_archive_id || index}_${Date.now()}.${imageExt}`;
                const imagePath = path.join(imagesDir, imageName);

                try {
                    await downloadImage(originalImageUrl, imagePath);
                    localImagePath = `/api/files/meta_ads_data/yeshiva_university/images/${imageName}`;
                    console.log(`  ✓ Downloaded image ${index + 1}/${items.length}`);
                } catch (err) {
                    console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
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
                university: 'Yeshiva University',
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
                page_name: ad.page_name || ad.pageName || 'Yeshiva University',
                ad_url: ad.ad_archive_id
                    ? `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`
                    : `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(searchQuery)}`,
                spend: spend,
                reach_estimate: reach,
                impressions: impressions,
            };
        }));

        // Save to JSON
        const outputFile = path.join(outputDir, 'yeshiva_university_ads.json');
        fs.writeFileSync(outputFile, JSON.stringify(processedAds, null, 2));

        console.log(`\n💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total ads: ${processedAds.length}`);
        console.log(`   - Active ads: ${processedAds.filter(ad => ad.is_active).length}`);
        console.log(`   - Platforms: ${[...new Set(processedAds.flatMap(ad => ad.platforms))].join(', ')}`);
        console.log(`   - Ads with Reach data: ${processedAds.filter(ad => ad.reach_estimate !== 'N/A').length}`);
        console.log(`   - Ads with Impressions data: ${processedAds.filter(ad => ad.impressions !== 'N/A').length}`);
        console.log(`   - Ads with Spend data: ${processedAds.filter(ad => ad.spend !== 'N/A').length}`);

        return processedAds;

    } catch (error) {
        console.error('❌ Error scraping Meta Ads:', error.message);

        if (error.message.includes('404')) {
            console.error('\n⚠️  Actor not found. Trying alternative actor...');
            console.error('   Falling back to: apify/facebook-ads-scraper');

            // Fallback to official Apify actor
            try {
                const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(searchQuery)}`;
                const fallbackInput = {
                    startUrls: [{ url: adsLibraryUrl }],
                    maxItems: resultsLimit,
                };

                const run = await client.actor("apify/facebook-ads-scraper").call(fallbackInput);
                const { items } = await client.dataset(run.defaultDatasetId).listItems();

                console.log(`✅ Fallback scraper found ${items.length} ads`);
                console.log('⚠️  Note: Fallback scraper may have limited metrics data');

                // Process with fallback
                const processedAds = items.map((ad, index) => ({
                    id: ad.adArchiveID || `ad_${index}`,
                    university: 'Yeshiva University',
                    title: '',
                    body: ad.snapshot?.body?.text || '',
                    link_description: ad.snapshot?.linkDescription || '',
                    image_url: ad.snapshot?.images?.[0] || '',
                    original_image_url: ad.snapshot?.images?.[0] || '',
                    video_url: null,
                    start_date: ad.startDateFormatted || new Date().toISOString(),
                    end_date: ad.endDateFormatted || '',
                    platforms: ad.publisherPlatform || ['Facebook'],
                    is_active: ad.isActive || false,
                    page_name: ad.pageName || 'Yeshiva University',
                    ad_url: ad.adArchiveID ? `https://www.facebook.com/ads/library/?id=${ad.adArchiveID}` : '',
                    spend: 'N/A',
                    reach_estimate: 'N/A',
                    impressions: ad.impressionsWithIndex?.impressionsText || 'N/A',
                }));

                const outputDir = path.join(__dirname, 'public', 'meta_ads_data');
                const outputFile = path.join(outputDir, 'yeshiva_university_ads.json');
                fs.writeFileSync(outputFile, JSON.stringify(processedAds, null, 2));

                return processedAds;
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError.message);
                throw fallbackError;
            }
        }

        throw error;
    }
}

// Run the scraper if called directly
if (require.main === module) {
    const searchQuery = process.argv[2] || 'Yeshiva University';
    const limit = parseInt(process.argv[3]) || 25;

    scrapeMetaAdsRich(searchQuery, limit)
        .then(() => {
            console.log('\n🎉 Scraping completed successfully!');
            console.log('\n💡 Tip: Check if reach/impressions data is available.');
            console.log('   If all show N/A, Meta may restrict this data for commercial ads.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMetaAdsRich };
