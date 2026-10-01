import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';

// Site icon: the cropped GROUP PROJECT logo in its own colors on a cream square.
// The logo is drawn with "multiply", so a white background in the image
// turns cream instead of leaving a white box.
const CREAM = '#F6F1E8';

function stampIcon(src: string) {
  const img = new Image();
  img.onload = () => {
    const make = (size: number) => {
      const pad = Math.round(size * 0.06);
      const box = size - pad * 2;
      const scale = Math.min(box / img.width, box / img.height);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const out = document.createElement('canvas');
      out.width = size; out.height = size;
      const oc = out.getContext('2d')!;
      oc.fillStyle = CREAM;
      oc.fillRect(0, 0, size, size);
      oc.imageSmoothingQuality = 'high';
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