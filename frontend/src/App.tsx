import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './auth/RequireRole';
import Layout from './components/Layout';
import AdminPage from './pages/admin/AdminPage';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import { GroceryPage, HomePage, RestaurantPage } from './pages/customer/Browse';
import { CartPage, CheckoutPage } from './pages/customer/CartAndCheckout';
import { AboutPage, ContactPage } from './pages/customer/InfoPages';
import { OrderDetailPage, OrdersPage, SupportPage } from './pages/customer/Orders';
import PartnerMenuPage from './pages/partner/PartnerMenuPage';
import { PartnerOrdersPage } from './pages/partner/PartnerPages';
import RiderPage from './pages/rider/RiderPage';
import type { Role } from './api/types';

const CUSTOMER: Role[] = ['CUSTOMER'];
const PARTNER: Role[] = ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];
const ADMIN: Role[] = ['ADMIN', 'SUPER_ADMIN'];

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants/:id" element={<RestaurantPage />} />
        <Route path="/grocery" element={<GroceryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/checkout" element={<RequireRole roles={CUSTOMER}><CheckoutPage /></RequireRole>} />
        <Route path="/orders" element={<RequireRole roles={CUSTOMER}><OrdersPage /></RequireRole>} />
        <Route path="/orders/:id" element={<RequireRole roles={CUSTOMER}><OrderDetailPage /></RequireRole>} />
        <Route path="/support" element={<RequireRole roles={CUSTOMER}><SupportPage /></RequireRole>} />

        <Route path="/partner" element={<RequireRole roles={PARTNER}><PartnerOrdersPage /></RequireRole>} />
        <Route path="/partner/menu" element={<RequireRole roles={PARTNER}><PartnerMenuPage /></RequireRole>} />
        <Route path="/rider" element={<RequireRole roles={['DELIVERY_PARTNER']}><RiderPage /></RequireRole>} />
        <Route path="/admin" element={<RequireRole roles={ADMIN}><AdminPage /></RequireRole>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
