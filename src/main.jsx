import React from 'react'
import ReactDOM from 'react-dom/client'
// 1. Change this import
import App from './App.jsx' // Was: FestivalTracker.jsx
import { Toaster } from 'sonner' 

import 'leaflet/dist/leaflet.css';
import './index.css' 

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" />
      {/* 2. Change this component */}
      <App /> {/* Was: <FestivalTracker /> */}
    </QueryClientProvider>
  </React.StrictMode>,
)