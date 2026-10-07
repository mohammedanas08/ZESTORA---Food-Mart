import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { homeFor, isAdminRole, isRestaurantRole } from '../lib/format';

export default function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-light text-brand-dark' : 'text-stone-600 hover:text-stone-900'}`;

  const isCustomerSide = !user || user.role === 'CUSTOMER';
  // Checkout has its own sticky "Place order" bar, so the tab bar would only get in the way there.
  const showTabs = pathname !== '/checkout' && (isCustomerSide || isRestaurantRole(user?.role));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:py-3">
          <Link to={user ? homeFor(user.role) : '/'} className="-my-1 inline-flex min-h-[44px] items-center text-xl font-extrabold tracking-tight text-brand">
            Zestora
          </Link>
          <nav className="ml-4 hidden flex-1 gap-1 md:flex" aria-label="Main">
            {isCustomerSide && (
              <>
                <NavLink to="/" end className={link}>Restaurants</NavLink>
                <NavLink to="/grocery" className={link}>Grocery</NavLink>
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
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {isCustomerSide && (
              <Link to="/cart" className="btn-outline relative" aria-label="Cart">
                Cart
                {count > 0 && (
                  <span className="rounded-full bg-brand px-1.5 text-xs text-white" data-testid="cart-count">{count}</span>
                )}
              </Link>
            )}
            {user ? (
              <>
                <span className="hidden text-sm text-stone-600 lg:inline">{user.name}</span>
                <button
                  className="btn-outline"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary">Log in</Link>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-6xl px-4 py-5 sm:py-6 ${showTabs ? 'pb-24 md:pb-6' : 'pb-6'}`}>
        <Outlet />
      </main>

      {showTabs && <BottomTabs customerSide={isCustomerSide} loggedIn={!!user} cartCount={count} />}
    </div>
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
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
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
