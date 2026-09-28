import { HashRouter, Routes, Route } from 'react-router-dom';
import Shell from '@/components/Shell';
import Catalog from '@/pages/Catalog';
import ItemDetail from '@/pages/ItemDetail';
import RequestPage from '@/pages/RequestPage';
import RequestSent from '@/pages/RequestSent';
import Reflect from '@/pages/Reflect';
import Librarian from '@/pages/Librarian';
import About from '@/pages/About';

export default function App() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/items/:slug" element={<ItemDetail />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/request/sent/:groupId" element={<RequestSent />} />
          <Route path="/reflect/:token" element={<Reflect />} />
          <Route path="/librarian" element={<Librarian />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Catalog />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}