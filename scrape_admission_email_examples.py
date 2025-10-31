#!/usr/bin/env python3
"""
OSINT Script - Real Admission Email Examples Finder
Searches public forums/Reddit for students sharing their actual admission emails
100% Legal - Only uses publicly shared content
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
from typing import List, Dict
from urllib.parse import quote_plus

class AdmissionEmailExamplesFinder:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    def search_reddit_posts(self, university_name: str) -> List[Dict]:
        """Search for Reddit posts about admission emails"""
        results = []
        
        # Search queries
        queries = [
            f'{university_name} acceptance email',
            f'{university_name} admission letter',
            f'{university_name} decision email',
            f'{university_name} got accepted email',
            f'{university_name} rejection email',
        ]
        
        print(f"    [*] Searching Reddit for {university_name} admission emails...")
        
        for query in queries:
            try:
                # Google search for Reddit posts (easier than Reddit API)
                search_url = f"https://www.google.com/search?q=site:reddit.com+{quote_plus(query)}"
                
                results.append({
                    'query': query,
                    'search_url': search_url,
                    'source': 'Reddit',
                    'instructions': 'Click link and look for screenshots or text of admission emails'
                })
                
                time.sleep(0.5)
            except Exception as e:
                continue
        
        return results
    
    def search_college_confidential(self, university_name: str) -> List[Dict]:
        """Search College Confidential forums"""
        results = []
        
        queries = [
            f'{university_name} acceptance email',
            f'{university_name} decision notification',
            f'{university_name} admission results',
        ]
        
        print(f"    [*] Searching College Confidential...")
        
        for query in queries:
            try:
                search_url = f"https://www.google.com/search?q=site:talk.collegeconfidential.com+{quote_plus(query)}"
                
                results.append({
                    'query': query,
                    'search_url': search_url,
                    'source': 'College Confidential',
                    'instructions': 'Forum posts often include email text or screenshots'
                })
                
                time.sleep(0.5)
            except Exception as e:
                continue
        
        return results
    
    def search_youtube_videos(self, university_name: str) -> List[Dict]:
        """Search for YouTube reaction videos"""
        results = []
        
        keywords = [
            f'{university_name} acceptance reaction',
            f'{university_name} decision day',
            f'{university_name} opening acceptance email',
            f'{university_name} admission decision',
        ]
        
        print(f"    [*] Searching YouTube for reaction videos...")
        
        for keyword in keywords:
            youtube_url = f"https://www.youtube.com/results?search_query={quote_plus(keyword)}"
            
            results.append({
                'keyword': keyword,
                'video_search_url': youtube_url,
                'source': 'YouTube',
                'instructions': 'Look for videos where students show their admission emails on screen'
            })
        
        return results
    
    def search_student_blogs(self, university_name: str) -> List[Dict]:
        """Search for student blog posts"""
        results = []
        
        queries = [
            f'{university_name} acceptance email text',
            f'{university_name} admission email example',
            f'{university_name} got in email',
            f'my {university_name} acceptance story',
        ]
        
        print(f"    [*] Searching student blogs...")
        
        for query in queries:
            google_url = f"https://www.google.com/search?q={quote_plus(query)}"
            
            results.append({
                'query': query,
                'search_url': google_url,
                'source': 'Blogs/Medium',
                'instructions': 'Students often share full email text in their blogs'
            })
        
        return results
    
    def search_university_official(self, university_name: str, domain: str) -> List[Dict]:
        """Search for official examples on university websites"""
        results = []
        
        queries = [
            f'site:{domain} sample admission letter',
            f'site:{domain} acceptance notification',
            f'site:{domain} decision letter example',
        ]
        
        print(f"    [*] Checking official university site for examples...")
        
        for query in queries:
            google_url = f"https://www.google.com/search?q={quote_plus(query)}"
            
            results.append({
                'query': query,
                'search_url': google_url,
                'source': 'Official University Site',
                'instructions': 'Sometimes universities publish sample letters'
            })
        
        return results
    
    def generate_research_links(self, university_name: str, domain: str) -> Dict:
        """Generate all research links for a university"""
        print(f"\n[*] Processing: {university_name}")
        
        results = {
            'university': university_name,
            'domain': domain,
            'reddit_searches': self.search_reddit_posts(university_name),
            'college_confidential': self.search_college_confidential(university_name),
            'youtube_videos': self.search_youtube_videos(university_name),
            'student_blogs': self.search_student_blogs(university_name),
            'official_site': self.search_university_official(university_name, domain),
            'total_sources': 0,
            'research_notes': {
                'best_sources': [
                    'Reddit r/ApplyingToCollege',
                    'YouTube Decision Day videos',
                    'College Confidential forums'
                ],
                'what_to_look_for': [
                    'Screenshots of actual emails',
                    'Copy-pasted email text',
                    'Subject lines used',
                    'Tone and language patterns',
                    'Timing of emails (when they sent)',
                    'Sender addresses (e.g., admissions@university.edu)'
                ],
                'legal_note': 'All sources are PUBLIC content shared voluntarily by students'
            }
        }
        
        # Count total sources
        results['total_sources'] = (
            len(results['reddit_searches']) +
            len(results['college_confidential']) +
            len(results['youtube_videos']) +
            len(results['student_blogs']) +
            len(results['official_site'])
        )
        
        print(f"    [+] Generated {results['total_sources']} research links")
        
        return results
    
    def process_all_universities(self):
        """Process all target universities"""
        universities = [
            {
                'name': 'Yeshiva University',
                'short_name': 'YU',
                'domain': 'yu.edu'
            },
            {
                'name': 'New York University',
                'short_name': 'NYU',
                'domain': 'nyu.edu'
            },
            {
                'name': 'Brandeis University',
                'short_name': 'Brandeis',
                'domain': 'brandeis.edu'
            },
            {
                'name': 'Columbia University',
                'short_name': 'Columbia',
                'domain': 'columbia.edu'
            },
            {
                'name': 'Touro University',
                'short_name': 'Touro',
                'domain': 'touro.edu'
            }
        ]
        
        print("="*60)
        print("Real Admission Email Examples Finder")
        print("Searching PUBLIC student-shared content (100% Legal)")
        print("="*60)
        
        results = []
        
        for uni in universities:
            try:
                result = self.generate_research_links(uni['name'], uni['domain'])
                results.append(result)
            except Exception as e:
                print(f"    [!] Error: {str(e)}")
                results.append({
                    'university': uni['name'],
                    'error': str(e)
                })
        
        return results
    
    def save_results(self, results: List[Dict]):
        """Save results to JSON"""
        output = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'method': 'Public Forum & Social Media Search',
            'legal_status': 'All content is publicly shared by students voluntarily',
            'universities': results,
            'total_search_links': sum(r.get('total_sources', 0) for r in results),
            'how_to_use': {
                'step_1': 'Open each search URL in your browser',
                'step_2': 'Look for posts where students share their admission emails',
                'step_3': 'Screenshot or copy the email content/format',
                'step_4': 'Analyze tone, structure, and language patterns',
                'step_5': 'Document sender addresses and subject lines'
            },
            'best_practices': {
                'reddit': 'Check r/ApplyingToCollege and university-specific subreddits',
                'youtube': 'Look for "Decision Day" or "Opening My Acceptance" videos',
                'forums': 'College Confidential has years of historical data',
                'timing': 'Search during March-April for current year decisions'
            }
        }
        
        with open('public/admission_email_research_links.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n[+] Results saved to: public/admission_email_research_links.json")
        return output
    
    def print_summary(self, results: List[Dict]):
        """Print summary with key links"""
        print("\n" + "="*60)
        print("RESEARCH LINKS GENERATED")
        print("="*60)
        
        for result in results:
            if 'error' in result:
                print(f"\n[!] {result['university']}: Error")
                continue
            
            print(f"\n[*] {result['university']}")
            print(f"    Total research links: {result['total_sources']}")
            
            # Show top Reddit searches
            if result.get('reddit_searches'):
                print(f"\n    [+] Reddit Searches (Top 3):")
                for item in result['reddit_searches'][:3]:
                    print(f"        - {item['query']}")
                    print(f"          {item['search_url']}")
            
            # Show top YouTube searches
            if result.get('youtube_videos'):
                print(f"\n    [+] YouTube Videos (Top 2):")
                for item in result['youtube_videos'][:2]:
                    print(f"        - {item['keyword']}")
                    print(f"          {item['video_search_url']}")

def main():
    finder = AdmissionEmailExamplesFinder()
    
    # Generate all research links
    results = finder.process_all_universities()
    
    # Save results
    output = finder.save_results(results)
    
    # Print summary
    finder.print_summary(results)
    
    print("\n" + "="*60)
    print("[+] Research Links Complete!")
    print(f"    Total links generated: {output['total_search_links']}")
    print("    Open JSON file and click links to find real emails!")
    print("="*60)
    
    print("\n[*] QUICK START:")
    print("    1. Open: public/admission_email_research_links.json")
    print("    2. Copy/paste search URLs into your browser")
    print("    3. Look for posts with email screenshots or text")
    print("    4. Document the email patterns you find")
    print("\n[*] BEST RESULTS:")
    print("    - Reddit r/ApplyingToCollege (most active)")
    print("    - YouTube 'Decision Day' videos (visual)")
    print("    - College Confidential (historical data)")

if __name__ == "__main__":
    main()

