#!/usr/bin/env python3
"""
Advanced OSINT - Admissions Contact Finder
Combines multiple techniques to find admissions emails
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
from typing import List, Dict, Set

class AdvancedContactFinder:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
    def generate_common_emails(self, domain: str) -> List[str]:
        """Generate common email patterns for universities"""
        common_patterns = [
            f'admissions@{domain}',
            f'admission@{domain}',
            f'info@{domain}',
            f'apply@{domain}',
            f'undergraduate@{domain}',
            f'graduate@{domain}',
            f'ugadmissions@{domain}',
            f'gradadmissions@{domain}',
            f'enroll@{domain}',
            f'enrollment@{domain}',
            f'contact@{domain}',
            f'admissions.office@{domain}',
            f'admissions.info@{domain}',
        ]
        return common_patterns
    
    def search_contact_pages(self, base_url: str, domain: str) -> Set[str]:
        """Search specific contact pages"""
        emails = set()
        
        contact_pages = [
            '/contact',
            '/contact-us',
            '/admissions/contact',
            '/about/contact',
            '/connect',
            '/admissions',
            '/admissions/undergraduate',
            '/admissions/graduate',
            '/admissions/staff',
            '/admissions/counselors',
            '/admissions/team',
            '/undergraduate/admissions/contact',
            '/graduate/admissions/contact',
        ]
        
        print(f"    [*] Searching contact pages...")
        
        for page in contact_pages:
            try:
                url = base_url.rstrip('/') + page
                response = requests.get(url, headers=self.headers, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    text = soup.get_text()
                    
                    # Find emails
                    found_emails = self.email_pattern.findall(text)
                    for email in found_emails:
                        if domain in email.lower():
                            emails.add(email.lower())
                    
                    # Find mailto links
                    for link in soup.find_all('a', href=True):
                        if link['href'].startswith('mailto:'):
                            email = link['href'].replace('mailto:', '').split('?')[0].lower()
                            if domain in email:
                                emails.add(email)
                
                time.sleep(0.5)  # Be respectful
            except:
                continue
        
        return emails
    
    def search_staff_directory(self, base_url: str, domain: str) -> Dict[str, str]:
        """Search for staff directory and admissions counselors"""
        staff_contacts = {}
        
        directory_pages = [
            '/admissions/staff',
            '/admissions/counselors',
            '/admissions/meet-our-team',
            '/admissions/team',
            '/about/staff',
            '/directory',
        ]
        
        print(f"    [*] Searching staff directories...")
        
        for page in directory_pages:
            try:
                url = base_url.rstrip('/') + page
                response = requests.get(url, headers=self.headers, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Look for staff cards or listings
                    for element in soup.find_all(['div', 'article', 'section']):
                        text = element.get_text()
                        
                        # Look for names with titles
                        if any(title in text.lower() for title in ['admissions', 'counselor', 'director', 'officer', 'coordinator']):
                            # Find emails in this section
                            for link in element.find_all('a', href=True):
                                if link['href'].startswith('mailto:'):
                                    email = link['href'].replace('mailto:', '').split('?')[0].lower()
                                    if domain in email:
                                        # Try to get the name
                                        name = element.find(['h2', 'h3', 'h4', 'strong', 'b'])
                                        if name:
                                            staff_contacts[email] = name.get_text(strip=True)
                                        else:
                                            staff_contacts[email] = 'Staff Member'
                
                time.sleep(0.5)
            except:
                continue
        
        return staff_contacts
    
    def find_university_contacts(self, name: str, domain: str, base_url: str) -> Dict:
        """Find all contacts for a university"""
        print(f"\n[*] Processing: {name}")
        print(f"    Domain: {domain}")
        
        # 1. Generate common emails
        common_emails = self.generate_common_emails(domain)
        print(f"    [+] Generated {len(common_emails)} common email patterns")
        
        # 2. Search contact pages
        found_emails = self.search_contact_pages(base_url, domain)
        print(f"    [+] Found {len(found_emails)} emails from contact pages")
        
        # 3. Search staff directory
        staff_contacts = self.search_staff_directory(base_url, domain)
        print(f"    [+] Found {len(staff_contacts)} staff contacts")
        
        # Combine all emails
        all_emails = found_emails.union(set(staff_contacts.keys()))
        
        result = {
            'university': name,
            'domain': domain,
            'base_url': base_url,
            'common_email_patterns': common_emails,
            'verified_emails': sorted(list(all_emails)),
            'staff_contacts': staff_contacts,
            'total_verified': len(all_emails),
            'hunter_io_search': f'https://hunter.io/search/{domain}',
            'linkedin_search': f'https://www.linkedin.com/search/results/people/?keywords={name.replace(" ", "%20")}%20admissions',
            'google_search': f'https://www.google.com/search?q={name.replace(" ", "+")}+admissions+email+contact'
        }
        
        return result
    
    def process_all_universities(self):
        """Process all target universities"""
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
        print("Advanced Admissions Contact Finder")
        print("Using multiple OSINT techniques")
        print("="*60)
        
        results = []
        
        for uni in universities:
            try:
                result = self.find_university_contacts(
                    uni['name'],
                    uni['domain'],
                    uni['base_url']
                )
                results.append(result)
            except Exception as e:
                print(f"    [!] Error: {str(e)}")
                results.append({
                    'university': uni['name'],
                    'error': str(e),
                    'total_verified': 0
                })
        
        return results
    
    def save_results(self, results: List[Dict]):
        """Save results to JSON"""
        output = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'method': 'Advanced Multi-Source OSINT',
            'universities': results,
            'total_verified_emails': sum(r.get('total_verified', 0) for r in results),
            'next_steps': {
                'hunter_io': 'Use Hunter.io links to find more emails (25 free searches/month)',
                'linkedin': 'Search LinkedIn for admissions staff contacts',
                'verify': 'Test common email patterns by sending test emails',
                'manual': 'Call admissions offices to confirm email addresses'
            }
        }
        
        with open('public/comprehensive_admissions_contacts.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n[+] Results saved to: public/comprehensive_admissions_contacts.json")
        return output
    
    def print_summary(self, results: List[Dict]):
        """Print summary"""
        print("\n" + "="*60)
        print("COMPREHENSIVE RESULTS")
        print("="*60)
        
        for result in results:
            if 'error' in result:
                print(f"\n[!] {result['university']}: Error")
                continue
            
            print(f"\n[*] {result['university']}")
            print(f"    Verified emails found: {result['total_verified']}")
            
            if result.get('verified_emails'):
                print(f"    [+] Verified Emails:")
                for email in result['verified_emails'][:5]:
                    print(f"        - {email}")
            
            print(f"    [+] Common Email Patterns (to try):")
            for email in result['common_email_patterns'][:3]:
                print(f"        - {email}")
            
            if result.get('staff_contacts'):
                print(f"    [+] Staff Contacts:")
                for email, name in list(result['staff_contacts'].items())[:3]:
                    print(f"        - {name}: {email}")
            
            print(f"    [i] Hunter.io: {result['hunter_io_search']}")

def main():
    finder = AdvancedContactFinder()
    
    # Process all universities
    results = finder.process_all_universities()
    
    # Save results
    output = finder.save_results(results)
    
    # Print summary
    finder.print_summary(results)
    
    print("\n" + "="*60)
    print("[+] Contact Discovery Complete!")
    print(f"    Total verified emails: {output['total_verified_emails']}")
    print("    Check JSON for Hunter.io and LinkedIn links")
    print("="*60)
    
    print("\n[*] RECOMMENDED TOOLS:")
    print("    1. Hunter.io: https://hunter.io (25 free searches)")
    print("    2. LinkedIn: Search for 'University Admissions Director'")
    print("    3. Check the JSON file for all links and patterns!")

if __name__ == "__main__":
    main()

