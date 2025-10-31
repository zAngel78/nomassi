#!/usr/bin/env python3
"""
Batch PDF Downloader for All Universities
Reads from pdfs_to_download.json and downloads all PDFs
"""

import requests
import os
import json
import time
from urllib.parse import urlparse

def download_pdf(url, university_name, index, folder='public/downloaded_pdfs'):
    """Download a single PDF"""
    try:
        # Skip placeholder URLs
        if 'PASTE_URL_HERE' in url or not url.startswith('http'):
            return False
            
        # Create folder if it doesn't exist
        os.makedirs(folder, exist_ok=True)
        
        # Generate filename
        filename = f"{university_name}_PDF_{index}.pdf"
        
        print(f"[*] Downloading: {filename}")
        print(f"    URL: {url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Save PDF
        filepath = os.path.join(folder, filename)
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"    [+] Saved: {filepath}")
        print(f"    Size: {len(response.content) / 1024:.2f} KB\n")
        
        return True
        
    except Exception as e:
        print(f"    [!] Error: {str(e)}\n")
        return False

def main():
    print("="*60)
    print("Batch PDF Downloader - All Universities")
    print("="*60)
    
    # Read JSON file
    try:
        with open('pdfs_to_download.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("[!] Error: pdfs_to_download.json not found!")
        print("    Please create the file and add PDF URLs")
        return
    
    universities = config.get('universities', {})
    
    total_success = 0
    total_failed = 0
    total_skipped = 0
    
    for uni_id, uni_data in universities.items():
        uni_name = uni_data.get('name', uni_id)
        pdfs = uni_data.get('pdfs', [])
        
        print(f"\n{'='*60}")
        print(f"[*] Processing: {uni_name}")
        print(f"    PDFs to download: {len(pdfs)}")
        print(f"{'='*60}\n")
        
        for idx, pdf_info in enumerate(pdfs, 1):
            url = pdf_info.get('url', '')
            
            if 'PASTE_URL_HERE' in url:
                print(f"[!] Skipping placeholder URL {idx} for {uni_name}\n")
                total_skipped += 1
                continue
            
            if download_pdf(url, uni_id.upper(), idx):
                total_success += 1
            else:
                total_failed += 1
            
            time.sleep(1)  # Be respectful
    
    print("\n" + "="*60)
    print("[+] Batch Download Complete!")
    print(f"    Success: {total_success}")
    print(f"    Failed: {total_failed}")
    print(f"    Skipped (placeholders): {total_skipped}")
    print(f"    PDFs saved in: public/downloaded_pdfs/")
    print("="*60)
    
    if total_skipped > 0:
        print("\n[i] TIP: Replace 'PASTE_URL_HERE' with real URLs in pdfs_to_download.json")

if __name__ == "__main__":
    main()

