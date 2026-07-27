import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProductProvider } from '../context/ProductContext.jsx'
import ListingPage from './ListingPage.jsx'

// vi.mock factories are hoisted above imports, so they can't reference
// imported bindings — everything needed here must be defined inline.
vi.mock('../lib/supabase.js', () => {
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
      from: () => createQueryProxy({ data: null, error: { message: 'network down' } }),
    },
  }
})

function renderListingPage() {
  return render(
    <MemoryRouter>
      <ProductProvider>
        <ListingPage />
      </ProductProvider>
    </MemoryRouter>,
  )
}

describe('ListingPage', () => {
  it('falls back to the bundled product catalog when Supabase fails', async () => {
    renderListingPage()
    expect(await screen.findByText('議事録自動要約ボット')).toBeInTheDocument()
  })

  it('filters products by category', async () => {
    const user = userEvent.setup()
    renderListingPage()
    await screen.findByText('議事録自動要約ボット')

    await user.click(screen.getByRole('button', { name: '画像生成' }))

    expect(screen.getByText('AIイラスト一括生成ツール')).toBeInTheDocument()
    expect(screen.queryByText('ブログ記事自動生成AI')).not.toBeInTheDocument()
    expect(screen.queryByText('議事録自動要約ボット')).not.toBeInTheDocument()
  })

  it('filters products by search query', async () => {
    const user = userEvent.setup()
    renderListingPage()
    await screen.findByText('議事録自動要約ボット')

    await user.type(screen.getByPlaceholderText('AIツールを検索...'), '議事録')

    expect(screen.getByText('議事録自動要約ボット')).toBeInTheDocument()
    expect(screen.queryByText('ブログ記事自動生成AI')).not.toBeInTheDocument()
  })
})
