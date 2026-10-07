import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { homeFor, isAdminRole, isRestaurantRole } from '../lib/format';

export default function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-light text-brand-dark' : 'text-stone-600 hover:text-stone-900'}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={user ? homeFor(user.role) : '/'} className="text-xl font-extrabold tracking-tight text-brand">
            Zestora
          </Link>
          <nav className="ml-4 hidden flex-1 gap-1 sm:flex">
            {(!user || user.role === 'CUSTOMER') && (
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
            {(!user || user.role === 'CUSTOMER') && (
              <Link to="/cart" className="btn-outline relative" aria-label="Cart">
                Cart
                {count > 0 && (
                  <span className="rounded-full bg-brand px-1.5 text-xs text-white" data-testid="cart-count">{count}</span>
                )}
              </Link>
            )}
            {user ? (
              <>
                <span className="hidden text-sm text-stone-600 sm:inline">{user.name}</span>
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
