import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configurar el generador de números aleatorios para consistencia
np.random.seed(42)

def generate_dates(start_date, num_days):
    return [start_date + timedelta(days=x) for x in range(num_days)]

def generate_platform_metrics(base_followers, base_engagement, num_days, growth_rate=0.001):
    followers = []
    engagement_rates = []
    likes = []
    comments = []
    shares = []
    current_followers = base_followers
    
    for _ in range(num_days):
        # Simular crecimiento orgánico con variación
        growth = np.random.normal(growth_rate, growth_rate/3)
        current_followers *= (1 + growth)
        followers.append(int(current_followers))
        
        # Generar métricas de engagement con variación realista
        daily_engagement = np.random.normal(base_engagement, base_engagement/4)
        engagement_rates.append(round(max(0, daily_engagement), 3))
        
        # Generar interacciones
        daily_likes = int(current_followers * daily_engagement * 0.7)
        daily_comments = int(current_followers * daily_engagement * 0.2)
        daily_shares = int(current_followers * daily_engagement * 0.1)
        
        likes.append(daily_likes)
        comments.append(daily_comments)
        shares.append(daily_shares)
    
    return followers, engagement_rates, likes, comments, shares

def generate_content_metrics(num_days):
    content_types = ['Photo', 'Video', 'Carousel', 'Reel', 'Story']
    daily_content = []
    
    for _ in range(num_days):
        content_dict = {}
        for content_type in content_types:
            # Generar número aleatorio de posts por tipo
            posts = np.random.randint(0, 4)
            engagement = np.random.normal(0.02, 0.005) if content_type in ['Video', 'Reel'] else np.random.normal(0.015, 0.003)
            content_dict[f'{content_type}_Posts'] = posts
            content_dict[f'{content_type}_Engagement'] = round(max(0, engagement), 3)
        daily_content.append(content_dict)
    
    return daily_content

def main():
    # Configuración inicial
    start_date = datetime(2025, 1, 1)
    num_days = 180  # 6 meses de datos
    
    # Configuración por plataforma
    platforms = {
        'Instagram': {'followers': 15000, 'engagement': 0.015},
        'TikTok': {'followers': 0, 'engagement': 0},
        'Facebook': {'followers': 12000, 'engagement': 0.009},
        'LinkedIn': {'followers': 8000, 'engagement': 0.012},
        'Twitter': {'followers': 5000, 'engagement': 0.008}
    }
    
    # Generar datos para cada plataforma
    platform_data = {}
    for platform, metrics in platforms.items():
        followers, engagement, likes, comments, shares = generate_platform_metrics(
            metrics['followers'],
            metrics['engagement'],
            num_days
        )
        
        platform_data[platform] = {
            'Followers': followers,
            'Engagement_Rate': engagement,
            'Likes': likes,
            'Comments': comments,
            'Shares': shares
        }
    
    # Generar métricas de contenido
    content_metrics = generate_content_metrics(num_days)
    
    # Crear DataFrames
    dates = generate_dates(start_date, num_days)
    
    # DataFrame de métricas por plataforma
    platform_dfs = {}
    for platform, data in platform_data.items():
        df = pd.DataFrame(data)
        df['Date'] = dates
        platform_dfs[platform] = df
    
    # DataFrame de métricas de contenido
    content_df = pd.DataFrame(content_metrics)
    content_df['Date'] = dates
    
    # Guardar en Excel con múltiples hojas
    with pd.ExcelWriter('social_media_metrics.xlsx', engine='openpyxl') as writer:
        # Hojas de plataformas
        for platform, df in platform_dfs.items():
            df.to_excel(writer, sheet_name=platform, index=False)
        
        # Hoja de contenido
        content_df.to_excel(writer, sheet_name='Content_Metrics', index=False)
        
        # Hoja de resumen
        summary_data = {
            'Platform': [],
            'Initial_Followers': [],
            'Final_Followers': [],
            'Growth_Rate': [],
            'Avg_Engagement': [],
            'Total_Interactions': []
        }
        
        for platform, df in platform_dfs.items():
            summary_data['Platform'].append(platform)
            summary_data['Initial_Followers'].append(df['Followers'].iloc[0])
            summary_data['Final_Followers'].append(df['Followers'].iloc[-1])
            summary_data['Growth_Rate'].append(
                round((df['Followers'].iloc[-1] - df['Followers'].iloc[0]) / df['Followers'].iloc[0] * 100, 2)
            )
            summary_data['Avg_Engagement'].append(round(df['Engagement_Rate'].mean() * 100, 2))
            summary_data['Total_Interactions'].append(
                df['Likes'].sum() + df['Comments'].sum() + df['Shares'].sum()
            )
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)

if __name__ == "__main__":
    main()
