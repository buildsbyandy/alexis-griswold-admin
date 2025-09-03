import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={(pageProps as any)?.session}>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </SessionProvider>
  )
}

