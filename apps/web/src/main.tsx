import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './i18n/config';
import './index.css';

// Initialize theme before React renders to prevent flash
const savedTheme = localStorage.getItem('theme') || 'system';
let effectiveTheme: 'light' | 'dark';

if (savedTheme === 'system') {
  effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
} else {
  effectiveTheme = savedTheme as 'light' | 'dark';
}

document.documentElement.classList.remove('light', 'dark');
document.documentElement.classList.add(effectiveTheme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
