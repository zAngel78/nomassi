# 🎓 Universal University Social Media Scraper

Script universal para scrapear todas las plataformas de redes sociales de múltiples universidades con un solo comando.

## 🏫 Universidades Configuradas

- ✅ **Yeshiva University** (`yeshiva`)
- ✅ **New York University** (`nyu`)
- ✅ **Brandeis University** (`brandeis`)
- ✅ **Columbia University** (`columbia`)
- ✅ **Touro University** (`touro`)

## 📱 Plataformas Soportadas

- 📸 **Instagram** - Posts, engagement, followers
- 👥 **Facebook** - Posts, likes, comments
- 🐦 **Twitter/X** - Tweets, retweets
- 📺 **YouTube** - Videos, views, stats
- 📢 **Meta Ads Library** - Active campaigns, ad creative

## 🚀 Uso Rápido

### Scrapear TODAS las plataformas de una universidad:

```bash
node scrape-all-university.js nyu
node scrape-all-university.js brandeis
node scrape-all-university.js columbia
```

### Scrapear solo ciertas plataformas:

```bash
# Solo Instagram y Facebook
node scrape-all-university.js nyu instagram,facebook

# Solo Meta Ads
node scrape-all-university.js brandeis meta-ads

# Instagram, YouTube y Meta Ads
node scrape-all-university.js columbia instagram,youtube,meta-ads
```

## 📊 Salida de Datos

Todos los datos se guardan en carpetas organizadas:

```
public/
├── instagram_data/
│   ├── nyu_posts.json
│   ├── brandeis_posts.json
│   └── columbia_posts.json
├── facebook_data/
│   ├── nyu_posts.json
│   └── ...
├── twitter_data/
├── youtube_data/
├── meta_ads_data/
└── social_data/
    ├── nyu/
    │   └── scrape_report.json  ← Resumen completo
    ├── brandeis/
    └── columbia/
```

## 🔧 Configuración

Todas las universidades están configuradas en `universities-config.json`:

```json
{
  "nyu": {
    "name": "New York University",
    "instagram": "nyuniversity",
    "facebook": "NYU",
    "twitter": "nyuniversity",
    "youtube": "nyuniversity",
    "meta_ads": "New York University"
  }
}
```

### Agregar nueva universidad:

1. Edita `universities-config.json`
2. Agrega un nuevo objeto con los handles correctos
3. ¡Listo! Ya puedes scrapear

## 📋 Ejemplos de Uso

### Scrapear NYU completo:
```bash
node scrape-all-university.js nyu
```

**Output:**
```
🎓 Starting scrape for: New York University
📁 Output folder: nyu
🎯 Platforms to scrape: instagram, facebook, twitter, youtube, meta-ads

📸 Scraping Instagram (@nyuniversity)...
   ✓ Found 50 Instagram posts

👥 Scraping Facebook (NYU)...
   ✓ Found 50 Facebook posts

🐦 Scraping Twitter (@nyuniversity)...
   ✓ Found 50 tweets

📺 Scraping YouTube (nyuniversity)...
   ✓ Found 20 YouTube videos

📢 Scraping Meta Ads Library...
   ✓ Found 25 Meta Ads

✅ SCRAPING COMPLETED for New York University
📊 Report saved to: public/social_data/nyu/scrape_report.json
```

### Scrapear solo Instagram de todas las universidades:

```bash
node scrape-all-university.js yeshiva instagram
node scrape-all-university.js nyu instagram
node scrape-all-university.js brandeis instagram
node scrape-all-university.js columbia instagram
node scrape-all-university.js touro instagram
```

### Scrapear todo en batch (todas las universidades):

Crea un script bash/PowerShell:

**scrape-all.sh:**
```bash
#!/bin/bash
for uni in yeshiva nyu brandeis columbia touro; do
  echo "Scraping $uni..."
  node scrape-all-university.js $uni
  sleep 30  # Wait 30 seconds between universities
done
```

**scrape-all.ps1 (PowerShell):**
```powershell
$universities = @('yeshiva', 'nyu', 'brandeis', 'columbia', 'touro')
foreach ($uni in $universities) {
  Write-Host "Scraping $uni..."
  node scrape-all-university.js $uni
  Start-Sleep -Seconds 30
}
```

## ⚙️ Opciones Avanzadas

### Cambiar límites de resultados:

Edita el script y modifica:
- `resultsLimit: 50` para Instagram/Facebook
- `maxTweets: 50` para Twitter
- `maxResults: 20` para YouTube
- `maxItems: 25` para Meta Ads

### Filtrar plataformas específicas:

```javascript
// En el archivo de config, puedes poner null para deshabilitar
{
  "touro": {
    "twitter": null  // No scrapear Twitter para Touro
  }
}
```

## 💰 Costos de Apify

| Plataforma | Costo aproximado | Posts |
|------------|------------------|-------|
| Instagram | $0.10 | 50 posts |
| Facebook | $0.15 | 50 posts |
| Twitter | $0.05 | 50 tweets |
| YouTube | $0.08 | 20 videos |
| Meta Ads | $0.20 | 25 ads |
| **TOTAL por universidad** | **~$0.58** | **All platforms** |

**Para 5 universidades:** ~$2.90 total

Tu cuenta gratuita de Apify tiene **$5 de crédito mensual**, suficiente para scrapear todas las universidades cada mes.

## 🐛 Troubleshooting

### Error: "Invalid token"
```bash
# Set your Apify token
export APIFY_TOKEN="your_token_here"
# Or edit the script and replace the token
```

### Error: "Actor not found"
Algunos actors requieren suscripción. El script usa:
- `apify/instagram-scraper`
- `apify/facebook-pages-scraper`
- `apify/twitter-scraper`
- `apify/youtube-scraper`
- `memo23/facebook-ads-library-scraper-cheerio`

### Error: "University not found"
```bash
# Ver universidades disponibles
node scrape-all-university.js
```

## 📈 Próximos Pasos

Después de scrapear todas las universidades:

1. **Análisis Comparativo** - Compara engagement rates
2. **Gráficos** - Genera visualizaciones
3. **Dashboard** - Actualiza el frontend con datos de todas
4. **Reportes** - Genera PDFs con comparativas

## 🔄 Actualización de Datos

Recomendado ejecutar mensualmente para mantener datos frescos:

```bash
# Primera semana de cada mes
node scrape-all-university.js yeshiva
node scrape-all-university.js nyu
node scrape-all-university.js brandeis
node scrape-all-university.js columbia
node scrape-all-university.js touro
```

## 📞 Soporte

- Revisa logs en consola para detalles de errores
- Verifica los JSON generados en `/public/`
- Chequea `scrape_report.json` para resumen completo
