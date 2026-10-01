import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';

// Site icon: the cropped GROUP PROJECT logo in its own colors on a cream square.
// The logo is drawn with "multiply", so a white background in the image
// turns cream instead of leaving a white box.
const CREAM = '#F6F1E8';

// Just the two faces — the middle band of the logo, without the GROUP / PROJECT
// lettering, so the icon reads at tab size. Fractions of the source image.
const FACES = { x: 0.10, y: 0.23, w: 0.80, h: 0.54 };

function stampIcon(src: string) {
  const img = new Image();
  img.onload = () => {
    const make = (size: number) => {
      const sx = img.width * FACES.x, sy = img.height * FACES.y;
      const sw = img.width * FACES.w, sh = img.height * FACES.h;
      const pad = Math.round(size * 0.05);
      const box = size - pad * 2;
      const scale = Math.min(box / sw, box / sh);
      const w = Math.round(sw * scale), h = Math.round(sh * scale);
      const out = document.createElement('canvas');
      out.width = size; out.height = size;
      const oc = out.getContext('2d')!;
      oc.imageSmoothingQuality = 'high';
      oc.drawImage(img, sx, sy, sw, sh, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
      // Knock the paper-white background out to transparent: the whiter a pixel,
      // the more see-through it becomes. The saturated blue and green lines stay.
      try {
        const px = oc.getImageData(0, 0, size, size);
        const d = px.data;
        for (let i = 0; i < d.length; i += 4) {
          const white = Math.min(d[i], d[i + 1], d[i + 2]);
          d[i + 3] = Math.min(d[i + 3], 255 - white);
        }
        oc.putImageData(px, 0, 0);
      } catch { /* cross-origin image: leave it as drawn */ }
      return out.toDataURL('image/png');
    };
    try {
      const setLink = (rel: string, href: string) => {
        let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
        if (!link) { link = document.createElement('link'); link.rel = rel; document.head.appendChild(link); }
        link.href = href;
      };
      setLink('icon', make(64));
      setLink('apple-touch-icon', make(180));
    } catch { /* keep the plain cream square */ }
  };
  img.src = src;
}

// The builder loads the logo into a hidden image in the page shell; we pick it up from there.
function watchForLogo() {
  const find = () => document.querySelector<HTMLImageElement>('img[data-asset="logo-cropped"]')?.getAttribute('src');
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