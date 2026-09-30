import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ApiError } from '@/mocks/db'
import { useSession } from '@/stores/session.store'
import { TooltipProvider } from '@/components/ui/overlays'

function onAuthError(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && useSession.getState().userId) useSession.getState().setExpired(true)
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthError }),
  mutationCache: new MutationCache({ onError: onAuthError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
          style={{ zIndex: 70 }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export { queryClient }
