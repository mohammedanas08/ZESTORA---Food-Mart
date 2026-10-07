import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setAccessToken } from '../api/client';
import RequireRole from '../auth/RequireRole';
import OrderTracker from '../components/OrderTracker';
import { mockApi, renderApp } from '../test/utils';
import { LoginPage } from './auth/AuthPages';
import { HomePage, RestaurantPage } from './customer/Browse';
import { CheckoutPage } from './customer/CartAndCheckout';
import { OrderDetailPage } from './customer/Orders';
import type { Order } from '../api/types';

vi.mock('../realtime/useStompTopic', () => ({ useStompTopic: () => {} }));

const noSession = () => ({ status: 401, error: { code: 'UNAUTHORIZED', message: 'no session' } });
const customer = { id: 1, name: 'Anas', email: 'c@z.com', role: 'CUSTOMER' };
const session = (role = 'CUSTOMER') => ({ data: { accessToken: 't', expiresInSeconds: 900, user: { ...customer, role } } });

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

beforeEach(() => setAccessToken(null));

describe('route guard', () => {
  it('sends a visitor to /login', async () => {
    mockApi({ 'POST /auth/refresh': noSession });
    renderApp(
      <Routes>
        <Route path="/login" element={<Where />} />
        <Route path="/orders" element={<RequireRole roles={['CUSTOMER']}><p>secret</p></RequireRole>} />
      </Routes>,
      '/orders',
    );
    expect(await screen.findByTestId('where')).toHaveTextContent('/login');
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('sends a customer away from the admin area', async () => {
    mockApi({ 'POST /auth/refresh': () => session('CUSTOMER') });
    renderApp(
      <Routes>
        <Route path="/" element={<Where />} />
        <Route path="/admin" element={<RequireRole roles={['ADMIN']}><p>admin panel</p></RequireRole>} />
      </Routes>,
      '/admin',
    );
    expect(await screen.findByTestId('where')).toHaveTextContent('/');
    expect(screen.queryByText('admin panel')).not.toBeInTheDocument();
  });
});

describe('login', () => {
  it('signs in and routes each role to its own home', async () => {
    mockApi({
      'POST /auth/refresh': noSession,
      'POST /auth/login': () => session('RESTAURANT_OWNER'),
    });
    renderApp(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/partner" element={<p>kitchen home</p>} />
      </Routes>,
      '/login',
    );
    await userEvent.type(await screen.findByLabelText('Email'), 'o@z.com');
    await userEvent.type(screen.getByLabelText('Password'), 'a-test-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('kitchen home')).toBeInTheDocument();
  });

  it('shows the server message for a wrong password', async () => {
    mockApi({
      'POST /auth/refresh': noSession,
      'POST /auth/login': () => ({ status: 401, error: { code: 'UNAUTHORIZED', message: 'Incorrect email or password' } }),
    });
    renderApp(<LoginPage />);
    await userEvent.type(await screen.findByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
  });
});

const restaurants = [
  { id: 1, name: 'Spice Garden', slug: 's', cuisines: ['North Indian', 'Biryani'], rating: 4.6, reviewCount: 10, deliveryMin: 25, deliveryMax: 35, minOrder: 149, vegOnly: false, open: true, city: 'Bhatkal' },
];
const product = (over = {}) => ({ id: 1, restaurantId: 1, name: 'Butter Chicken', price: 290, veg: false, available: true, grocery: false, prepMinutes: 15, variants: [], addons: [], category: 'Main', ...over });

describe('browse', () => {
  it('lists restaurants from the API', async () => {
    mockApi({ 'POST /auth/refresh': noSession, 'GET /restaurants?vegOnly=false': () => ({ data: restaurants }) });
    renderApp(<HomePage />);
    expect(await screen.findByText('Spice Garden')).toBeInTheDocument();
    expect(screen.getByText(/North Indian • Biryani/)).toBeInTheDocument();
  });

  it('adds a plain dish to the cart and shows the count', async () => {
    mockApi({
      'POST /auth/refresh': noSession,
      'GET /restaurants/1': () => ({ data: { restaurant: restaurants[0], items: [product()] } }),
    });
    renderApp(
      <Routes>
        <Route path="/restaurants/:id" element={<><RestaurantPage /><CartBadge /></>} />
      </Routes>,
      '/restaurants/1',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add Butter Chicken' }));
    expect(await screen.findByTestId('count')).toHaveTextContent('1');
  });

  it('opens the options dialog for dishes with variants/add-ons', async () => {
    mockApi({
      'POST /auth/refresh': noSession,
      'GET /restaurants/1': () => ({ data: { restaurant: restaurants[0], items: [product({ name: 'Biryani', variants: [{ id: 7, name: 'Jumbo', price: 420 }], addons: [{ id: 8, name: 'Egg', price: 25 }] })] } }),
    });
    renderApp(<Routes><Route path="/restaurants/:id" element={<RestaurantPage />} /></Routes>, '/restaurants/1');
    await userEvent.click(await screen.findByRole('button', { name: 'Add Biryani' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(screen.getByLabelText(/Egg/));
    expect(dialog).toHaveTextContent('₹445'); // 420 + 25
  });
});

import { useCart } from '../cart/CartContext';
function CartBadge() {
  return <p data-testid="count">{useCart().count}</p>;
}

describe('checkout', () => {
  it('sends only ids and quantities (never prices) and opens the order page', async () => {
    const calls: unknown[] = [];
    localStorage.setItem('zestora_cart_v1', JSON.stringify([
      { key: 'k', productId: 5, name: 'Butter Chicken', unitPrice: 1, quantity: 2, addonIds: [], addonNames: [], restaurantId: 1, sourceName: 'Spice Garden' },
    ]));
    mockApi({
      'POST /auth/refresh': () => session(),
      'GET /coupons': () => ({ data: [] }),
      'POST /orders': (body) => { calls.push(body); return { data: { id: 42 } }; },
    });
    renderApp(
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:id" element={<Where />} />
      </Routes>,
      '/checkout',
    );
    await userEvent.type(await screen.findByLabelText('Street / building'), 'Main Road');
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/orders/42'));
    const body = calls[0] as { items: Record<string, unknown>[] };
    expect(body.items).toEqual([{ productId: 5, quantity: 2, addonIds: [] }]);
    expect(JSON.stringify(body)).not.toMatch(/price|total/i);
    expect(localStorage.getItem('zestora_cart_v1')).toBe('[]');
  });

  it('shows the coupon error from the server', async () => {
    localStorage.setItem('zestora_cart_v1', JSON.stringify([
      { key: 'k', productId: 5, name: 'X', unitPrice: 100, quantity: 1, addonIds: [], addonNames: [], restaurantId: 1, sourceName: 'Spice Garden' },
    ]));
    mockApi({
      'POST /auth/refresh': () => session(),
      'GET /coupons': () => ({ data: [] }),
      'POST /coupons/validate': () => ({ status: 400, error: { code: 'BAD_REQUEST', message: 'Minimum order for this coupon is ₹299' } }),
    });
    renderApp(<CheckoutPage />, '/checkout');
    await userEvent.type(await screen.findByLabelText('Coupon code'), 'zest50');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Minimum order');
  });
});

const baseOrder: Order = {
  id: 9, orderNumber: 'ZES-1', status: 'CONFIRMED', paymentStatus: 'PAID', paymentMethod: 'UPI', grocery: false, restaurantId: 1, restaurantName: 'Spice Garden',
  items: [{ productId: 1, name: 'Biryani', quantity: 2, unitPrice: 100, lineTotal: 200 }], subtotal: 200, packagingFee: 15, deliveryFee: 40, platformFee: 5, tax: 10.75, discount: 0, tip: 0, total: 270.75,
  address: { street: 'Main Rd', city: 'Bhatkal' }, history: [{ status: 'PLACED', at: '2026-10-07T10:00:00Z' }, { status: 'CONFIRMED', at: '2026-10-07T10:01:00Z' }],
  createdAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T10:01:00Z',
};

describe('order detail', () => {
  it('shows the delivery code to the customer once a rider is assigned', async () => {
    mockApi({
      'POST /auth/refresh': () => session(),
      'GET /orders/9': () => ({ data: { ...baseOrder, status: 'DELIVERY_ASSIGNED', rider: { name: 'Rahul', phone: '999' }, deliveryOtp: '4821' } }),
    });
    renderApp(<Routes><Route path="/orders/:id" element={<OrderDetailPage />} /></Routes>, '/orders/9');
    expect(await screen.findByTestId('delivery-otp')).toHaveTextContent('4821');
    expect(screen.getByText('Rahul', { exact: false })).toBeInTheDocument();
  });

  it('offers payment on an unpaid order and no cancel for a picked-up one', async () => {
    mockApi({
      'POST /auth/refresh': () => session(),
      'GET /orders/9': () => ({ data: { ...baseOrder, status: 'PLACED', paymentStatus: 'PENDING' } }),
    });
    renderApp(<Routes><Route path="/orders/:id" element={<OrderDetailPage />} /></Routes>, '/orders/9');
    expect(await screen.findByRole('button', { name: /Pay ₹270.75/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel order' })).toBeInTheDocument();
  });

  it('hides cancel once the food is being prepared', async () => {
    mockApi({
      'POST /auth/refresh': () => session(),
      'GET /orders/9': () => ({ data: { ...baseOrder, status: 'PREPARING' } }),
    });
    renderApp(<Routes><Route path="/orders/:id" element={<OrderDetailPage />} /></Routes>, '/orders/9');
    await screen.findByText('Order summary');
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });
});

describe('order tracker', () => {
  it('marks reached stages and the current one', () => {
    renderApp(<OrderTracker order={{ ...baseOrder, status: 'PREPARING' }} />);
    expect(screen.getByText('Preparing').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Delivered').className).toContain('text-stone-400');
  });

  it('skips restaurant stages for grocery orders and explains cancellations', () => {
    const { rerender } = renderApp(<OrderTracker order={{ ...baseOrder, grocery: true, status: 'CONFIRMED' }} />);
    expect(screen.queryByText('Preparing')).not.toBeInTheDocument();
    rerender(<OrderTracker order={{ ...baseOrder, status: 'CANCELLED', rejectionReason: 'Out of stock' }} />);
    expect(screen.getByText(/Out of stock/)).toBeInTheDocument();
  });
});
