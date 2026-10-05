import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import {formRepository} from './repositories/formRepository';
import './index.css';

const root = createRoot(document.getElementById('root')!);

// Load customized form schemas from the database before the first render
formRepository.init().finally(() => {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
