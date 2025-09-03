import { getProviders, signIn } from 'next-auth/react'
import type { GetServerSideProps } from 'next'

export default function SignIn({ providers }: { providers: any }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Sign In</h1>
      {Object.values(providers).map((provider: any) => (
        <div key={provider.name}>
          <button onClick={() => signIn(provider.id, { callbackUrl: '/' })}>
            Sign in with {provider.name}
          </button>
        </div>
      ))}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders()
  return { props: { providers } }
}

