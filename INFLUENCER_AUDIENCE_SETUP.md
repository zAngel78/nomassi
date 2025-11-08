# Influencer Audience Email Finder - Setup Guide

## Overview
This feature allows you to scrape followers from Instagram or TikTok influencers and extract public emails from their bios.

## Setup Instructions

### 1. Create Apify Account
1. Go to [apify.com](https://apify.com)
2. Sign up for a free account (no credit card required)
3. You get **$5 free credits every month**

### 2. Get Your API Token
1. Log into Apify dashboard
2. Go to Settings → Integrations
3. Copy your **API Token**

### 3. Add Token to Backend

**Option A: Environment Variable (Recommended)**
```bash
# On Windows (PowerShell)
$env:APIFY_TOKEN="your_token_here"

# On Mac/Linux
export APIFY_TOKEN="your_token_here"
```

**Option B: Edit server.js**
Open `server.js` and replace line 364:
```javascript
const apifyToken = process.env.APIFY_TOKEN || 'YOUR_APIFY_TOKEN_HERE';
```
With:
```javascript
const apifyToken = process.env.APIFY_TOKEN || 'apify_api_PASTE_YOUR_TOKEN_HERE';
```

### 4. Start Backend Server
```bash
cd yu-research-backend
node server.js
```

### 5. Access the Tool
Open: `http://localhost:3001/influencer-audience.html`

## How to Use

1. **Select Platform**: Choose Instagram or TikTok
2. **Enter Username**: Type influencer username (with or without @)
3. **Click "Analyze Audience"**
4. **Wait**: Processing takes 1-3 minutes depending on follower count
5. **View Results**: See followers with public emails
6. **Export CSV**: Download the results

## Pricing

### Apify Costs:
- **Free Tier**: $5/month credit (renews automatically)
- **Instagram**: $0.10 per 1,000 followers analyzed
- **TikTok**: $0.30 per 1,000 followers analyzed

### Examples:
- Analyze 5,000 Instagram followers = $0.50
- Analyze 10,000 TikTok followers = $3.00
- With $5 free credit, you can analyze:
  - **50,000 Instagram followers/month** OR
  - **16,000 TikTok followers/month**

## What Data is Collected

### For Each Follower:
- ✅ Username
- ✅ Full Name
- ✅ Email (if public in bio)
- ✅ Follower count
- ✅ Biography
- ✅ Profile picture
- ✅ Profile URL
- ✅ Verified status

### Success Rate:
- Typically **10-15% of followers** have public emails in their bio
- Example: 1,000 followers → ~100-150 emails

## Legal & Ethical Considerations

✅ **Legal**:
- Only scrapes publicly available information
- Complies with Apify's terms of service
- No authentication bypass or private data access

⚠️ **Best Practices**:
- Use for legitimate business purposes only
- Respect user privacy
- Don't spam collected emails
- Consider GDPR/CAN-SPAM compliance

## Troubleshooting

### Error: "Failed to scrape influencer data"
- Check your Apify API token is correct
- Verify you have remaining credits
- Ensure influencer profile is public

### Error: "Make sure you have set up your Apify API token"
- You haven't added your API token
- Follow Step 3 above

### No emails found
- Only 10-15% of users put emails in bio
- Try influencers with more business-focused audiences
- Results vary by niche and platform

### Slow processing
- Normal for large audiences (1-3 minutes)
- Instagram is faster than TikTok
- Consider reducing `resultsLimit` in server.js (line 376)

## API Endpoint Details

**Endpoint**: `POST /api/scrape-influencer`

**Request Body**:
```json
{
  "username": "charlidamelio",
  "platform": "instagram"
}
```

**Response**:
```json
{
  "totalFollowers": 1000,
  "analyzedCount": 1000,
  "emailsFound": 127,
  "successRate": 13,
  "followers": [
    {
      "username": "johndoe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "follower_count": 5420,
      "biography": "CEO | Contact: john@example.com",
      "profile_pic_url": "...",
      "profile_url": "...",
      "is_verified": false
    }
  ]
}
```

## Features

- ✅ Instagram & TikTok support
- ✅ Email extraction from bios (regex-based)
- ✅ Export to CSV
- ✅ Real-time statistics
- ✅ Professional UI with dark/light mode
- ✅ Mobile responsive
- ✅ Error handling

## Future Enhancements

Potential features to add:
- [ ] LinkedIn/Twitter integration
- [ ] Email verification (check if email is valid)
- [ ] Cross-platform matching (find same user on multiple platforms)
- [ ] Bulk processing (multiple influencers at once)
- [ ] Historical tracking (track follower growth over time)
- [ ] Advanced filtering (by follower count, location, etc.)

## Support

For issues or questions:
1. Check Apify documentation: https://docs.apify.com
2. Review server.js logs for error details
3. Verify API token and credits

## Credits

Built with:
- **Apify**: Social media scraping infrastructure
- **Express.js**: Backend API
- **Vanilla JS**: Frontend interface
