# Instagram Scraper - Setup Guide

## 🚀 Quick Start

### 1. Get Apify API Token (FREE)

1. Go to https://console.apify.com/sign-up
2. Sign up (it's free - includes $5 credit)
3. Go to Settings → Integrations
4. Copy your API token

### 2. Set Your API Token

**Option A: Environment Variable (Recommended)**
```bash
# Windows PowerShell
$env:APIFY_TOKEN="your_token_here"

# Windows CMD
set APIFY_TOKEN=your_token_here
```

**Option B: Edit scraper.js**
Open `scraper.js` and replace:
```javascript
token: process.env.APIFY_TOKEN || 'YOUR_APIFY_TOKEN_HERE',
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Scraper

**Scrape only Yeshiva University (50 posts):**
```bash
npm run scrape:yu
```

**Scrape all universities (YU, NYU, Columbia, Rutgers, Brandeis):**
```bash
npm run scrape:all
```

**Scrape custom profile:**
```bash
npm run scrape [username] [number_of_posts]
# Example:
npm run scrape yeshiva_university 100
```

## 📁 Output

Data will be saved to:
- `public/instagram_data/yeshiva_university_posts.json`
- `public/instagram_data/all_universities.json`

## 🌐 API Endpoints

Once data is scraped, access it via:

```
GET http://localhost:3001/api/instagram/yeshiva_university
GET http://localhost:3001/api/instagram/nyuniversity
GET http://localhost:3001/api/instagram (all universities)
```

## 📊 Data Structure

Each post includes:
```json
{
  "id": "post_123",
  "university": "Yeshiva University",
  "caption": "Welcome Week 2024! 🎓",
  "image_url": "https://...",
  "video_url": null,
  "likes": 234,
  "comments": 12,
  "date": "2024-10-15T10:30:00.000Z",
  "post_type": "image",
  "url": "https://instagram.com/p/...",
  "hashtags": ["#yu", "#welcomeweek"],
  "engagement_rate": "1.64"
}
```

## 💰 Cost

- Apify free tier: $5 credit
- Instagram scraper cost: ~$0.10-0.25 per 50 posts
- You can scrape ~200-500 posts for free

## ⚠️ Important Notes

1. **Rate Limiting**: Script waits 2 seconds between profiles
2. **Public Data Only**: Only scrapes public posts
3. **No Login Required**: Works without Instagram account
4. **Legal**: Uses official Apify actor (compliant with ToS)

## 🔄 Update Data

Run the scraper weekly/monthly to keep data fresh:
```bash
npm run scrape:all
```

## 🐛 Troubleshooting

**Error: "Invalid token"**
- Make sure you set your Apify token correctly
- Check https://console.apify.com/account/integrations

**Error: "Actor not found"**
- Check your internet connection
- Verify Apify account is active

**No data returned**
- Instagram profile might be private
- Username might be incorrect
- Try with a smaller number of posts first

## 📞 Support

For issues, check:
- Apify Console: https://console.apify.com/
- Apify Docs: https://docs.apify.com/
