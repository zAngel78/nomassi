#!/usr/bin/env python3
"""
Automatic PDF Finder and Downloader
Searches university websites for admissions PDFs and downloads them automatically
"""

import requests
from bs4 import BeautifulSoup
import re
import os
import time
from urllib.parse import urljoin, urlparse
from PyPDF2 import PdfReader
import io

class AutoPDFFinder:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
    def find_pdf_links(self, base_url: str, domain: str, search_paths: list) -> list:
        """Find PDF links on university pages"""
        pdf_links = []
        
        print(f"    [*] Searching for PDFs...")
        
        for path in search_paths:
            try:
                url = urljoin(base_url, path)
                response = requests.get(url, headers=self.headers, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find all links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        
                        # Check if it's a PDF
                        if '.pdf' in href.lower():
                            full_url = urljoin(url, href)
                            
                            # Only include PDFs from the university domain
                            if domain in full_url:
                                link_text = link.get_text(strip=True)
                                
                                # Check if it's admissions-related
                                keywords = ['admission', 'apply', 'application', 'prospective', 
                                           'enroll', 'catalog', 'guide', 'instruction', 'student']
                                
                                if any(keyword in full_url.lower() or keyword in link_text.lower() 
                                      for keyword in keywords):
                                    
                                    # Avoid duplicates
                                    if full_url not in [p['url'] for p in pdf_links]:
                                        pdf_links.append({
                                            'url': full_url,
                                            'title': link_text or 'Untitled PDF',
                                            'source': url
                                        })
                                        print(f"        [+] Found: {link_text[:50]}")
                
                time.sleep(1)  # Be respectful
            except Exception as e:
                continue
        
        return pdf_links[:10]  # Limit to 10 PDFs per university
    
    def download_pdf(self, url: str, filename: str, folder='public/downloaded_pdfs') -> bool:
        """Download a single PDF"""
        try:
            os.makedirs(folder, exist_ok=True)
            
            print(f"    [*] Downloading: {filename}")
            
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            filepath = os.path.join(folder, filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"        [+] Saved ({len(response.content) / 1024:.1f} KB)")
            return True
            
        except Exception as e:
            print(f"        [!] Error: {str(e)}")
            return False
    
    def extract_emails_from_pdf(self, pdf_path: str, domain: str) -> list:
        """Extract emails from a downloaded PDF"""
        try:
            with open(pdf_path, 'rb') as f:
                reader = PdfReader(f)
                text = ""
                for page in reader.pages:
                    try:
                        text += page.extract_text() + "\n"
                    except:
                        continue
                
                # Find emails
                emails = self.email_pattern.findall(text)
                university_emails = [e.lower() for e in emails if domain in e.lower()]
                return list(set(university_emails))
        except:
            return []
    
    def process_university(self, name: str, domain: str, base_url: str, search_paths: list) -> dict:
        """Process a single university"""
        print(f"\n{'='*60}")
        print(f"[*] Processing: {name}")
        print(f"{'='*60}")
        
        # Find PDFs
        pdf_links = self.find_pdf_links(base_url, domain, search_paths)
        print(f"    [+] Found {len(pdf_links)} PDFs")
        
        if not pdf_links:
            print(f"    [!] No PDFs found. Try manual search.")
            return {
                'university': name,
                'domain': domain,
                'pdfs_found': 0,
                'pdfs_downloaded': 0,
                'emails_found': []
            }
        
        # Download PDFs
        print(f"\n    [*] Downloading PDFs...")
        downloaded = 0
        all_emails = set()
        
        for idx, pdf_info in enumerate(pdf_links, 1):
            filename = f"{domain.split('.')[0].upper()}_PDF_{idx}.pdf"
            
            if self.download_pdf(pdf_info['url'], filename):
                downloaded += 1
                
                # Extract emails from downloaded PDF
                filepath = f"public/downloaded_pdfs/{filename}"
                emails = self.extract_emails_from_pdf(filepath, domain)
                
                if emails:
                    print(f"        [+] Found {len(emails)} email(s) in PDF")
                    all_emails.update(emails)
                
                time.sleep(1)
        
        result = {
            'university': name,
            'domain': domain,
            'pdfs_found': len(pdf_links),
            'pdfs_downloaded': downloaded,
            'emails_found': sorted(list(all_emails)),
            'pdf_urls': [p['url'] for p in pdf_links]
        }
        
        return result
    
    def run_all_universities(self):
        """Process all universities"""
        universities = [
            {
                'name': 'New York University',
                'domain': 'nyu.edu',
                'base_url': 'https://www.nyu.edu',
                'search_paths': [
                    '/admissions',
                    '/admissions/undergraduate-admissions',
                    '/admissions/graduate-admissions',
                    '/applying',
                    '/prospective-students'
                ]
            },
            {
                'name': 'Columbia University',
                'domain': 'columbia.edu',
                'base_url': 'https://www.columbia.edu',
                'search_paths': [
                    '/admissions',
                    '/undergrad/admissions',
                    '/content/admissions',
                    '/node/154'
                ]
            },
            {
                'name': 'Touro University',
                'domain': 'touro.edu',
                'base_url': 'https://www.touro.edu',
                'search_paths': [
                    '/admissions',
                    '/admissions/undergraduate',
                    '/apply',
                    '/prospective-students'
                ]
            }
        ]
        
        print("="*60)
        print("Automatic PDF Finder & Downloader")
        print("Searching and downloading admissions PDFs")
        print("="*60)
        
        results = []
        
        for uni in universities:
            result = self.process_university(
                uni['name'],
                uni['domain'],
                uni['base_url'],
                uni['search_paths']
            )
            results.append(result)
        
        return results
    
    def print_summary(self, results: list):
        """Print summary"""
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        
        total_pdfs = sum(r['pdfs_downloaded'] for r in results)
        total_emails = sum(len(r['emails_found']) for r in results)
        
        for result in results:
            print(f"\n[*] {result['university']}")
            print(f"    PDFs downloaded: {result['pdfs_downloaded']}")
            print(f"    Emails found: {len(result['emails_found'])}")
            
            if result['emails_found']:
                for email in result['emails_found'][:5]:
                    print(f"        - {email}")
        
        print("\n" + "="*60)
        print(f"[+] Total PDFs downloaded: {total_pdfs}")
        print(f"[+] Total emails extracted: {total_emails}")
        print(f"[+] PDFs saved in: public/downloaded_pdfs/")
        print("="*60)

def main():
    finder = AutoPDFFinder()
    results = finder.run_all_universities()
    finder.print_summary(results)

if __name__ == "__main__":
    main()

