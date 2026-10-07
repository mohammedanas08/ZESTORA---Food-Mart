import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setAccessToken } from '../../api/client';
import { mockApi, renderApp } from '../../test/utils';
import { Partners } from './AdminPage';

vi.mock('../../realtime/useStompTopic', () => ({ useStompTopic: () => {} }));

const users = [
  { id: 1, name: 'Customer', email: 'c@z.com', role: 'CUSTOMER' },
  { id: 2, name: 'Tariq', email: 't@z.com', role: 'RESTAURANT_OWNER' },
  { id: 3, name: 'Rahul', email: 'r@z.com', role: 'DELIVERY_PARTNER' },
];
const admin = { data: { accessToken: 't', expiresInSeconds: 900, user: { id: 9, name: 'Admin', email: 'a@z.com', role: 'ADMIN' } } };

beforeEach(() => setAccessToken(null));

describe('admin partners onboarding', () => {
  it('only offers matching roles in each dropdown', async () => {
    mockApi({
      'POST /auth/refresh': () => admin,
      'GET /admin/users?size=100': () => ({ data: users }),
      'GET /restaurants?vegOnly=false': () => ({ data: [] }),
    });
    renderApp(<Partners />);
    const ownerSelect = await screen.findByLabelText('Owner account');
    expect(within(ownerSelect).getByText(/Tariq/)).toBeInTheDocument();
    expect(within(ownerSelect).queryByText(/Rahul/)).not.toBeInTheDocument();
    expect(within(ownerSelect).queryByText(/Customer/)).not.toBeInTheDocument();
    const riderSelect = screen.getByLabelText('Rider account');
    expect(within(riderSelect).getByText(/Rahul/)).toBeInTheDocument();
    expect(within(riderSelect).queryByText(/Tariq/)).not.toBeInTheDocument();
  });

  it('creates a restaurant with the commission converted from percent to a rate', async () => {
    const sent: unknown[] = [];
    mockApi({
      'POST /auth/refresh': () => admin,
      'GET /admin/users?size=100': () => ({ data: users }),
      'GET /restaurants?vegOnly=false': () => ({ data: [] }),
      'POST /admin/restaurants': (body) => {
        sent.push(body);
        return { data: 7 };
      },
    });
    renderApp(<Partners />);
    await userEvent.selectOptions(await screen.findByLabelText('Owner account'), '2');
    await userEvent.type(screen.getByLabelText('Restaurant name'), 'Coastal Bites');
    const commission = screen.getByLabelText('Commission %');
    await userEvent.clear(commission);
    await userEvent.type(commission, '15');
    await userEvent.click(screen.getByRole('button', { name: 'Create restaurant' }));
    expect(await screen.findByText(/Restaurant created/)).toBeInTheDocument();
    expect(sent[0]).toMatchObject({ ownerUserId: 2, name: 'Coastal Bites', commissionRate: 0.15, vegOnly: false });
  });

  it('shows the server error when a rider profile already exists', async () => {
    mockApi({
      'POST /auth/refresh': () => admin,
      'GET /admin/users?size=100': () => ({ data: users }),
      'GET /restaurants?vegOnly=false': () => ({ data: [] }),
      'POST /admin/riders': () => ({ status: 409, error: { code: 'CONFLICT', message: 'Rider profile already exists' } }),
    });
    renderApp(<Partners />);
    await userEvent.selectOptions(await screen.findByLabelText('Rider account'), '3');
    await userEvent.click(screen.getByRole('button', { name: 'Create rider profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Rider profile already exists');
  });
});
