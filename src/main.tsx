import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {formRepository} from './repositories/formRepository';
import './index.css';

const root = createRoot(document.getElementById('root')!);

// Load customized form schemas from the database before the first render
formRepository.init().finally(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
