import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from '../routes/login'
import './index.css'
import {
  RouterProvider,
} from "react-router-dom";
import { router } from '../routes/router'
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    </CookiesProvider>
  </QueryClientProvider>
)
