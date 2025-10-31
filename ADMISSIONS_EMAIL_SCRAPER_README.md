# 📧 Admissions Email OSINT Scraper

## ⚖️ Legal & Ethical Notice

This script uses **OSINT (Open Source Intelligence)** methods to collect **publicly available** contact information from university websites. 

- ✅ **Legal**: Only scrapes public pages
- ✅ **Ethical**: Respects rate limits and robots.txt
- ✅ **Transparent**: No hidden data access
- ❌ **NOT hacking**: No unauthorized access to private systems

---

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install requests beautifulsoup4 lxml
```

### 2. Run the Scraper

```bash
# Using npm script (recommended)
npm run scrape:admissions-emails

# Or directly with Python
python scrape_admissions_emails.py
```

### 3. Check Results

Results will be saved to: `public/admissions_emails.json`

---

## 📊 What It Does

1. **Searches public admissions pages** for each university:
   - `/admissions`
   - `/undergraduate-admissions`
   - `/graduate-admissions`
   - `/contact`
   - And more...

2. **Extracts emails** from:
   - Visible text on pages
   - `mailto:` links
   - Meta tags
   - Contact forms

3. **Categorizes emails**:
   - General Admissions
   - Undergraduate
   - Graduate
   - Other

4. **Filters results**: Only includes emails from official university domains (`.edu`)

---

## 🎯 Target Universities

- **Yeshiva University** (`yu.edu`)
- **New York University** (`nyu.edu`)
- **Brandeis University** (`brandeis.edu`)
- **Columbia University** (`columbia.edu`)
- **Touro University** (`touro.edu`)

---

## 📁 Output Format

```json
{
  "timestamp": "2024-01-15 10:30:00",
  "method": "OSINT - Public Web Scraping",
  "universities": [
    {
      "university": "Yeshiva University",
      "domain": "yu.edu",
      "base_url": "https://www.yu.edu",
      "emails": {
        "general_admissions": ["admissions@yu.edu"],
        "undergraduate": ["yuadmit@yu.edu"],
        "graduate": ["gradadmissions@yu.edu"],
        "other": []
      },
      "total_found": 3,
      "all_emails": [...]
    }
  ],
  "total_universities": 5,
  "total_emails": 25
}
```

---

## ⚙️ Configuration

Edit the `universities` array in `scrape_admissions_emails.py` to add more universities:

```python
universities = [
    {
        'name': 'Your University',
        'domain': 'university.edu',
        'base_url': 'https://www.university.edu'
    }
]
```

---

## 🛡️ Rate Limiting & Politeness

- ✅ 1 second delay between requests
- ✅ Proper User-Agent header
- ✅ Respects HTTP errors
- ✅ Limited to 10 pages per university

---

## 🐛 Troubleshooting

### Error: Module not found
```bash
pip install requests beautifulsoup4 lxml
```

### Error: Permission denied
```bash
# Run as administrator or use:
pip install --user requests beautifulsoup4 lxml
```

### No emails found
- Some universities hide emails behind forms
- Check if the website structure changed
- Manually verify on the university's website

---

## 📝 Notes

- Results may vary based on website structure changes
- Some universities may use contact forms instead of direct emails
- This tool only finds **publicly visible** contact information
- Always verify emails before use

---

## 🔄 Next Steps

1. Review `public/admissions_emails.json`
2. Manually verify important contacts
3. Integrate with your dashboard/backend
4. Set up periodic updates (weekly/monthly)

---

**Created for YU Research Project**

