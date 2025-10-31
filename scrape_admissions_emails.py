#!/usr/bin/env python3
"""
OSINT Script - Public Admissions Email Finder
Legal method to find publicly available admissions contact emails
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Set

class AdmissionsEmailFinder:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.results = {}
        
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
    
    def extract_emails_from_text(self, text: str) -> Set[str]:
        """Extract valid emails from text"""
        emails = set()
        found = self.email_pattern.findall(text)
        for email in found:
            clean = self.clean_email(email)
            if clean:
                emails.add(clean)
        return emails
    
    def scrape_page(self, url: str) -> Set[str]:
        """Scrape a single page for emails"""
        emails = set()
        try:
            print(f"  [*] Scraping: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract from visible text
            text = soup.get_text()
            emails.update(self.extract_emails_from_text(text))
            
            # Extract from mailto links
            for link in soup.find_all('a', href=True):
                if link['href'].startswith('mailto:'):
                    email = link['href'].replace('mailto:', '').split('?')[0]
                    clean = self.clean_email(email)
                    if clean:
                        emails.add(clean)
            
            # Extract from meta tags
            for meta in soup.find_all('meta'):
                content = meta.get('content', '')
                emails.update(self.extract_emails_from_text(content))
            
            time.sleep(1)  # Be respectful with rate limiting
            
        except Exception as e:
            print(f"  [!] Error scraping {url}: {str(e)}")
        
        return emails
    
    def find_admissions_pages(self, base_url: str, domain: str) -> List[str]:
        """Find potential admissions-related pages"""
        admissions_urls = []
        
        # Common admissions page patterns
        patterns = [
            '/admissions',
            '/undergraduate-admissions',
            '/graduate-admissions',
            '/admissions/contact',
            '/apply',
            '/prospective-students',
            '/admissions/undergraduate',
            '/admissions/graduate',
            '/contact-admissions',
            '/admissions-staff',
            '/admissions/meet-the-team'
        ]
        
        for pattern in patterns:
            url = urljoin(base_url, pattern)
            admissions_urls.append(url)
        
        # Try to find admissions links from homepage
        try:
            print(f"  [*] Searching homepage for admissions links...")
            response = requests.get(base_url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                if any(keyword in href.lower() for keyword in ['admission', 'apply', 'prospective', 'enroll']):
                    full_url = urljoin(base_url, href)
                    if domain in full_url and full_url not in admissions_urls:
                        admissions_urls.append(full_url)
            
            time.sleep(1)
        except Exception as e:
            print(f"  [!] Error finding pages: {str(e)}")
        
        return admissions_urls[:10]  # Limit to first 10 URLs
    
    def scrape_university(self, name: str, domain: str, base_url: str) -> Dict:
        """Scrape all admissions emails for a university"""
        print(f"\n[*] Processing: {name}")
        print(f"    Domain: {domain}")
        
        all_emails = set()
        
        # Find admissions pages
        admissions_pages = self.find_admissions_pages(base_url, domain)
        
        # Scrape each page
        for page_url in admissions_pages:
            emails = self.scrape_page(page_url)
            all_emails.update(emails)
        
        # Filter to only university domain emails
        university_emails = {
            email for email in all_emails 
            if domain in email
        }
        
        # Categorize emails
        categorized = {
            'general_admissions': [],
            'undergraduate': [],
            'graduate': [],
            'other': []
        }
        
        for email in university_emails:
            email_lower = email.lower()
            if any(word in email_lower for word in ['undergrad', 'ugrad', 'freshman', 'transfer']):
                categorized['undergraduate'].append(email)
            elif any(word in email_lower for word in ['grad', 'graduate', 'masters', 'phd', 'doctoral']):
                categorized['graduate'].append(email)
            elif any(word in email_lower for word in ['admission', 'admissions', 'admit', 'enroll', 'apply']):
                categorized['general_admissions'].append(email)
            else:
                categorized['other'].append(email)
        
        result = {
            'university': name,
            'domain': domain,
            'base_url': base_url,
            'emails': categorized,
            'total_found': len(university_emails),
            'all_emails': sorted(list(university_emails))
        }
        
        print(f"    [+] Found {len(university_emails)} emails from {domain}")
        
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
        print("OSINT Admissions Email Finder")
        print("Searching PUBLIC pages only (Legal & Ethical)")
        print("="*60)
        
        results = []
        
        for uni in universities:
            try:
                result = self.scrape_university(
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
                    'total_found': 0
                })
        
        return results
    
    def save_results(self, results: List[Dict], filename: str = 'admissions_emails.json'):
        """Save results to JSON file"""
        output = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'method': 'OSINT - Public Web Scraping',
            'universities': results,
            'total_universities': len(results),
            'total_emails': sum(r.get('total_found', 0) for r in results)
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n[+] Results saved to: {filename}")
        return output
    
    def print_summary(self, results: List[Dict]):
        """Print a summary of findings"""
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        
        for result in results:
            if 'error' in result:
                print(f"\n[!] {result['university']}: Error - {result['error']}")
                continue
            
            print(f"\n[*] {result['university']}")
            print(f"    Total emails found: {result['total_found']}")
            
            if result['emails']['general_admissions']:
                print(f"    [+] General Admissions:")
                for email in result['emails']['general_admissions'][:3]:
                    print(f"        - {email}")
            
            if result['emails']['undergraduate']:
                print(f"    [+] Undergraduate:")
                for email in result['emails']['undergraduate'][:2]:
                    print(f"        - {email}")
            
            if result['emails']['graduate']:
                print(f"    [+] Graduate:")
                for email in result['emails']['graduate'][:2]:
                    print(f"        - {email}")

def main():
    finder = AdmissionsEmailFinder()
    
    # Run the scraper
    results = finder.scrape_all_universities()
    
    # Save results
    output = finder.save_results(results, 'public/admissions_emails.json')
    
    # Print summary
    finder.print_summary(results)
    
    print("\n" + "="*60)
    print("[+] OSINT Collection Complete!")
    print(f"    Total emails found: {output['total_emails']}")
    print("    All data saved to: public/admissions_emails.json")
    print("="*60)

if __name__ == "__main__":
    main()

