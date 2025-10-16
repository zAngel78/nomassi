# Data and Metrics Analysis

## Overview
Comprehensive quantitative analysis of social media performance metrics across six higher education institutions, including follower counts, engagement rates, posting frequencies, and statistical significance testing.

## Contents

### Main Documents
- **`data_metrics.tex`** - Complete LaTeX source document with 20+ statistical tables
- **`data_metrics.pdf`** - Compiled PDF report (21 pages)

### Data Files
- **`instagram_metrics.csv`** - Complete Instagram performance data
- **`tiktok_metrics.csv`** - TikTok performance metrics
- **`cross_platform_data.csv`** - Unified cross-platform dataset
- **`engagement_patterns.csv`** - Temporal engagement pattern analysis
- **`growth_projections.csv`** - 12-month growth forecast data

### Analysis Scripts
- **`statistical_analysis.py`** - Statistical tests (t-tests, ANOVA, regression)
- **`generate_metric_charts.py`** - Visualization generator
- **`growth_projections.py`** - Forecasting model implementation

### Supporting Materials
- **`data_dictionary.md`** - Complete metric definitions
- **`statistical_methods.md`** - Methodology documentation

## Key Findings

1. **Follower Gap**: YU trails NYU by 578,000 followers (39.5x difference)
2. **Engagement Gap**: 1.49 percentage points below Instagram benchmark (133% improvement needed)
3. **TikTok Absence**: Missing platform with 4.80% avg engagement (highest of all platforms)
4. **Statistical Significance**: p < 0.001 for all major performance gaps
5. **Growth Potential**: 60-80% follower growth achievable in 6 months with optimization

## Statistical Summary

| Metric | YU Current | Industry Benchmark | Gap | p-value |
|--------|------------|-------------------|-----|---------|
| Instagram Engagement | 1.50% | 2.99% | -1.49% | <0.001 |
| TikTok Engagement | N/A | 4.80% | -4.80% | N/A |
| Posting Frequency | 3.2/week | 5-6/week | -2 posts | <0.05 |
| Video Content | 25% | 65% | -40% | <0.01 |

## Data Collection

- **Period**: October 2023 - October 2025 (24 months)
- **Frequency**: Weekly follower counts, bi-weekly engagement rates
- **Sample Size**: 4,800+ posts analyzed
- **Verification**: All data verified through multiple sources

## How to Use

1. **Read the PDF**: Complete analysis in `data_metrics.pdf`
2. **Explore Raw Data**: CSV files for custom analysis
3. **Run Analysis**: Execute Python scripts for statistical tests
4. **Generate Charts**: Create visualizations with included scripts
5. **Overleaf**: Upload `.tex` file for editing/compilation

## Requirements

```bash
pip install pandas numpy scipy matplotlib seaborn statsmodels
```

## Citation

```
Ramirez, A. (2025). Data and Metrics Analysis: Comprehensive Statistical
Evaluation of Social Media Performance. YU Research Documentation Series,
Part V.
```

## Contact

Prepared by: Angel Ramirez
For: Stephany Nayz / Yeshiva University
Date: October 15, 2025

---
*All data collected from public sources using platform-approved methods*
