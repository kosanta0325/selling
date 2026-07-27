import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { ProductProvider } from './context/ProductContext.jsx'

// vi.mock factories are hoisted above imports, so they can't reference
// imported bindings (they'd be in the TDZ). Everything the factory needs
// must therefore be defined inline, not imported.
vi.mock('./lib/supabase.js', () => {
  function createQueryProxy(result) {
    const handler = {
      get(_target, prop) {
        if (prop === 'then') return (resolve) => resolve(result)
        return () => createQueryProxy(result)
      },
    }
    return new Proxy(function () {}, handler)
  }
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => createQueryProxy({ data: [], error: null }),
    },
  }
})

const mockUseAuth = vi.fn()
vi.mock('./context/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProductProvider>
        <App />
      </ProductProvider>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  it('redirects an unauthenticated visitor to /login', async () => {
    mockUseAuth.mockReturnValue({ user: null, profile: null, loading: false })
    renderApp('/admin')
    expect(await screen.findByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('redirects a logged-in non-admin back to the marketplace', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, profile: { role: 'user' }, loading: false })
    renderApp('/admin')
    expect(await screen.findByText('✦ AIツール マーケットプレイス')).toBeInTheDocument()
  })

  it('lets an admin user into the admin area', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, profile: { role: 'admin' }, loading: false })
    renderApp('/admin')
    expect(await screen.findByText('管理画面')).toBeInTheDocument()
  })

  // Documents a real gap in App.jsx: `if (profile && profile.role !== 'admin')`
  // never fires when `profile` is null (e.g. the profile fetch failed), so a
  // logged-in user with no profile row falls through into the admin area
  // instead of being redirected. This test should start FAILING once that
  // guard is tightened to also deny access when `profile` is missing.
  it('KNOWN GAP: lets a user with no profile row into the admin area', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, profile: null, loading: false })
    renderApp('/admin')
    expect(await screen.findByText('管理画面')).toBeInTheDocument()
  })
})
