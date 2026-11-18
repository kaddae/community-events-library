import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';

// Site icon: the whole "cropped" logo (black lines, see-through background) on
// a solid square in the site's yellow, so it reads on light and dark tab bars
// and on a phone's home screen. Same color as theme-color in index.html.
const TILE = '#FFFC88';

function stampIcon(src: string) {
  const img = new Image();
  img.onload = () => {
    if (!img.width || !img.height) return;
    // rounded: the tab icon gets soft corners. The home-screen icon stays a
    // full square, since phones round it themselves.
    const make = (size: number, rounded: boolean) => {
      const out = document.createElement('canvas');
      out.width = size; out.height = size;
      const oc = out.getContext('2d')!;
      if (rounded) {
        const r = size * 0.18;
        oc.beginPath();
        oc.moveTo(r, 0);
        oc.arcTo(size, 0, size, size, r);
        oc.arcTo(size, size, 0, size, r);
        oc.arcTo(0, size, 0, 0, r);
        oc.arcTo(0, 0, size, 0, r);
        oc.closePath();
        oc.clip();
      }
      oc.fillStyle = TILE;
      oc.fillRect(0, 0, size, size);
      // The whole picture, proportions kept, with a small margin.
      const box = size - Math.round(size * 0.1) * 2;
      const scale = Math.min(box / img.width, box / img.height);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      oc.imageSmoothingQuality = 'high';
      // "multiply" keeps the black lines; any white in the picture takes the tile's color.
      oc.globalCompositeOperation = 'multiply';
      oc.drawImage(img, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
      return out.toDataURL('image/png');
    };
    try {
      const setLink = (rel: string, href: string) => {
        let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
        if (!link) { link = document.createElement('link'); link.rel = rel; document.head.appendChild(link); }
        link.href = href;
      };
      setLink('icon', make(64, true));
      setLink('apple-touch-icon', make(180, false));
    } catch { /* keep the blank placeholder icon from index.html */ }
  };
  img.src = src;
}

// The builder loads the logo into a hidden image in the page shell; we pick it up from there.
function watchForLogo() {
  const find = () => document.querySelector<HTMLImageElement>('img[data-asset="cropped"]')?.getAttribute('src');
  const found = find();
  if (found) { stampIcon(found); return; }
  const obs = new MutationObserver(() => {
    const src = find();
    if (src) { obs.disconnect(); stampIcon(src); }
  });
  obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
  setTimeout(() => obs.disconnect(), 15000);
}
watchForLogo();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);