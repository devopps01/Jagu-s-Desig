import Link from 'next/link'
import type { ReactNode } from 'react'

const RENT_NAME = "Jagu's Rent"

const RentShell = ({ children }: { children: ReactNode }) => (
  <div className='vn-store jr-shell'>
    <header className='jr-header'>
      <Link href='/rent' className='jr-brand'>
        <strong>{RENT_NAME}</strong>
        <span>Outfit rental</span>
      </Link>
      <nav className='jr-nav' aria-label='Rent'>
        <Link href='/rent'>Outfits</Link>
      </nav>
    </header>
    <main>{children}</main>
    <footer className='jr-footer'>
      {RENT_NAME} — rent designer outfits for your dates. This page is separate from the shop.
    </footer>
  </div>
)

export default RentShell
export { RENT_NAME }
