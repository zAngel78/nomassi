#!/usr/bin/env python3
"""
OSINT Script - PDF Admissions Document Finder & Email Extractor
Finds and downloads public admissions PDFs, then extracts contact emails
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Set
import os
from PyPDF2 import PdfReader
import io

class PDFAdmissionsEmailFinder:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.results = {}
        self.pdf_dir = 'public/admissions_pdfs'
        
        # Create PDF directory if it doesn't exist
        os.makedirs(self.pdf_dir, exist_ok=True)
        
    def clean_email(self, email: str) -> str:
        """Clean and validate email"""
        email = email.lower().strip()
        # Remove common false positives
        invalid_patterns = [
            'example.com', 'test.com', 'sample.com', 
            'yourname', 'youremail', 'domain.com',
            '.png', '.jpg', '.gif', '.svg'
        ]
        for pattern in invalid_patterns:
            if pattern in email:
                return None
        return email
    
    def extract_emails_from_text(self, text: str, domain: str) -> Set[str]:
        """Extract valid emails from text"""
        emails = set()
        found = self.email_pattern.findall(text)
        for email in found:
            clean = self.clean_email(email)
            if clean and domain in clean:
                emails.add(clean)
        return emails
    
    def google_dork_search(self, university_domain: str, university_name: str) -> List[str]:
        """
        Generate Google Dork search URLs for PDFs
        Note: This returns search URLs, not actual PDFs (would need Google API for automation)
        """
        search_queries = [
            f'site:{university_domain} filetype:pdf admissions contact',
            f'site:{university_domain} filetype:pdf undergraduate admissions',
            f'site:{university_domain} filetype:pdf graduate admissions',
            f'site:{university_domain} filetype:pdf "admissions office"',
            f'site:{university_domain} filetype:pdf "contact us" admissions',
            f'site:{university_domain} filetype:pdf prospective students',
            f'site:{university_domain} filetype:pdf admissions counselor',
        ]
        
        google_urls = []
        for query in search_queries:
            encoded_query = query.replace(' ', '+')
            google_url = f"https://www.google.com/search?q={encoded_query}"
            google_urls.append({
                'query': query,
                'url': google_url
            })
        
        return google_urls
    
    def find_pdf_links(self, base_url: str, domain: str) -> List[Dict]:
        """Find PDF links on university pages"""
        pdf_links = []
        
        # Pages to search
        pages_to_check = [
            base_url,
            urljoin(base_url, '/admissions'),
            urljoin(base_url, '/apply'),
            urljoin(base_url, '/undergraduate-admissions'),
            urljoin(base_url, '/graduate-admissions'),
        ]
        
        print(f"    [*] Searching for PDF links...")
        
        for page_url in pages_to_check:
            try:
                response = requests.get(page_url, headers=self.headers, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find all links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        
                        # Check if it's a PDF
                        if '.pdf' in href.lower():
                            full_url = urljoin(page_url, href)
                            
                            # Only include PDFs from the university domain
                            if domain in full_url or not full_url.startswith('http'):
                                if not full_url.startswith('http'):
                                    full_url = urljoin(base_url, href)
                                
                                # Get link text for context
                                link_text = link.get_text(strip=True)
                                
                                # Check if it's admissions-related
                                keywords = ['admission', 'apply', 'prospective', 'enroll', 'brochure', 'viewbook', 'guide']
                                if any(keyword in full_url.lower() or keyword in link_text.lower() for keyword in keywords):
                                    pdf_links.append({
                                        'url': full_url,
                                        'title': link_text or 'Untitled PDF',
                                        'source_page': page_url
                                    })
                
                time.sleep(1)  # Be respectful
            except Exception as e:
                continue
        
        # Remove duplicates
        seen = set()
        unique_pdfs = []
        for pdf in pdf_links:
            if pdf['url'] not in seen:
                seen.add(pdf['url'])
                unique_pdfs.append(pdf)
        
        return unique_pdfs[:10]  # Limit to 10 PDFs
    
    def download_and_extract_text(self, pdf_url: str, filename: str, domain: str) -> Dict:
        """Download PDF and extract text and emails"""
        try:
            print(f"        [*] Downloading: {filename[:50]}...")
            
            # Download PDF
            response = requests.get(pdf_url, headers=self.headers, timeout=15)
            response.raise_for_status()
            
            # Read PDF
            pdf_file = io.BytesIO(response.content)
            reader = PdfReader(pdf_file)
            
            # Extract text from all pages
            full_text = ""
            for page in reader.pages:
                try:
                    full_text += page.extract_text() + "\n"
                except:
                    continue
            
            # Extract emails
            emails = self.extract_emails_from_text(full_text, domain)
            
            if emails:
                print(f"            [+] Found {len(emails)} email(s)!")
                for email in list(emails)[:3]:
                    print(f"                - {email}")
            else:
                print(f"            [!] No emails found in this PDF")
            
            return {
                'url': pdf_url,
                'filename': filename,
                'emails_found': len(emails),
                'emails': list(emails),
                'text_extracted': len(full_text) > 0
            }
            
        except Exception as e:
            print(f"        [!] Error processing PDF: {str(e)}")
            return {
                'url': pdf_url,
                'filename': filename,
                'error': str(e),
                'emails_found': 0,
                'emails': []
            }
    
    def scrape_university_pdfs(self, name: str, domain: str, base_url: str) -> Dict:
        """Find PDFs and extract emails for a university"""
        print(f"\n[*] Processing: {name}")
        print(f"    Domain: {domain}")
        
        # Find PDF links
        pdf_links = self.find_pdf_links(base_url, domain)
        
        print(f"    [+] Found {len(pdf_links)} admissions-related PDFs")
        
        pdfs_info = []
        all_emails = set()
        
        for pdf in pdf_links:
            # Process the PDF and extract emails
            pdf_result = self.download_and_extract_text(pdf['url'], pdf['title'], domain)
            pdfs_info.append(pdf_result)
            
            # Collect all emails
            if pdf_result.get('emails'):
                all_emails.update(pdf_result['emails'])
        
        # Generate Google Dork searches
        google_searches = self.google_dork_search(domain, name)
        
        result = {
            'university': name,
            'domain': domain,
            'base_url': base_url,
            'pdfs_found': len(pdf_links),
            'pdfs': pdfs_info,
            'total_emails_from_pdfs': len(all_emails),
            'emails_from_pdfs': sorted(list(all_emails)),
            'google_dork_searches': google_searches[:3],  # Limit for readability
            'manual_search_instructions': {
                'step_1': f'Visit each PDF URL above',
                'step_2': f'Look for admissions contact emails',
                'step_3': f'Common formats: admissions@{domain}, [name]@{domain}',
                'step_4': f'Use Google searches for more PDFs'
            }
        }
        
        return result
    
    def scrape_all_universities(self):
        """Scrape all target universities"""
        universities = [
            {
                'name': 'Yeshiva University',
                'domain': 'yu.edu',
                'base_url': 'https://www.yu.edu'
            },
            {
                'name': 'New York University',
                'domain': 'nyu.edu',
                'base_url': 'https://www.nyu.edu'
            },
            {
                'name': 'Brandeis University',
                'domain': 'brandeis.edu',
                'base_url': 'https://www.brandeis.edu'
            },
            {
                'name': 'Columbia University',
                'domain': 'columbia.edu',
                'base_url': 'https://www.columbia.edu'
            },
            {
                'name': 'Touro University',
                'domain': 'touro.edu',
                'base_url': 'https://www.touro.edu'
            }
        ]
        
        print("="*60)
        print("PDF Admissions Document Finder")
        print("Finding PUBLIC admissions PDFs (Legal & Ethical)")
        print("="*60)
        
        results = []
        
        for uni in universities:
            try:
                result = self.scrape_university_pdfs(
                    uni['name'],
                    uni['domain'],
                    uni['base_url']
                )
                results.append(result)
            except Exception as e:
                print(f"    [!] Error processing {uni['name']}: {str(e)}")
                results.append({
                    'university': uni['name'],
                    'error': str(e),
                    'pdfs_found': 0
                })
        
        return results
    
    def save_results(self, results: List[Dict], filename: str = 'public/admissions_pdfs_catalog.json'):
        """Save results to JSON file"""
        total_emails = sum(r.get('total_emails_from_pdfs', 0) for r in results)
        
        output = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'method': 'PDF Document Discovery & Email Extraction',
            'note': 'Emails extracted automatically from PDF documents',
            'universities': results,
            'total_universities': len(results),
            'total_pdfs_processed': sum(r.get('pdfs_found', 0) for r in results),
            'total_emails_extracted': total_emails
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n[+] Results saved to: {filename}")
        return output
    
    def print_summary(self, results: List[Dict]):
        """Print a summary of findings"""
        print("\n" + "="*60)
        print("SUMMARY - PDF Documents Found")
        print("="*60)
        
        for result in results:
            if 'error' in result:
                print(f"\n[!] {result['university']}: Error - {result['error']}")
                continue
            
            print(f"\n[*] {result['university']}")
            print(f"    PDFs found: {result['pdfs_found']}")
            print(f"    Emails extracted: {result.get('total_emails_from_pdfs', 0)}")
            
            if result.get('emails_from_pdfs'):
                print(f"    [+] Emails from PDFs:")
                for email in result['emails_from_pdfs'][:5]:
                    print(f"        - {email}")
            
            if result.get('pdfs'):
                print(f"    [+] Documents processed:")
                for pdf in result['pdfs'][:3]:
                    print(f"        - {pdf.get('filename', 'Unknown')[:50]}")
            
            if result.get('google_dork_searches'):
                print(f"    [+] Google Search URLs (for more PDFs):")
                for search in result['google_dork_searches'][:2]:
                    print(f"        - {search['url']}")

def main():
    finder = PDFAdmissionsEmailFinder()
    
    # Run the scraper
    results = finder.scrape_all_universities()
    
    # Save results
    output = finder.save_results(results)
    
    # Print summary
    finder.print_summary(results)
    
    print("\n" + "="*60)
    print("[+] PDF Extraction Complete!")
    print(f"    Total PDFs processed: {output['total_pdfs_processed']}")
    print(f"    Total emails extracted: {output['total_emails_extracted']}")
    print("    Results saved to: public/admissions_pdfs_catalog.json")
    print("="*60)
    
    print("\n[*] TIP: Check the JSON file for all extracted emails!")

if __name__ == "__main__":
    main()

