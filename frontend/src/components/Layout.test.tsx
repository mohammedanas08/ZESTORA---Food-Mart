import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '../api/client';
import { mockApi, renderApp } from '../test/utils';
import Layout from './Layout';

const noSession = () => ({ status: 401, error: { code: 'UNAUTHORIZED', message: 'no session' } });
const asRole = (role: string) => () => ({ data: { accessToken: 't', expiresInSeconds: 900, user: { id: 1, name: 'U', email: 'u@z.com', role } } });

function shell(route = '/') {
  return renderApp(
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<p>page</p>} />
      </Route>
    </Routes>,
    route,
  );
}

const tabLabels = () => within(screen.getByRole('navigation', { name: 'Tabs' })).getAllByRole('link').map((a) => a.textContent?.replace(/\d+$/, ''));

beforeEach(() => setAccessToken(null));

describe('mobile bottom tabs', () => {
  it('guests can browse and log in from the tab bar', async () => {
    mockApi({ 'POST /auth/refresh': noSession });
    shell();
    await screen.findByText('page');
    expect(tabLabels()).toEqual(['Food', 'Grocery', 'Cart', 'Log in']);
  });

  it('customers get food, grocery, cart, orders and help', async () => {
    mockApi({ 'POST /auth/refresh': asRole('CUSTOMER') });
    shell();
    await screen.findByText('Log out');
    expect(tabLabels()).toEqual(['Food', 'Grocery', 'Cart', 'Orders', 'Help']);
  });

  it('restaurant staff get orders and menu only', async () => {
    mockApi({ 'POST /auth/refresh': asRole('RESTAURANT_OWNER') });
    shell('/partner');
    await screen.findByText('Log out');
    expect(tabLabels()).toEqual(['Orders', 'Menu']);
  });

  it('riders and admins have no tab bar (single-screen apps)', async () => {
    mockApi({ 'POST /auth/refresh': asRole('DELIVERY_PARTNER') });
    shell('/rider');
    await screen.findByText('Log out');
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument();
  });

  it('is hidden on checkout, which has its own sticky place-order bar', async () => {
    mockApi({ 'POST /auth/refresh': asRole('CUSTOMER') });
    shell('/checkout');
    await screen.findByText('Log out');
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument();
  });

  it('shows the cart count on the Cart tab', async () => {
    localStorage.setItem('zestora_cart_v1', JSON.stringify([
      { key: 'k', productId: 1, name: 'X', unitPrice: 10, quantity: 3, addonIds: [], addonNames: [], restaurantId: 1, sourceName: 'S' },
    ]));
    mockApi({ 'POST /auth/refresh': noSession });
    shell();
    const tabs = await screen.findByRole('navigation', { name: 'Tabs' });
    expect(within(tabs).getByText('3')).toBeInTheDocument();
  });
});
