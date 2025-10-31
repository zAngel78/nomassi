# Meta Ads Collection Guide

## 🎯 Objective
Collect digital advertising data from all competitor universities (NYU, Brandeis, Columbia, Touro) to compare with Yeshiva University's ad strategy.

## 📊 What We've Created

### 1. **meta_ads_research_links.json**
- Direct links to Meta Ad Library for each university
- 13 total links (page ads + search queries)
- Organized by university

### 2. **google_ads_research_links.json**
- Links to Google Ads Transparency Center
- 5 university searches
- View Google Search & Display ads

### 3. **meta_ads_data_template.json**
- Structured template to organize collected ad data
- Fields for:
  - Ad text/copy
  - Images/videos
  - Call-to-action
  - Targeting info (age, location, interests)
  - Start date
  - Platforms (Facebook/Instagram)

### 4. **meta_ads_collection_guide.html**
- Beautiful visual guide with all links
- Step-by-step instructions
- One-click access to all ad libraries
- **Open this in your browser for easy access!**

## 🚀 Quick Start

### Method 1: Visual HTML Guide (Recommended)
```bash
# Open in your browser:
yu-research-backend/public/meta_ads_collection_guide.html
```
Click the buttons to visit each ad library!

### Method 2: Direct JSON Access
```bash
# View the JSON files:
yu-research-backend/public/meta_ads_research_links.json
yu-research-backend/public/google_ads_research_links.json
```

## 📝 How to Collect Ad Data

### Step-by-Step Process:

1. **Open the HTML Guide**
   - `public/meta_ads_collection_guide.html`
   - Beautiful interface with all links

2. **Click "Open in Meta" for each university**
   - Yeshiva University (baseline)
   - NYU
   - Brandeis
   - Columbia
   - Touro

3. **For Each Ad You Find:**
   - Copy the ad text
   - Screenshot the image/video
   - Note the call-to-action button
   - Check "Started Running" date
   - See which platforms (Facebook/Instagram)
   - Look at targeting (if available)

4. **Fill in the Template**
   - Open `meta_ads_data_template.json`
   - Add each ad under the correct university
   - Follow the example structure

## 🔍 What to Look For

### Key Metrics to Collect:
- ✅ **Ad Copy**: What message are they using?
- ✅ **Visuals**: Photos, videos, graphics
- ✅ **CTA**: Learn More, Apply Now, Schedule Visit?
- ✅ **Timing**: How long have ads been running?
- ✅ **Platforms**: Facebook only or Instagram too?
- ✅ **Targeting**: Age, location, interests (if visible)

### Competitive Analysis Questions:
- Which universities are running the most ads?
- What themes/messages are common?
- Are they focusing on specific programs?
- What visual styles do they use?
- How aggressive is their ad spend?
- What CTAs convert best?

## 📦 Generated Files

```
yu-research-backend/public/
├── meta_ads_research_links.json       # Meta Ad Library links
├── google_ads_research_links.json     # Google Ads links
├── meta_ads_data_template.json        # Template for collected data
└── meta_ads_collection_guide.html     # Visual guide (open in browser!)
```

## 🌐 Platforms Covered

### Meta Ad Library (Facebook/Instagram)
- **100% Public & Legal**
- Shows all active ads from any Facebook page
- Required by law for transparency
- No API needed, just visit the links
- May require CAPTCHA verification

**Direct Links:**
- Yeshiva: https://www.facebook.com/ads/library/?search_type=page&page_ids=YeshivaUniversity
- NYU: https://www.facebook.com/ads/library/?search_type=page&page_ids=NYU
- Brandeis: https://www.facebook.com/ads/library/?search_type=page&page_ids=BrandeisUniversity
- Columbia: https://www.facebook.com/ads/library/?search_type=page&page_ids=columbia
- Touro: https://www.facebook.com/ads/library/?search_type=page&page_ids=TouroCollege

### Google Ads Transparency Center
- **100% Public & Legal**
- Shows Google Search & Display ads
- Advertiser verification data
- No API needed

**Direct Links:**
- Yeshiva: https://adstransparency.google.com/?search=Yeshiva%20University
- NYU: https://adstransparency.google.com/?search=New%20York%20University
- Brandeis: https://adstransparency.google.com/?search=Brandeis%20University
- Columbia: https://adstransparency.google.com/?search=Columbia%20University
- Touro: https://adstransparency.google.com/?search=Touro%20University

## ⚠️ Important Notes

### Why Manual Collection?
- Both Meta and Google require **human verification (CAPTCHA)**
- Automated scraping is blocked for good reason
- Manual is faster and more reliable for this use case
- You get better context and understanding

### Is This Legal?
- ✅ **YES - 100% Legal**
- Meta Ad Library is **required by law** for transparency
- Google Ads Transparency is a public initiative
- You're collecting publicly available information
- No hacking, no private data, no violations

### Time Estimate:
- ~5-10 minutes per university
- ~30-45 minutes total for all universities
- Faster if you focus on top ads only

## 💡 Pro Tips

1. **Start with "Page Ads" links** - Shows all ads from official page
2. **Use search links** if page name is incorrect
3. **Screenshot everything** - Visual reference is valuable
4. **Note patterns** - Common themes across competitors?
5. **Track ad duration** - Long-running ads = successful ads
6. **Check multiple times** - Ads change, collect over time

## 🎓 Universities Included

1. **Yeshiva University** (@YeshivaUniversity)
2. **New York University** (@NYU)
3. **Brandeis University** (@BrandeisUniversity)
4. **Columbia University** (@columbia)
5. **Touro University** (@TouroCollege)

## 📊 Next Steps After Collection

1. **Analyze Patterns**: What strategies work?
2. **Compare Messaging**: How does YU compare?
3. **Identify Gaps**: What is YU missing?
4. **Generate Insights**: Recommendations for YU
5. **Create Report**: Add to research dashboard

## 🔄 Re-run the Script

To regenerate links (if Facebook pages change):
```bash
cd yu-research-backend
npm run scrape:meta-ads
```

## 📞 Questions?

The script generates:
- ✅ 13 Meta Ad Library links
- ✅ 5 Google Ads links
- ✅ 1 beautiful HTML guide
- ✅ 1 data collection template

**Everything is ready to go!**

---

**Happy Ad Hunting! 🎯**

