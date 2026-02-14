# Prayer Odyssey Landing Page

A standalone HTML landing page for the Prayer Odyssey app that can be deployed to any static hosting service.

## Files

- `index.html` - Main landing page (self-contained with all styles inline)
- `prayer_icon_logo_512.png` - Prayer Odyssey app logo
- `dillieo_digital_logo_192.png` - Dillieo Digital branding logo

## Features

- ✅ Responsive design (mobile-first)
- ✅ Dark theme matching the app
- ✅ "NOW LIVE" announcement with pulsing animation
- ✅ Direct links to:
  - App: https://app.prayerodyssey.com
  - Discord: https://discord.gg/prayerodyssey
- ✅ "What's Coming" features section
- ✅ SEO optimized meta tags
- ✅ Accessibility features (alt text, semantic HTML)

## Deployment

This landing page can be deployed to any static hosting service:

### Quick Deployment Options

1. **Netlify**
   ```bash
   # Drag and drop the landing folder to netlify.com
   # Or use Netlify CLI
   npm install -g netlify-cli
   netlify deploy --dir=landing --prod
   ```

2. **Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   vercel --prod
   ```

3. **GitHub Pages**
   - Upload the landing folder to a GitHub repository
   - Enable GitHub Pages in repository settings
   - Select source as "main" branch and "/landing" folder

4. **Firebase Hosting**
   ```bash
   firebase init hosting
   firebase deploy --only hosting
   ```

5. **Traditional Web Hosting**
   - Simply upload all files in the landing folder to your web server's public directory

## Customization

### Changing Links
Edit the following lines in `index.html`:
```html
<a href="https://app.prayerodyssey.com" class="btn btn-primary">
<a href="https://discord.gg/prayerodyssey" class="btn btn-secondary">
```

### Updating Colors
The color scheme is defined in the `<style>` section:
- Background: `#020617` (slate-950)
- Primary: `#6366f1` (indigo-500)
- Success: `#10b981` (emerald-500)

### Adding Content
- Edit the hero section text
- Modify the features grid
- Update footer information

## Browser Support

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Mobile Android 90+

## Performance

- ✅ Optimized images (WebP format recommended for production)
- ✅ Inline CSS (no external dependencies)
- ✅ Semantic HTML5
- ✅ Responsive images
- ✅ Minimal JavaScript (none required for core functionality)

## License

This landing page is part of the Prayer Odyssey project.
