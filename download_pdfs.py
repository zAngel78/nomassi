#!/usr/bin/env python3
"""
Simple PDF Downloader
Downloads PDFs from provided URLs
"""

import requests
import os
import time
from urllib.parse import urlparse

def download_pdf(url, filename, folder='public/downloaded_pdfs'):
    """Download a single PDF"""
    try:
        # Create folder if it doesn't exist
        os.makedirs(folder, exist_ok=True)
        
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
    print("PDF Downloader")
    print("="*60)
    
    # Yeshiva University PDFs
    yu_pdfs = [
        {
            'url': 'https://www.yu.edu/sites/default/files/legacy//uploadedFiles/Academics/Registrar/Catalogs/Undergraduate/a3%20Admissions%20Wilf-12_14men1.pdf',
            'filename': 'YU_Undergraduate_Admissions_Catalog.pdf'
        },
        {
            'url': 'https://go.yu.edu/hubfs/GEM%20Documents/SymsEMBA-Instructions-For-Applicants%20(1).pdf',
            'filename': 'YU_Syms_EMBA_Instructions.pdf'
        },
        {
            'url': 'https://online.yu.edu/wurzweiler/documents/Yeshiva_HowToApplyGuide.pdf',
            'filename': 'YU_Wurzweiler_How_To_Apply.pdf'
        },
        {
            'url': 'https://www.yu.edu/sites/default/files/inline-files/Azrieli%20Welcome%20Packet.pdf',
            'filename': 'YU_Azrieli_Welcome_Packet.pdf'
        },
        {
            'url': 'https://www.yu.edu/sites/default/files/inline-files/Application%20Checklist%20for%20Graduate%20STEM%20Programs_0.pdf',
            'filename': 'YU_STEM_Application_Checklist.pdf'
        }
    ]
    
    print(f"\n[*] Found {len(yu_pdfs)} PDFs to download\n")
    
    success_count = 0
    fail_count = 0
    
    for pdf in yu_pdfs:
        if download_pdf(pdf['url'], pdf['filename']):
            success_count += 1
        else:
            fail_count += 1
        
        time.sleep(1)  # Be respectful
    
    print("="*60)
    print(f"[+] Download Complete!")
    print(f"    Success: {success_count}")
    print(f"    Failed: {fail_count}")
    print(f"    PDFs saved in: public/downloaded_pdfs/")
    print("="*60)

if __name__ == "__main__":
    main()

