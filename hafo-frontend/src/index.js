import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import { CartProvider } from './context/CartContext'; // <-- 1. Import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. Bọc CartProvider ra ngoài App */}
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);