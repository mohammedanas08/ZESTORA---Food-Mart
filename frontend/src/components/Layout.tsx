import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { homeFor, isAdminRole, isRestaurantRole } from '../lib/format';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from './ui';

function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      Zest<span className="text-brand">o</span>ra
    </span>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-3 py-1.5 text-sm font-medium transition ${isActive ? 'text-brand after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand' : 'text-stone-600 hover:text-ink'}`;

  const isCustomerSide = !user || user.role === 'CUSTOMER';
  // Checkout has its own sticky "Place order" bar, so the tab bar would only get in the way there.
  const showTabs = pathname !== '/checkout' && (isCustomerSide || isRestaurantRole(user?.role));

  async function signOut() {
    await logout();
    navigate('/');
  }

  const navLinks = (
    <>
      {isCustomerSide && (
        <>
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/grocery" className={link}>Grocery</NavLink>
          <NavLink to="/about" className={link}>About</NavLink>
          <NavLink to="/contact" className={link}>Contact</NavLink>
          {user && <NavLink to="/orders" className={link}>My orders</NavLink>}
          {user && <NavLink to="/support" className={link}>Support</NavLink>}
        </>
      )}
      {isRestaurantRole(user?.role) && (
        <>
          <NavLink to="/partner" end className={link}>Orders</NavLink>
          <NavLink to="/partner/menu" className={link}>Menu</NavLink>
        </>
      )}
      {user?.role === 'DELIVERY_PARTNER' && <NavLink to="/rider" className={link}>Deliveries</NavLink>}
      {isAdminRole(user?.role) && <NavLink to="/admin" className={link}>Admin</NavLink>}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-stone-200/60 bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:py-3">
          <Link to={user ? homeFor(user.role) : '/'} className="-my-1 inline-flex min-h-[44px] items-center text-2xl" aria-label="Zestora home">
            <Logo />
          </Link>
          <nav className="mx-auto hidden gap-1 md:flex" aria-label="Main">{navLinks}</nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {isCustomerSide && (
              <>
                <Link to="/?search=1" className="hidden h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-white sm:inline-flex" aria-label="Search restaurants">
                  <SearchIcon />
                </Link>
                <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-white" aria-label="Cart">
                  <CartIcon />
                  {count > 0 && (
                    <span key={count} className="absolute -right-0.5 -top-0.5 min-w-[18px] animate-pop rounded-full bg-brand px-1 text-center text-[11px] font-semibold leading-[18px] text-white" data-testid="cart-count">{count}</span>
                  )}
                </Link>
              </>
            )}
            {user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-sm text-stone-600 lg:inline">{user.name}</span>
                <button className="btn-outline hidden md:inline-flex" onClick={signOut}>Log out</button>
              </>
            ) : (
              <Link to="/login" className="btn-primary hidden md:inline-flex">Log in</Link>
            )}
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 hover:bg-white md:hidden" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[82%] max-w-xs animate-rise flex-col bg-cream p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <Logo className="text-2xl" />
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white" aria-label="Close menu" onClick={() => setDrawer(false)}><CloseIcon /></button>
            </div>
            <nav className="mt-6 flex flex-col gap-1 text-lg" aria-label="Menu links" onClick={() => setDrawer(false)}>
              {isCustomerSide && (
                <>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/">Home</Link>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/?search=1">Search restaurants</Link>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/grocery">Grocery</Link>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/cart">Cart{count > 0 ? ` (${count})` : ''}</Link>
                  {user && <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/orders">My orders</Link>}
                  {user && <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/support">Support</Link>}
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/about">About</Link>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/contact">Contact</Link>
                </>
              )}
              {isRestaurantRole(user?.role) && (
                <>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/partner">Orders</Link>
                  <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/partner/menu">Menu</Link>
                </>
              )}
              {user?.role === 'DELIVERY_PARTNER' && <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/rider">Deliveries</Link>}
              {isAdminRole(user?.role) && <Link className="rounded-xl px-3 py-2.5 hover:bg-white" to="/admin">Admin</Link>}
            </nav>
            <div className="mt-auto pt-6">
              {user ? (
                <>
                  <p className="mb-2 truncate text-sm text-stone-500">Signed in as {user.name}</p>
                  <button className="btn-outline w-full" onClick={signOut}>Log out</button>
                </>
              ) : (
                <Link to="/login" className="btn-primary w-full" onClick={() => setDrawer(false)}>Log in</Link>
              )}
            </div>
          </div>
        </div>
      )}

      <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-8 ${showTabs ? 'pb-24 md:pb-8' : 'pb-8'}`}>
        <Outlet />
      </main>

      {isCustomerSide && pathname !== '/checkout' && <Footer />}
      {showTabs && <BottomTabs customerSide={isCustomerSide} loggedIn={!!user} cartCount={count} />}
    </div>
  );
}

/** Only real destinations: nothing here points at a page that does not exist. */
function Footer() {
  const l = 'text-sm text-stone-600 transition hover:text-brand';
  return (
    <footer className="mt-8 border-t border-stone-200/70 bg-white/60 pb-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-3 max-w-xs text-sm text-stone-600">Food and groceries from local Bhatkal kitchens and stores, delivered to your door.</p>
        </div>
        <nav aria-label="Explore" className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Explore</p>
          <Link className={l} to="/">Restaurants</Link>
          <Link className={l} to="/grocery">Grocery</Link>
          <Link className={l} to="/cart">Cart</Link>
        </nav>
        <nav aria-label="Company" className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Zestora</p>
          <Link className={l} to="/about">About</Link>
          <Link className={l} to="/contact">Contact</Link>
          <Link className={l} to="/support">Support</Link>
        </nav>
      </div>
      <p className="border-t border-stone-200/70 py-4 text-center text-xs text-stone-500">© {new Date().getFullYear()} Zestora</p>
    </footer>
  );
}

/** Phone navigation: the top nav is hidden below `md`, so this fixed bar is how people move around on mobile. */
function BottomTabs({ customerSide, loggedIn, cartCount }: { customerSide: boolean; loggedIn: boolean; cartCount: number }) {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-stone-500'}`;

  const items = customerSide
    ? [
        { to: '/', label: 'Food', end: true },
        { to: '/grocery', label: 'Grocery' },
        { to: '/cart', label: 'Cart', badge: cartCount },
        loggedIn ? { to: '/orders', label: 'Orders' } : { to: '/login', label: 'Log in' },
        ...(loggedIn ? [{ to: '/support', label: 'Help' }] : []),
      ]
    : [
        { to: '/partner', label: 'Orders', end: true },
        { to: '/partner/menu', label: 'Menu' },
      ];

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={'end' in i ? i.end : false} className={tab}>
          <span>{i.label}</span>
          {'badge' in i && i.badge ? (
            <span className="absolute right-[22%] top-1.5 rounded-full bg-brand px-1.5 text-[10px] leading-4 text-white">{i.badge}</span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}
