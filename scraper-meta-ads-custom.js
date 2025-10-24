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
 * Scrape Meta Ads Library with Puppeteer
 */
async function scrapeMetaAdsCustom(pageId, limit = 20) {
    console.log(`🔍 Starting Meta Ads Library scrape for page ID: ${pageId}...`);
    
    let browser;
    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate to Meta Ads Library
        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=${pageId}`;
        console.log(`📱 Navigating to ${url}...`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        // Wait for ads to load
        console.log('⏳ Waiting for ads to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Scroll to load more ads
        console.log('📜 Scrolling to load ads...');
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`  Scroll ${i + 1}/5...`);
        }
        
        // Extract ads
        console.log('📥 Extracting ads...');
        const ads = await page.evaluate(() => {
            const adElements = document.querySelectorAll('[data-pagelet^="AdCard"]');
            const results = [];
            
            adElements.forEach((adCard, index) => {
                try {
                    // Extract text content
                    const textElement = adCard.querySelector('[class*="xdj266r"]');
                    const text = textElement ? textElement.innerText : '';
                    
                    // Extract image
                    const imgElement = adCard.querySelector('img');
                    const imageUrl = imgElement ? imgElement.src : '';
                    
                    // Extract spend/reach info
                    const infoElements = adCard.querySelectorAll('[class*="x193iq5w"]');
                    let spend = 'N/A';
                    let reach = 'N/A';
                    let impressions = 'N/A';
                    
                    infoElements.forEach(el => {
                        const text = el.innerText;
                        if (text.includes('$')) spend = text;
                        if (text.includes('K') || text.includes('M')) {
                            if (!reach.includes('K') && !reach.includes('M')) {
                                reach = text;
                            } else {
                                impressions = text;
                            }
                        }
                    });
                    
                    // Extract platforms
                    const platformElements = adCard.querySelectorAll('[alt*="Facebook"], [alt*="Instagram"]');
                    const platforms = [];
                    platformElements.forEach(el => {
                        const alt = el.getAttribute('alt');
                        if (alt && !platforms.includes(alt)) platforms.push(alt);
                    });
                    
                    // Extract dates
                    const dateElements = adCard.querySelectorAll('[class*="x1lliihq"]');
                    let startDate = '';
                    let endDate = '';
                    dateElements.forEach(el => {
                        const text = el.innerText;
                        if (text.includes('Started running on')) {
                            startDate = text.replace('Started running on ', '');
                        }
                        if (text.includes('Stopped running on')) {
                            endDate = text.replace('Stopped running on ', '');
                        }
                    });
                    
                    results.push({
                        id: `ad_${index}`,
                        text: text,
                        image_url: imageUrl,
                        spend: spend,
                        reach: reach,
                        impressions: impressions,
                        platforms: platforms,
                        start_date: startDate,
                        end_date: endDate,
                        is_active: !endDate || endDate === ''
                    });
                } catch (err) {
                    console.error('Error extracting ad:', err);
                }
            });
            
            return results;
        });
        
        console.log(`✅ Successfully scraped ${ads.length} ads`);
        
        // Close browser
        await browser.close();
        
        // Create directories
        const outputDir = path.join(__dirname, 'public', 'meta_ads_data');
        const imagesDir = path.join(outputDir, 'yeshiva_university', 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        console.log('📸 Downloading ad images...');
        
        // Process ads and download images
        const processedAds = await Promise.all(ads.slice(0, limit).map(async (ad, index) => {
            let localImagePath = '';
            
            if (ad.image_url && ad.image_url.startsWith('http')) {
                const imageExt = 'jpg';
                const imageName = `custom_${index}.${imageExt}`;
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
                end_date: ad.end_date,
                platforms: ad.platforms,
                is_active: ad.is_active,
                page_name: 'Yeshiva University',
                ad_url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=${pageId}`,
                spend: ad.spend,
                reach_estimate: ad.reach,
                impressions: ad.impressions,
            };
        }));
        
        // Save to JSON
        const outputFile = path.join(outputDir, 'yeshiva_university_ads.json');
        fs.writeFileSync(outputFile, JSON.stringify(processedAds, null, 2));
        
        console.log(`💾 Data saved to: ${outputFile}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total ads: ${processedAds.length}`);
        console.log(`   - Active ads: ${processedAds.filter(ad => ad.is_active).length}`);
        
        return processedAds;
        
    } catch (error) {
        console.error('❌ Error scraping Meta Ads:', error.message);
        if (browser) await browser.close();
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    const pageId = process.argv[2] || '8301814001';
    const limit = parseInt(process.argv[3]) || 20;
    
    scrapeMetaAdsCustom(pageId, limit)
        .then(() => {
            console.log('\n🎉 Scraping completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMetaAdsCustom };
