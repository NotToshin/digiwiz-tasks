import AccountGate from './features/accounts/AccountGate';
import { WorkspaceProvider } from './app/Workspace';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AccountGate><WorkspaceProvider><App /></WorkspaceProvider></AccountGate>
    </BrowserRouter>
  </StrictMode>,
);
