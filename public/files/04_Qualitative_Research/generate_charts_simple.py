"""
Generate Qualitative Analysis Charts - Simplified Version
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10

print("\n" + "="*80)
print("QUALITATIVE ANALYSIS VISUALIZATION GENERATOR")
print("="*80 + "\n")

# Load data
print("Loading data...")
df = pd.read_csv('content_coding_data.csv')
print(f"[OK] Loaded {len(df)} content samples\n")

print("Generating visualizations...\n")

# Chart 1: Content Category Distribution
print("[1/6] Creating content category chart...")
category_counts = df.groupby(['Institution', 'Content_Category']).size().unstack(fill_value=0)
category_pct = category_counts.div(category_counts.sum(axis=1), axis=0) * 100

fig, ax = plt.subplots(figsize=(14, 8))
category_pct.T.plot(kind='bar', ax=ax, width=0.8, colormap='Set2')
ax.set_title('Content Category Distribution by Institution', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Content Category', fontsize=12)
ax.set_ylabel('Percentage of Posts (%)', fontsize=12)
ax.legend(title='Institution', bbox_to_anchor=(1.05, 1), loc='upper left')
ax.grid(axis='y', alpha=0.3)
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('chart_content_categories.png', dpi=300, bbox_inches='tight')
print("[OK] chart_content_categories.png")

# Chart 2: Tone Distribution
print("[2/6] Creating tone distribution chart...")
tone_counts = df.groupby(['Institution', 'Tone']).size().unstack(fill_value=0)
tone_pct = tone_counts.div(tone_counts.sum(axis=1), axis=0) * 100

fig, ax = plt.subplots(figsize=(12, 8))
tone_pct.plot(kind='bar', ax=ax, stacked=True, colormap='Pastel1')
ax.set_title('Tone Distribution Across Institutions', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Institution', fontsize=12)
ax.set_ylabel('Percentage of Posts (%)', fontsize=12)
ax.legend(title='Tone', bbox_to_anchor=(1.05, 1), loc='upper left')
ax.grid(axis='y', alpha=0.3)
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('chart_tone_distribution.png', dpi=300, bbox_inches='tight')
print("[OK] chart_tone_distribution.png")

# Chart 3: Format Performance
print("[3/6] Creating format performance chart...")
format_engagement = df.groupby(['Institution', 'Format'])['Engagement_Rate'].mean().unstack()

fig, ax = plt.subplots(figsize=(14, 8))
format_engagement.plot(kind='bar', ax=ax, width=0.8, colormap='Set3')
ax.set_title('Average Engagement Rate by Content Format', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Institution', fontsize=12)
ax.set_ylabel('Engagement Rate (%)', fontsize=12)
ax.legend(title='Format', bbox_to_anchor=(1.05, 1), loc='upper left')
ax.grid(axis='y', alpha=0.3)
ax.axhline(y=2.99, color='red', linestyle='--', linewidth=2, alpha=0.7, label='Industry Benchmark')
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('chart_format_performance.png', dpi=300, bbox_inches='tight')
print("[OK] chart_format_performance.png")

# Chart 4: Production Quality Heatmap
print("[4/6] Creating production quality heatmap...")
quality_avg = df.groupby(['Institution', 'Format'])['Production_Quality'].mean().unstack()

fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(quality_avg, annot=True, fmt='.1f', cmap='RdYlGn',
            vmin=6, vmax=10, ax=ax, cbar_kws={'label': 'Quality Score'},
            linewidths=1, linecolor='white')
ax.set_title('Production Quality Scores by Institution and Format',
             fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Content Format', fontsize=12)
ax.set_ylabel('Institution', fontsize=12)
plt.tight_layout()
plt.savefig('chart_production_quality.png', dpi=300, bbox_inches='tight')
print("[OK] chart_production_quality.png")

# Chart 5: Voice Characteristics Radar
print("[5/6] Creating voice characteristics radar...")
categories = ['Formality\n(Inverted)', 'Authenticity', 'Personality',
              'Relatability', 'Energy', 'Humor', 'Emotional\nTone', 'Consistency']

institutions = {
    'YU': [2.5, 6.0, 5.5, 5.2, 6.0, 3.5, 6.5, 7.8],
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
    ax.plot(angles, values, 'o-', linewidth=2.5, label=inst, color=colors[inst], markersize=8)
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
print("[OK] chart_voice_radar.png")

# Chart 6: Platform Engagement
print("[6/6] Creating platform engagement comparison...")
platform_engagement = df.groupby(['Institution', 'Platform'])['Engagement_Rate'].mean().unstack()

fig, ax = plt.subplots(figsize=(12, 8))
platform_engagement.plot(kind='bar', ax=ax, width=0.7, colormap='viridis')
ax.set_title('Average Engagement Rate by Platform', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Institution', fontsize=12)
ax.set_ylabel('Engagement Rate (%)', fontsize=12)
ax.legend(title='Platform', bbox_to_anchor=(1.05, 1), loc='upper left')
ax.grid(axis='y', alpha=0.3)
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('chart_platform_engagement.png', dpi=300, bbox_inches='tight')
print("[OK] chart_platform_engagement.png")

# Summary Statistics
print("\nGenerating summary statistics...")
summary = df.groupby('Institution').agg({
    'Engagement_Rate': ['mean', 'median', 'std'],
    'Production_Quality': ['mean', 'median'],
    'Likes': 'mean',
    'Comments': 'mean',
    'Shares': 'mean'
}).round(2)

summary.to_csv('summary_statistics.csv')
print("[OK] summary_statistics.csv")

print("\n" + "="*80)
print("SUCCESS! ALL VISUALIZATIONS GENERATED")
print("="*80)
print("\nGenerated files:")
print("  1. chart_content_categories.png")
print("  2. chart_tone_distribution.png")
print("  3. chart_format_performance.png")
print("  4. chart_production_quality.png")
print("  5. chart_voice_radar.png")
print("  6. chart_platform_engagement.png")
print("  7. summary_statistics.csv")
print("\n")
