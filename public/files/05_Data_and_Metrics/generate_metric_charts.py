"""
Generate Data and Metrics Charts
Creates quantitative analysis visualizations
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import warnings
warnings.filterwarnings('ignore')

sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10

print("\n" + "="*80)
print("DATA AND METRICS VISUALIZATION GENERATOR")
print("="*80 + "\n")

# Load data
print("Loading Instagram metrics...")
df_insta = pd.read_csv('instagram_metrics.csv')
df_insta['Date'] = pd.to_datetime(df_insta['Date'])
print(f"[OK] Loaded {len(df_insta)} Instagram data points\n")

print("Generating visualizations...\n")

# Chart 1: Follower Growth Over Time
print("[1/8] Creating follower growth timeline...")
fig, ax = plt.subplots(figsize=(14, 8))

for inst in df_insta['Institution'].unique():
    data = df_insta[df_insta['Institution'] == inst].sort_values('Date')
    ax.plot(data['Date'], data['Followers'], marker='o', linewidth=2.5,
            markersize=6, label=inst)

ax.set_title('Instagram Follower Growth (10 Months)', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Date', fontsize=12)
ax.set_ylabel('Followers', fontsize=12)
ax.legend(title='Institution', loc='upper left', fontsize=10)
ax.grid(True, alpha=0.3)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('chart_follower_growth.png', dpi=300, bbox_inches='tight')
print("[OK] chart_follower_growth.png")

# Chart 2: Current Follower Comparison (Latest Data)
print("[2/8] Creating current follower comparison...")
latest_data = df_insta[df_insta['Date'] == df_insta['Date'].max()]

fig, ax = plt.subplots(figsize=(12, 8))
bars = ax.bar(latest_data['Institution'], latest_data['Followers'],
              color=['#E74C3C' if x == 'YU' else '#3498DB' for x in latest_data['Institution']],
              edgecolor='black', linewidth=1.5)

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{int(height):,}',
            ha='center', va='bottom', fontsize=10, fontweight='bold')

ax.set_title('Instagram Followers - Current Comparison (October 2025)',
             fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Institution', fontsize=12)
ax.set_ylabel('Followers', fontsize=12)
ax.grid(axis='y', alpha=0.3)
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('chart_follower_comparison.png', dpi=300, bbox_inches='tight')
print("[OK] chart_follower_comparison.png")

# Chart 3: Engagement Rate Comparison
print("[3/8] Creating engagement rate comparison...")
latest_data_sorted = latest_data.sort_values('Engagement_Rate', ascending=True)

fig, ax = plt.subplots(figsize=(12, 8))
bars = ax.barh(latest_data_sorted['Institution'], latest_data_sorted['Engagement_Rate'],
               color=['#E74C3C' if x == 'YU' else '#2ECC71' for x in latest_data_sorted['Institution']],
               edgecolor='black', linewidth=1.5)

# Benchmark line
ax.axvline(x=2.99, color='red', linestyle='--', linewidth=2.5, alpha=0.7, label='Industry Benchmark (2.99%)')

# Add value labels
for bar in bars:
    width = bar.get_width()
    ax.text(width + 0.05, bar.get_y() + bar.get_height()/2.,
            f'{width:.2f}%',
            ha='left', va='center', fontsize=11, fontweight='bold')

ax.set_title('Instagram Engagement Rates vs. Industry Benchmark',
             fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Engagement Rate (%)', fontsize=12)
ax.set_ylabel('Institution', fontsize=12)
ax.legend(loc='lower right', fontsize=10)
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig('chart_engagement_comparison.png', dpi=300, bbox_inches='tight')
print("[OK] chart_engagement_comparison.png")

# Chart 4: Engagement Rate Trends
print("[4/8] Creating engagement rate trends...")
fig, ax = plt.subplots(figsize=(14, 8))

for inst in df_insta['Institution'].unique():
    data = df_insta[df_insta['Institution'] == inst].sort_values('Date')
    ax.plot(data['Date'], data['Engagement_Rate'], marker='o', linewidth=2.5,
            markersize=6, label=inst)

ax.axhline(y=2.99, color='red', linestyle='--', linewidth=2, alpha=0.6, label='Benchmark (2.99%)')

ax.set_title('Instagram Engagement Rate Trends (10 Months)', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Date', fontsize=12)
ax.set_ylabel('Engagement Rate (%)', fontsize=12)
ax.legend(title='Institution', loc='upper left', fontsize=9)
ax.grid(True, alpha=0.3)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('chart_engagement_trends.png', dpi=300, bbox_inches='tight')
print("[OK] chart_engagement_trends.png")

# Chart 5: Video Content Percentage
print("[5/8] Creating video content percentage comparison...")
fig, ax = plt.subplots(figsize=(12, 8))

video_data = latest_data.sort_values('Video_Percentage', ascending=False)
bars = ax.bar(video_data['Institution'], video_data['Video_Percentage'],
              color=['#E74C3C' if x == 'YU' else '#9B59B6' for x in video_data['Institution']],
              edgecolor='black', linewidth=1.5)

# Optimal range
ax.axhspan(60, 70, alpha=0.2, color='green', label='Optimal Range (60-70%)')

# Add value labels
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height + 1,
            f'{int(height)}%',
            ha='center', va='bottom', fontsize=11, fontweight='bold')

ax.set_title('Video Content Percentage by Institution', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Institution', fontsize=12)
ax.set_ylabel('Video Content (%)', fontsize=12)
ax.legend(loc='upper right', fontsize=10)
ax.grid(axis='y', alpha=0.3)
ax.set_ylim(0, 100)
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('chart_video_percentage.png', dpi=300, bbox_inches='tight')
print("[OK] chart_video_percentage.png")

# Chart 6: Posting Frequency Comparison
print("[6/8] Creating posting frequency comparison...")
fig, ax = plt.subplots(figsize=(12, 8))

freq_data = latest_data.sort_values('Posts_This_Week', ascending=True)
bars = ax.barh(freq_data['Institution'], freq_data['Posts_This_Week'],
               color=['#E74C3C' if x == 'YU' else '#F39C12' for x in freq_data['Institution']],
               edgecolor='black', linewidth=1.5)

# Optimal range
ax.axvspan(5, 6, alpha=0.2, color='green', label='Optimal Range (5-6 posts/week)')

# Add value labels
for bar in bars:
    width = bar.get_width()
    ax.text(width + 0.1, bar.get_y() + bar.get_height()/2.,
            f'{width:.1f}',
            ha='left', va='center', fontsize=11, fontweight='bold')

ax.set_title('Posting Frequency (Posts per Week)', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Posts per Week', fontsize=12)
ax.set_ylabel('Institution', fontsize=12)
ax.legend(loc='lower right', fontsize=10)
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig('chart_posting_frequency.png', dpi=300, bbox_inches='tight')
print("[OK] chart_posting_frequency.png")

# Chart 7: Gap Analysis Heatmap
print("[7/8] Creating performance gap heatmap...")
metrics_data = latest_data[['Institution', 'Followers', 'Engagement_Rate',
                             'Posts_This_Week', 'Video_Percentage']].set_index('Institution')

# Normalize to 0-100 scale for better visualization
metrics_normalized = metrics_data.copy()
for col in metrics_data.columns:
    max_val = metrics_data[col].max()
    metrics_normalized[col] = (metrics_data[col] / max_val) * 100

fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(metrics_normalized, annot=False, cmap='RdYlGn', vmin=0, vmax=100,
            cbar_kws={'label': 'Performance (% of Leader)'}, linewidths=1, linecolor='white')

# Add actual values as text
for i, inst in enumerate(metrics_normalized.index):
    for j, col in enumerate(metrics_normalized.columns):
        actual_value = metrics_data.iloc[i, j]
        if col == 'Followers':
            text = f'{int(actual_value/1000)}K'
        elif col == 'Engagement_Rate':
            text = f'{actual_value:.2f}%'
        elif col == 'Posts_This_Week':
            text = f'{actual_value:.1f}'
        else:
            text = f'{int(actual_value)}%'

        color = 'white' if metrics_normalized.iloc[i, j] < 50 else 'black'
        ax.text(j + 0.5, i + 0.5, text, ha='center', va='center',
                fontsize=10, fontweight='bold', color=color)

ax.set_title('Performance Heatmap (All Key Metrics)', fontsize=16, fontweight='bold', pad=20)
ax.set_xlabel('Metric', fontsize=12)
ax.set_ylabel('Institution', fontsize=12)
plt.tight_layout()
plt.savefig('chart_performance_heatmap.png', dpi=300, bbox_inches='tight')
print("[OK] chart_performance_heatmap.png")

# Chart 8: YU Performance Gap Analysis
print("[8/8] Creating YU gap analysis...")
yu_data = latest_data[latest_data['Institution'] == 'YU'].iloc[0]
avg_leaders = latest_data[latest_data['Institution'].isin(['NYU', 'Columbia', 'Maryland'])].mean(numeric_only=True)

gap_data = pd.DataFrame({
    'Metric': ['Followers', 'Engagement Rate', 'Posts/Week', 'Video Content %'],
    'YU': [yu_data['Followers'], yu_data['Engagement_Rate'],
           yu_data['Posts_This_Week'], yu_data['Video_Percentage']],
    'Market Leaders Avg': [avg_leaders['Followers'], avg_leaders['Engagement_Rate'],
                          avg_leaders['Posts_This_Week'], avg_leaders['Video_Percentage']]
})

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle('YU vs. Market Leaders - Gap Analysis', fontsize=18, fontweight='bold', y=0.995)

for idx, (ax, metric) in enumerate(zip(axes.flat, gap_data['Metric'])):
    row = gap_data[gap_data['Metric'] == metric]
    yu_val = row['YU'].values[0]
    leader_val = row['Market Leaders Avg'].values[0]

    bars = ax.bar(['YU', 'Market Leaders\nAverage'], [yu_val, leader_val],
                  color=['#E74C3C', '#2ECC71'], edgecolor='black', linewidth=2)

    # Add value labels
    for bar in bars:
        height = bar.get_height()
        if metric == 'Followers':
            label = f'{int(height/1000)}K'
        elif metric == 'Engagement Rate':
            label = f'{height:.2f}%'
        elif metric == 'Posts/Week':
            label = f'{height:.1f}'
        else:
            label = f'{int(height)}%'

        ax.text(bar.get_x() + bar.get_width()/2., height,
                label, ha='center', va='bottom', fontsize=12, fontweight='bold')

    # Calculate gap
    if metric == 'Followers':
        gap_pct = ((leader_val - yu_val) / yu_val) * 100
        ax.text(0.5, 0.95, f'Gap: {gap_pct:.0f}% ({int((leader_val-yu_val)/1000)}K followers)',
                transform=ax.transAxes, ha='center', va='top',
                bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.7),
                fontsize=10, fontweight='bold')
    else:
        gap = leader_val - yu_val
        ax.text(0.5, 0.95, f'Gap: +{gap:.1f} {"pts" if "%" in metric else ""}',
                transform=ax.transAxes, ha='center', va='top',
                bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.7),
                fontsize=10, fontweight='bold')

    ax.set_title(metric, fontsize=14, fontweight='bold', pad=10)
    ax.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('chart_yu_gap_analysis.png', dpi=300, bbox_inches='tight')
print("[OK] chart_yu_gap_analysis.png")

print("\n" + "="*80)
print("SUCCESS! ALL DATA & METRICS VISUALIZATIONS GENERATED")
print("="*80)
print("\nGenerated files:")
print("  1. chart_follower_growth.png")
print("  2. chart_follower_comparison.png")
print("  3. chart_engagement_comparison.png")
print("  4. chart_engagement_trends.png")
print("  5. chart_video_percentage.png")
print("  6. chart_posting_frequency.png")
print("  7. chart_performance_heatmap.png")
print("  8. chart_yu_gap_analysis.png")
print("\n")
