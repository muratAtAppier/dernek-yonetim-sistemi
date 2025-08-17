'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from './ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient())
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
