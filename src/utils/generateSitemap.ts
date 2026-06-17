const SITE_URL = 'https://expeditionoz.netlify.app'

const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/expeditions', priority: '0.9', changefreq: 'weekly' },
  { path: '/expeditions/ocean-safari', priority: '0.8', changefreq: 'weekly' },
  { path: '/expeditions/dive-expedition', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
]

export function generateSitemap(): string {
  const today = new Date().toISOString().split('T')[0]
  
  const urls = routes.map(route => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
