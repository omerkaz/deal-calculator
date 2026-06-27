# Client Proposal Page — Design Overhaul

## Your Task
Redesign `/Users/omerkaz/deal-calculator/client.html` with the design system below. Same content & JS logic, completely new visual layer.

## Design System

### Color Palette (Warm Medical Trust)
- **Background**: Warm linen `#FAF6F1` (not white, not gray)
- **Card surfaces**: Soft cream `#FFFDF9` with subtle warm shadow
- **Primary text**: Muted charcoal `#2D2A26` (not black)
- **Secondary text**: Warm gray `#7A756E`
- **Muted/labels**: `#A8A29E`
- **Accent (positive/CTA)**: Warm teal `#2A9D8F`
- **Accent hover**: `#238B80`
- **Accent glow**: `rgba(42, 157, 143, 0.12)`
- **Loss/negative**: Soft coral `#E76F51`
- **Loss glow**: `rgba(231, 111, 81, 0.10)`
- **Subtle dividers**: `rgba(0,0,0,0.06)`
- **Hero/top section**: Deep warm charcoal `#1E1B18` → `#2D2A26` gradient

### Typography
- **Headlines**: `DM Serif Display` from Google Fonts — editorial authority, warmth
- **Body/UI**: `Inter` — modern, precise, clean for data
- **Headline sizes**: Hero 2.5rem, Section 1.5rem, Subsection 1.1rem
- **Body**: 0.9rem, line-height 1.65
- **Labels/caps**: Inter 0.7rem, weight 600, uppercase, letter-spacing 1px

### Texture & Depth
- **SVG grain overlay**: feTurbulence noise, 5-8% opacity, mix-blend-mode overlay, covers full page
- **Soft radial gradients**: Subtle warm blobs in hero and between sections
- **Card shadows**: `0 2px 20px rgba(45, 42, 38, 0.06)` — warm, not cold
- **No hard borders on cards**: Use shadow + background contrast only
- **Rounded corners**: 14px cards, 10px inner elements

### Emotional Arc (scroll progression)
```
Hero:       Dark, warm charcoal — serious, "here's the truth"
Problem:    Soft coral tints — tension, what you're losing  
Features:   Warm cream — calm, here's the solution
Calculator: Clean linen — precise, interactive
Results:    Teal accents emerge — growth, positive
Pricing:    Warm cream, teal CTA — confidence
Next Steps: Warmest section — invitation, human connection
```

### Component Patterns
- **Stat cards**: No border, cream bg, warm shadow, serif number, sans label
- **Feature items**: Icon in teal-tinted circle, left-aligned, generous padding
- **Pricing cards**: No border, shadow differentiation, middle card slightly elevated
- **Comparison (problem/solution)**: Coral-tinted left, teal-tinted right
- **ROI bars**: Rounded, coral for cost, teal for revenue
- **Table**: Minimal lines, generous row padding, alternating very subtle bg
- **CTA button**: Warm teal, rounded pill, soft glow shadow on hover

### Icons
- Keep Lucide icons from `https://unpkg.com/lucide@latest`
- Icon colors should match section accent (teal for features, coral for loss, charcoal for neutral)

### Animations
- Scroll-triggered fade-up (IntersectionObserver, stagger children)
- Number counter animation on stat cards when they enter viewport
- Subtle hover lift on cards (translateY -2px + shadow deepen)

### Key CSS Techniques
```css
/* SVG grain overlay — add as ::after on body or a fixed div */
.grain {
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* Warm vignette */
.vignette {
  position: fixed; inset: 0; z-index: 9998;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(30,27,24,0.04) 100%);
}
```

### What NOT to Do
- No navy or cold blue anywhere
- No hard 1px borders on cards
- No emoji icons (all Lucide)
- No flat white backgrounds
- No black text
- No generic "SaaS template" feel

## Deployment
After editing, commit and push:
```bash
cd /Users/omerkaz/deal-calculator
git add client.html
git commit -m "feat: warm medical-trust design system with grain texture and serif typography"
git push
```
GitHub Actions will auto-deploy to `https://omerkaz.github.io/deal-calculator/client.html`

## Reference
- Current file: `/Users/omerkaz/deal-calculator/client.html`
- Lucide CDN already included in `<head>`
- Google Fonts: add `DM Serif Display` alongside existing Inter
- All JS calculator logic stays the same — only restyle the visual layer
