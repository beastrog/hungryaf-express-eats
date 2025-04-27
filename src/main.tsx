
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './hooks/use-theme';
import { CartProvider } from './hooks/use-cart';
import { AuthProvider } from './hooks/use-auth';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
);
