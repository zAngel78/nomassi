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
 * Scrape Meta Ads Library - IMPROVED VERSION 2025
 */
async function scrapeMetaAdsImproved(searchQuery = 'Yeshiva University', limit = 25) {
    console.log(`🔍 Starting IMPROVED Meta Ads Library scrape for: "${searchQuery}"...`);

    let browser;
    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Set to false to see what's happening
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ]
        });

        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to Meta Ads Library with search query
        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(searchQuery)}&search_type=keyword_unordered&media_type=all`;
        console.log(`📱 Navigating to Meta Ads Library...`);
        console.log(`URL: ${url}`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait for initial content
        console.log('⏳ Waiting for ads to load...');
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Take screenshot for debugging
        const screenshotPath = path.join(__dirname, 'public', 'meta_ads_data', 'debug_screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved to: ${screenshotPath}`);

        // Scroll to load more ads
        console.log('📜 Scrolling to load more ads...');
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log(`  Scroll ${i + 1}/5...`);
        }

        // Debug: Check what's on the page
        console.log('\n🔍 Analyzing page structure...');
        const pageInfo = await page.evaluate(() => {
            // Try multiple possible selectors
            const selectors = [
                '[data-pagelet^="AdCard"]',
                '[data-testid*="ad"]',
                '[aria-label*="Ad"]',
                'div[role="article"]',
                'div[data-ad-preview="message"]',
                'div._7jyr', // Old selector
                'div.x1yztbdb', // Potential new selector
            ];

            const results = {};
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                results[selector] = elements.length;
            });

            // Get all images
            const images = document.querySelectorAll('img');
            results['total_images'] = images.length;

            // Get all divs
            const divs = document.querySelectorAll('div');
            results['total_divs'] = divs.length;

            // Try to find "Started running" text
            const bodyText = document.body.innerText;
            results['has_started_running'] = bodyText.includes('Started running');
            results['has_impressions'] = bodyText.includes('impressions') || bodyText.includes('Impressions');

            return results;
        });

        console.log('Page analysis:');
        console.log(JSON.stringify(pageInfo, null, 2));

        // Extract ads using multiple strategies
        console.log('\n📥 Extracting ads using flexible selectors...');
        const ads = await page.evaluate(() => {
            const results = [];

            // Strategy 1: Use the selectors that WORK (from page analysis)
            // Try multiple selectors and combine results
            const selectors = [
                '[data-testid*="ad"]',
                'div._7jyr',
                'div.x1yztbdb'
            ];

            let adsContainers = [];
            for (const selector of selectors) {
                const elements = Array.from(document.querySelectorAll(selector));
                console.log(`Selector "${selector}" found ${elements.length} elements`);

                // Filter to get unique containers with substantial content
                elements.forEach(el => {
                    const text = el.innerText || '';
                    // Must have images or text longer than 30 chars
                    const hasImage = el.querySelector('img');
                    if ((text.length > 30 || hasImage) && !adsContainers.includes(el)) {
                        adsContainers.push(el);
                    }
                });
            }

            console.log(`Found ${adsContainers.length} potential ad containers after deduplication`);

            adsContainers.forEach((container, index) => {
                try {
                    const fullText = container.innerText || '';

                    // Extract all text
                    const lines = fullText.split('\n').filter(line => line.trim());

                    // Find start date (support English and Spanish)
                    let startDate = '';
                    const startDateLine = lines.find(line =>
                        line.includes('Started running on') ||
                        line.includes('Comenzó a publicarse el') ||
                        line.includes('Started running') ||
                        line.match(/\w+ \d+, \d{4}/) // e.g., "Oct 17, 2024"
                    );
                    if (startDateLine) {
                        startDate = startDateLine
                            .replace('Started running on ', '')
                            .replace('Comenzó a publicarse el ', '')
                            .replace('Started running', '')
                            .trim();
                    }

                    // Find impressions/reach/spend (support English and Spanish)
                    let impressions = 'N/A';
                    let reach = 'N/A';
                    let spend = 'N/A';

                    // Look for spend (usually shown with $ or currency)
                    const spendLine = lines.find(line => line.match(/\$[\d,]+/));
                    if (spendLine) {
                        const spendMatch = spendLine.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/);
                        spend = spendMatch ? spendMatch[0] : 'N/A';
                    }

                    // Look for impressions (format: "500K impressions" or "1M-2M impressions")
                    const impressionLine = lines.find(line =>
                        line.match(/[\d,.]+[KMB]?\s*[-–]?\s*[\d,.]+[KMB]?\s*(impressions?|impresiones)/i)
                    );
                    if (impressionLine) {
                        const match = impressionLine.match(/[\d,.]+[KMB]?\s*[-–]?\s*[\d,.]+[KMB]?\s*impressions?/i);
                        impressions = match ? match[0] : impressionLine.trim();
                    }

                    // Look for reach (format: "50K-100K people reached")
                    const reachLine = lines.find(line =>
                        line.match(/[\d,.]+[KMB]?\s*[-–]?\s*[\d,.]+[KMB]?\s*(people reached|reached|personas alcanzadas)/i)
                    );
                    if (reachLine) {
                        const match = reachLine.match(/[\d,.]+[KMB]?\s*[-–]?\s*[\d,.]+[KMB]?\s*people reached/i);
                        reach = match ? match[0] : reachLine.trim();
                    }

                    // Extract images from this container
                    const images = container.querySelectorAll('img');
                    const imageUrls = Array.from(images)
                        .map(img => img.src)
                        .filter(src => src && src.startsWith('http') && !src.includes('emoji') && !src.includes('static_'))
                        .filter((src, idx, arr) => arr.indexOf(src) === idx); // Remove duplicates

                    // Get ad body text (filter out navigation/meta text)
                    const allText = fullText.split('\n').filter(line => {
                        const l = line.trim().toLowerCase();
                        // Skip meta text
                        if (l.includes('facebook') && l.includes('instagram')) return false;
                        if (l.includes('started running')) return false;
                        if (l.includes('see ad details')) return false;
                        if (l.includes('report ad')) return false;
                        if (l.length < 10 || l.length > 500) return false;
                        return true;
                    });

                    const bodyText = allText.length > 0 ? allText.join(' ').substring(0, 300) : fullText.substring(0, 200);

                    // Extract platforms (look for Facebook/Instagram icons/text)
                    const platforms = [];
                    if (fullText.includes('Facebook') || container.querySelector('[alt*="Facebook"]')) {
                        platforms.push('Facebook');
                    }
                    if (fullText.includes('Instagram') || container.querySelector('[alt*="Instagram"]')) {
                        platforms.push('Instagram');
                    }

                    // Only add if we have meaningful content
                    if (imageUrls.length > 0 || (bodyText && bodyText.length > 15)) {
                        results.push({
                            id: `ad_${Date.now()}_${index}`,
                            text: bodyText,
                            full_text: fullText.substring(0, 500), // First 500 chars for debug
                            image_url: imageUrls[0] || '',
                            all_images: imageUrls,
                            start_date: startDate,
                            impressions: impressions,
                            reach: reach,
                            spend: spend,
                            platforms: platforms.length > 0 ? platforms : ['Facebook'], // Default to Facebook
                            is_active: true
                        });

                        console.log(`Ad ${index + 1}: ${bodyText.substring(0, 50)}... | Spend: ${spend} | Reach: ${reach}`);
                    }
                } catch (err) {
                    console.error('Error extracting ad:', err);
                }
            });

            return results;
        });

        console.log(`✅ Successfully extracted ${ads.length} ads`);

        // Debug: Save full text of first 3 ads to file
        if (ads.length > 0) {
            const debugData = ads.slice(0, 3).map((ad, i) => ({
                ad_number: i + 1,
                full_text_lines: ad.full_text.split('\n'),
                extracted_spend: ad.spend,
                extracted_reach: ad.reach,
                extracted_impressions: ad.impressions,
                extracted_platforms: ad.platforms
            }));
            const debugPath = path.join(__dirname, 'public', 'meta_ads_data', 'debug_extraction.json');
            fs.writeFileSync(debugPath, JSON.stringify(debugData, null, 2));
            console.log(`\n📝 Debug info saved to: ${debugPath}`);
        }

        if (ads.length === 0) {
            console.log('\n⚠️  NO ADS FOUND. Saving page HTML for manual inspection...');
            const htmlContent = await page.content();
            const htmlPath = path.join(__dirname, 'public', 'meta_ads_data', 'debug_page.html');
            fs.writeFileSync(htmlPath, htmlContent);
            console.log(`📄 HTML saved to: ${htmlPath}`);
        } else {
            // Show first ad as sample
            console.log('\n📋 Sample ad (first result):');
            console.log(JSON.stringify(ads[0], null, 2));
        }

        // Close browser
        await browser.close();

        // Process ads if we found any
        if (ads.length > 0) {
            const outputDir = path.join(__dirname, 'public', 'meta_ads_data');
            const imagesDir = path.join(outputDir, 'yeshiva_university', 'images');
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }

            console.log('\n📸 Downloading ad images...');

            const processedAds = await Promise.all(ads.slice(0, limit).map(async (ad, index) => {
                let localImagePath = '';

                if (ad.image_url && ad.image_url.startsWith('http')) {
                    const imageExt = 'jpg';
                    const imageName = `improved_${index}_${Date.now()}.${imageExt}`;
                    const imagePath = path.join(imagesDir, imageName);

                    try {
                        await downloadImage(ad.image_url, imagePath);
                        localImagePath = `/api/files/meta_ads_data/yeshiva_university/images/${imageName}`;
                        console.log(`  ✓ Downloaded image ${index + 1}/${ads.length}`);
                    } catch (err) {
                        console.log(`  ✗ Failed to download image ${index + 1}: ${err.message}`);
                        localImagePath = ad.image_url;
                    }
                }

                return {
                    id: ad.id,
                    university: 'Yeshiva University',
                    title: '',
                    body: ad.text,
                    link_description: '',
                    image_url: localImagePath,
                    original_image_url: ad.image_url,
                    video_url: null,
                    start_date: ad.start_date,
                    end_date: '',
                    platforms: ad.platforms,
                    is_active: ad.is_active,
                    page_name: 'Yeshiva University',
                    ad_url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(searchQuery)}`,
                    spend: ad.spend || 'N/A',
                    reach_estimate: ad.reach || 'N/A',
                    impressions: ad.impressions || 'N/A',
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

            return processedAds;
        }

        return [];

    } catch (error) {
        console.error('❌ Error scraping Meta Ads:', error.message);
        if (browser) await browser.close();
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    const searchQuery = process.argv[2] || 'Yeshiva University';
    const limit = parseInt(process.argv[3]) || 25;

    scrapeMetaAdsImproved(searchQuery, limit)
        .then((ads) => {
            if (ads && ads.length > 0) {
                console.log('\n🎉 Scraping completed successfully!');
            } else {
                console.log('\n⚠️  Scraping completed but no ads found. Check debug files.');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMetaAdsImproved };
