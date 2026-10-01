import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';

// Site icon: the GROUP PROJECT logo in cream on a forest-green square.
// The logo comes from the footer image once the builder has loaded it.
// Dark pixels turn cream and light pixels turn clear, so it works whether
// the logo has a white background or a see-through one.
function stampIcon(src: string) {
  const img = new Image();
  img.onload = () => {
    const make = (size: number) => {
      const pad = Math.round(size * 0.12);
      const box = size - pad * 2;
      const scale = Math.min(box / img.width, box / img.height);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const logo = document.createElement('canvas');
      logo.width = w; logo.height = h;
      const lc = logo.getContext('2d')!;
      lc.drawImage(img, 0, 0, w, h);
      const data = lc.getImageData(0, 0, w, h);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
        px[i + 3] = Math.round((1 - lum) * px[i + 3]);
        px[i] = 0xf6; px[i + 1] = 0xf1; px[i + 2] = 0xe8;
      }
      lc.putImageData(data, 0, 0);
      const out = document.createElement('canvas');
      out.width = size; out.height = size;
      const oc = out.getContext('2d')!;
      oc.fillStyle = '#1F4A38';
      oc.fillRect(0, 0, size, size);
      oc.drawImage(logo, Math.round((size - w) / 2), Math.round((size - h) / 2));
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
    } catch { /* keep the plain green square */ }
  };
  img.src = src;
}

function watchForLogo() {
  const find = () => document.querySelector<HTMLImageElement>('img[data-asset="logo-d"]')?.getAttribute('src');
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