import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { newSeed } from './app/seed';
import { createAppStore } from './app/store';
import { CONTENT } from './content';
import { App } from './ui/App';
import { browserStore } from './ui/storage';
import { AppStoreProvider } from './ui/store';

const store = createAppStore({ content: CONTENT, storage: browserStore(), newSeed });

const root = document.getElementById('root');
if (!root) throw new Error('main: #root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <AppStoreProvider store={store}>
      <App />
    </AppStoreProvider>
  </StrictMode>,
);
