import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './index.css';

console.log('Renderer initializing...');

const container = document.getElementById('root');
console.log('Root container:', container);

if (!container) {
    console.error('Root element not found!');
    throw new Error('Root element not found');
}

console.log('Creating React root and rendering App...');
const root = createRoot(container);
root.render(React.createElement(App));
console.log('App rendered successfully');
