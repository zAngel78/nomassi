"""
Generate Qualitative Analysis Charts
Creates visualizations for content analysis, voice characteristics, and production quality
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10

def load_data():
    """Load content coding data"""
    df = pd.read_csv('content_coding_data.csv')
    return df

def create_content_category_chart(df):
    """Chart 1: Content Category Distribution by Institution"""
    category_counts = df.groupby(['Institution', 'Content_Category']).size().unstack(fill_value=0)
    category_pct = category_counts.div(category_counts.sum(axis=1), axis=0) * 100

    fig, ax = plt.subplots(figsize=(14, 8))
    category_pct.T.plot(kind='bar', ax=ax, width=0.8)
    ax.set_title('Content Category Distribution by Institution', fontsize=16, fontweight='bold')
    ax.set_xlabel('Content Category', fontsize=12)
    ax.set_ylabel('Percentage of Posts (%)', fontsize=12)
    ax.legend(title='Institution', bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(axis='y', alpha=0.3)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig('chart_content_categories.png', dpi=300, bbox_inches='tight')
    print("✓ Created: chart_content_categories.png")

def create_voice_tone_comparison(df):
    """Chart 2: Tone Distribution by Institution"""
    tone_counts = df.groupby(['Institution', 'Tone']).size().unstack(fill_value=0)
    tone_pct = tone_counts.div(tone_counts.sum(axis=1), axis=0) * 100

    fig, ax = plt.subplots(figsize=(12, 8))
    tone_pct.plot(kind='bar', ax=ax, stacked=True, colormap='Set3')
    ax.set_title('Tone Distribution Across Institutions', fontsize=16, fontweight='bold')
    ax.set_xlabel('Institution', fontsize=12)
    ax.set_ylabel('Percentage of Posts (%)', fontsize=12)
    ax.legend(title='Tone', bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(axis='y', alpha=0.3)
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig('chart_tone_distribution.png', dpi=300, bbox_inches='tight')
    print("✓ Created: chart_tone_distribution.png")

def create_format_performance(df):
    """Chart 3: Engagement Rate by Content Format"""
    format_engagement = df.groupby(['Institution', 'Format'])['Engagement_Rate'].mean().unstack()

    fig, ax = plt.subplots(figsize=(14, 8))
    format_engagement.plot(kind='bar', ax=ax, width=0.8)
    ax.set_title('Average Engagement Rate by Content Format', fontsize=16, fontweight='bold')
    ax.set_xlabel('Institution', fontsize=12)
    ax.set_ylabel('Engagement Rate (%)', fontsize=12)
    ax.legend(title='Format', bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(axis='y', alpha=0.3)
    ax.axhline(y=2.99, color='red', linestyle='--', alpha=0.7, label='Industry Benchmark')
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig('chart_format_performance.png', dpi=300, bbox_inches='tight')
    print("✓ Created: chart_format_performance.png")

def create_production_quality_heatmap(df):
    """Chart 4: Production Quality Heatmap"""
    quality_avg = df.groupby(['Institution', 'Format'])['Production_Quality'].mean().unstack()

    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(quality_avg, annot=True, fmt='.1f', cmap='RdYlGn',
                vmin=6, vmax=10, ax=ax, cbar_kws={'label': 'Quality Score'})
    ax.set_title('Production Quality Scores by Institution and Format',
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xlabel('Content Format', fontsize=12)
    ax.set_ylabel('Institution', fontsize=12)
    plt.tight_layout()
    plt.savefig('chart_production_quality.png', dpi=300, bbox_inches='tight')
    print("✓ Created: chart_production_quality.png")

def create_voice_characteristics_radar():
    """Chart 5: Brand Voice Characteristics Radar Chart"""
    # Data from research
    categories = ['Formality\n(Inverted)', 'Authenticity', 'Personality',
                  'Relatability', 'Energy', 'Humor', 'Emotional\nTone', 'Consistency']

    institutions = {
        'YU': [2.5, 6.0, 5.5, 5.2, 6.0, 3.5, 6.5, 7.8],  # Formality inverted for visual clarity
        'NYU': [5.8, 8.5, 8.8, 8.6, 9.0, 8.5, 8.2, 8.0],
        'Columbia': [4.2, 7.8, 7.5, 7.2, 7.0, 6.5, 7.8, 8.5],
        'Maryland': [6.0, 8.2, 8.5, 8.4, 8.8, 8.2, 7.8, 7.5]
    }

    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(12, 12), subplot_kw=dict(projection='polar'))

    colors = {'YU': '#4285F4', 'NYU': '#EA4335', 'Columbia': '#FBBC04', 'Maryland': '#34A853'}

    for inst, values in institutions.items():
        values += values[:1]
        ax.plot(angles, values, 'o-', linewidth=2, label=inst, color=colors[inst])
        ax.fill(angles, values, alpha=0.15, color=colors[inst])

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=11)
    ax.set_ylim(0, 10)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(['2', '4', '6', '8', '10'], size=9)
    ax.set_title('Brand Voice Characteristics Comparison\n(Scale: 1-10)',
                 fontsize=16, fontweight='bold', pad=30)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('chart_voice_radar.png', dpi=300, bbox_inches='tight')
    print("✓ Created: chart_voice_radar.png")

def create_platform_engagement_comparison(df):
    """Chart 6: Platform-specific Engagement Rates"""
    platform_engagement = df.groupby(['Institution', 'Platform'])['Engagement_Rate'].mean().unstack()

    fig, ax = plt.subplots(figsize=(12, 8))
    platform_engagement.plot(kind='bar', ax=ax, width=0.7)
    ax.set_title('Average Engagement Rate by Platform', fontsize=16, fontweight='bold')
    ax.set_xlabel('Institution', fontsize=12)
    ax.set_ylabel('Engagement Rate (%)', fontsize=12)
    ax.legend(title='Platform', bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(axis='y', alpha=0.3)
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig('chart_platform_engagement.png', dpi=300, bbox_inches='tight')
    print("✓ Created: chart_platform_engagement.png")

def create_summary_statistics(df):
    """Generate summary statistics table"""
    summary = df.groupby('Institution').agg({
        'Engagement_Rate': ['mean', 'median', 'std'],
        'Production_Quality': ['mean', 'median'],
        'Likes': 'mean',
        'Comments': 'mean',
        'Shares': 'mean'
    }).round(2)

    print("\n" + "="*80)
    print("SUMMARY STATISTICS BY INSTITUTION")
    print("="*80)
    print(summary.to_string())
    print("="*80 + "\n")

    # Save to CSV
    summary.to_csv('summary_statistics.csv')
    print("✓ Created: summary_statistics.csv")

def main():
    """Main execution function"""
    print("\n" + "="*80)
    print("QUALITATIVE ANALYSIS VISUALIZATION GENERATOR")
    print("="*80 + "\n")

    # Load data
    print("Loading data...")
    df = load_data()
    print(f"✓ Loaded {len(df)} content samples\n")

    # Generate all charts
    print("Generating visualizations...\n")
    create_content_category_chart(df)
    create_voice_tone_comparison(df)
    create_format_performance(df)
    create_production_quality_heatmap(df)
    create_voice_characteristics_radar()
    create_platform_engagement_comparison(df)

    # Generate summary stats
    print("\nGenerating summary statistics...")
    create_summary_statistics(df)

    print("\n" + "="*80)
    print("✓ ALL VISUALIZATIONS GENERATED SUCCESSFULLY!")
    print("="*80)
    print("\nGenerated files:")
    print("  • chart_content_categories.png")
    print("  • chart_tone_distribution.png")
    print("  • chart_format_performance.png")
    print("  • chart_production_quality.png")
    print("  • chart_voice_radar.png")
    print("  • chart_platform_engagement.png")
    print("  • summary_statistics.csv")
    print("\n")

if __name__ == "__main__":
    main()
