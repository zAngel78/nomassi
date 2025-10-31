#!/usr/bin/env python3
"""
Meta Ad Library Scraper
Extrae anuncios activos de universidades desde Facebook Ad Library
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime

# Configuración de universidades
UNIVERSITIES = {
    "yu": {
        "name": "Yeshiva University",
        "search_terms": ["Yeshiva University", "YU"],
        "facebook_page": "YeshivaUniversity"
    },
    "nyu": {
        "name": "New York University",
        "search_terms": ["New York University", "NYU"],
        "facebook_page": "NYU"
    },
    "brandeis": {
        "name": "Brandeis University",
        "search_terms": ["Brandeis University"],
        "facebook_page": "BrandeisUniversity"
    },
    "columbia": {
        "name": "Columbia University",
        "search_terms": ["Columbia University"],
        "facebook_page": "columbia"
    },
    "touro": {
        "name": "Touro University",
        "search_terms": ["Touro University", "Touro College"],
        "facebook_page": "TouroCollege"
    }
}

def get_meta_ad_library_url(page_name, country='US'):
    """
    Genera URL de Meta Ad Library para una página específica
    """
    base_url = "https://www.facebook.com/ads/library/"
    params = f"?active_status=active&ad_type=all&country={country}&view_all_page_id=&search_type=page&page_ids={page_name}"
    return base_url + params

def scrape_meta_ads_manual_links():
    """
    Genera enlaces directos para revisar manualmente en Meta Ad Library
    Esto es más confiable que scraping directo (Meta tiene protecciones)
    """
    
    print("=" * 60)
    print("META AD LIBRARY - MANUAL LINKS GENERATOR")
    print("=" * 60)
    print()
    
    results = {
        "generated_at": datetime.now().isoformat(),
        "method": "Meta Ad Library Manual Links",
        "note": "Visit these links to view active ads. Meta Ad Library requires manual verification.",
        "universities": {}
    }
    
    for uni_key, uni_data in UNIVERSITIES.items():
        print(f"[*] {uni_data['name']}")
        print(f"    Facebook Page: @{uni_data['facebook_page']}")
        
        # Generar enlaces de búsqueda
        search_links = []
        
        # 1. Link directo a la página
        page_link = f"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=&search_type=page&page_ids={uni_data['facebook_page']}"
        search_links.append({
            "type": "page_ads",
            "url": page_link,
            "description": f"All active ads from @{uni_data['facebook_page']}"
        })
        
        # 2. Links de búsqueda por términos
        for term in uni_data['search_terms']:
            search_url = f"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q={term.replace(' ', '%20')}"
            search_links.append({
                "type": "search",
                "url": search_url,
                "description": f"Search results for '{term}'"
            })
        
        results["universities"][uni_key] = {
            "name": uni_data['name'],
            "facebook_page": uni_data['facebook_page'],
            "links": search_links,
            "instructions": [
                "1. Click on the link",
                "2. You may need to verify you're human (CAPTCHA)",
                "3. View active ads",
                "4. Copy ad details (text, images, targeting)",
                "5. Save to spreadsheet or JSON"
            ]
        }
        
        print(f"    Generated {len(search_links)} search links")
        print()
    
    # Guardar resultados
    output_file = "public/meta_ads_research_links.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("=" * 60)
    print("[+] SUCCESS!")
    print(f"[+] Links saved to: {output_file}")
    print("=" * 60)
    print()
    print("NEXT STEPS:")
    print("1. Open the JSON file to see all links")
    print("2. Visit each link in your browser")
    print("3. Meta will show you all active ads")
    print("4. Manually copy the ad data you need")
    print()
    print("TIP: Meta Ad Library doesn't allow automated scraping,")
    print("but you can manually collect this public information.")
    print("=" * 60)
    
    return results

def create_ad_data_template():
    """
    Crea un template JSON para que el usuario llene manualmente con los datos de ads
    """
    
    template = {
        "instructions": "Fill in ad data manually from Meta Ad Library",
        "last_updated": datetime.now().isoformat(),
        "universities": {}
    }
    
    for uni_key, uni_data in UNIVERSITIES.items():
        template["universities"][uni_key] = {
            "name": uni_data['name'],
            "facebook_page": uni_data['facebook_page'],
            "ads": [
                {
                    "ad_id": "EXAMPLE_AD_001",
                    "ad_text": "Example ad text here",
                    "ad_image_url": "URL to ad creative",
                    "call_to_action": "Learn More / Apply Now / etc",
                    "started_running": "2024-01-01",
                    "platforms": ["Facebook", "Instagram"],
                    "targeting": {
                        "age": "18-65+",
                        "locations": ["United States"],
                        "interests": ["Education", "College"]
                    },
                    "status": "Active"
                }
            ],
            "total_active_ads": 0,
            "notes": "Add any observations about their ad strategy"
        }
    
    output_file = "public/meta_ads_data_template.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(template, f, indent=2, ensure_ascii=False)
    
    print(f"[+] Template created: {output_file}")
    print("[*] Use this template to organize ad data you collect manually")
    
    return template

def generate_google_ads_links():
    """
    Genera enlaces para Google Ads Transparency Center
    """
    
    print()
    print("=" * 60)
    print("GOOGLE ADS TRANSPARENCY CENTER - LINKS")
    print("=" * 60)
    print()
    
    google_ads_links = {
        "generated_at": datetime.now().isoformat(),
        "platform": "Google Ads Transparency Center",
        "base_url": "https://adstransparency.google.com/",
        "note": "Google Ads requires manual search. Visit base URL and search for university name.",
        "universities": {}
    }
    
    for uni_key, uni_data in UNIVERSITIES.items():
        advertiser_name = uni_data['name']
        # Google Ads search works better from the home page
        base_search = "https://adstransparency.google.com/"
        
        google_ads_links["universities"][uni_key] = {
            "name": uni_data['name'],
            "search_url": base_search,
            "search_term": advertiser_name,
            "instructions": [
                f"1. Visit {base_search}",
                f"2. Type '{advertiser_name}' in the search box",
                "3. Select the correct advertiser from results",
                "4. View their Google Display and Search ads",
                "5. Note ad copy, formats, and targeting"
            ]
        }
        
        print(f"[*] {uni_data['name']}")
        print(f"    Visit: {base_search}")
        print(f"    Search for: '{advertiser_name}'")
        print()
    
    output_file = "public/google_ads_research_links.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(google_ads_links, f, indent=2, ensure_ascii=False)
    
    print(f"[+] Google Ads links saved to: {output_file}")
    print("=" * 60)
    
    return google_ads_links

if __name__ == "__main__":
    print()
    print("=" * 60)
    print("     UNIVERSITY DIGITAL ADS RESEARCH TOOL")
    print("     Meta Ad Library + Google Ads Links Generator")
    print("=" * 60)
    print()
    
    # 1. Generar enlaces de Meta Ad Library
    meta_results = scrape_meta_ads_manual_links()
    
    # 2. Crear template para datos de ads
    create_ad_data_template()
    
    # 3. Generar enlaces de Google Ads
    google_results = generate_google_ads_links()
    
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"[+] Meta Ad Library links: public/meta_ads_research_links.json")
    print(f"[+] Google Ads links: public/google_ads_research_links.json")
    print(f"[+] Data template: public/meta_ads_data_template.json")
    print()
    print("You now have direct links to:")
    print(f"  - {len(UNIVERSITIES)} universities on Meta Ad Library")
    print(f"  - {len(UNIVERSITIES)} universities on Google Ads")
    print()
    print("Visit the links and collect ad data manually.")
    print("Both platforms are public but require human verification.")
    print("=" * 60)

