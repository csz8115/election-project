import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from '../routes/login'
import './index.css'
import {
  RouterProvider,
} from "react-router-dom";
import { router } from '../routes/router'
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';


// Create the QueryClient
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60, // 24 hours
    },
  },
});

// Persist the cache
persistQueryClient({
  queryClient,
  persister,
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    </CookiesProvider>
  </QueryClientProvider>
)
