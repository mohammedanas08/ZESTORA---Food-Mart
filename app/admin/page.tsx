'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  DollarSign,
  ShoppingBag,
  Store,
  Bike,
  Users,
  Percent,
  MapPin,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Package,
  Trash2,
  Edit2,
  CreditCard,
  QrCode,
  Lock,
} from 'lucide-react';
import { Order, Restaurant, AuditLog, ServiceArea, Product, User } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SEED_RESTAURANTS, SEED_SERVICE_AREAS, SEED_COUPONS } from '@/server/seedData';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'users' | 'restaurants' | 'coupons' | 'zones' | 'audit'
  >('overview');

  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(SEED_RESTAURANTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New product form modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Groceries');
  const [newProductPrice, setNewProductPrice] = useState('149');
  const [newProductStock, setNewProductStock] = useState('50');

  const fetchAdminData = async () => {
    try {
      const [metricsRes, ordersRes, productsRes, usersRes] = await Promise.all([
        fetch('/api/v1/admin/metrics'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/products'),
        fetch('/api/admin/users'),
      ]);

      const metricsData = await metricsRes.json();
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const usersData = await usersRes.json();

      if (metricsData.success) {
        setMetrics(metricsData.data.metrics);
        setAuditLogs(metricsData.data.auditLogs);
      }
      if (ordersData.success) {
        setOrders(ordersData.data);
      }
      if (productsData.success) {
        setProducts(productsData.data);
      }
      if (usersData.success) {
        setUsers(usersData.data);
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          category: newProductCategory,
          price: parseFloat(newProductPrice) || 99,
          stock: parseInt(newProductStock, 10) || 50,
          unit: '1 pack',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddProductOpen(false);
        setNewProductName('');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleProductStock = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              Admin Command Center • Live Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Platform Operations & Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System control for orders, payments, products, customers, and delivery zones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdminData()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition"
          >
            Visit Customer Store &rarr;
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400">Total GMV</div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(metrics?.totalGmv || 84290)}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">+18.4% today</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400">Net Platform Commission</div>
          <div className="text-2xl font-black text-brand-400">
            {formatCurrency(metrics?.netCommission || 16858)}
          </div>
          <div className="text-[10px] text-slate-400">20% commission on orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400">Total Orders</div>
          <div className="text-2xl font-black text-white">{orders.length}</div>
          <div className="text-[10px] text-slate-400">
            {orders.filter((o) => o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS').length} Paid
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400">Active Products</div>
          <div className="text-2xl font-black text-white">{products.length}</div>
          <div className="text-[10px] text-slate-400">In catalog</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 col-span-2 md:col-span-1">
          <div className="text-[11px] font-bold text-slate-400">Registered Users</div>
          <div className="text-2xl font-black text-white">{users.length}</div>
          <div className="text-[10px] text-emerald-400 font-semibold">Customers & Admins</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Overview & Orders Feed' },
          { id: 'orders', label: `Manage Orders & Payments (${orders.length})` },
          { id: 'products', label: `Product Catalog (${products.length})` },
          { id: 'users', label: `Users & Roles (${users.length})` },
          { id: 'restaurants', label: `Restaurants (${restaurants.length})` },
          { id: 'zones', label: 'Delivery Zones' },
          { id: 'audit', label: 'Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-black text-white">Live Operations Feed</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Razorpay ID</th>
                  <th className="p-3">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((o) => {
                  const isPaid = o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS';
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">{o.orderNumber}</td>
                      <td className="p-3 font-medium">{o.customerName}</td>
                      <td className="p-3 font-black text-white">{formatCurrency(o.totalAmount)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {o.razorpayPaymentId || o.razorpayOrderId || '-'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE ORDERS & PAYMENTS */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Order & Payment Management</h3>
            <span className="text-xs text-slate-400">
              {orders.filter((o) => o.paymentStatus === 'PAID').length} Paid / {orders.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Razorpay Order</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((o) => {
                  const isPaid = o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS';
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">{o.orderNumber}</td>
                      <td className="p-3 font-semibold text-white">{o.customerName}</td>
                      <td className="p-3 text-slate-400">{o.customerPhone}</td>
                      <td className="p-3 font-black text-brand-400 text-sm">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        {o.razorpayPaymentId || <span className="text-slate-600">Pending</span>}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {o.razorpayOrderId || '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-200">{o.status}</td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {formatDateTime(o.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Product Catalog & Inventory</h3>
              <p className="text-xs text-slate-400">Manage grocery and catalog items</p>
            </div>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          {/* Modal for adding product */}
          {isAddProductOpen && (
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3 animate-in fade-in duration-200">
              <h4 className="text-sm font-bold text-white">Add New Product to Catalog</h4>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Product Name (e.g. Organic Cow Milk)"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Dairy & Eggs)"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Stock Qty"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="w-1/2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock Units</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      <span>{p.name}</span>
                    </td>
                    <td className="p-3 text-slate-400">{p.category}</td>
                    <td className="p-3 font-black text-white">{formatCurrency(p.price)}</td>
                    <td className="p-3 font-mono">{p.stock}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleProductStock(p)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          p.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {p.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-black text-white">Registered Users & Role Permissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Permission Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{u.email}</td>
                      <td className="p-3 text-slate-400">{u.phone}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">
                        {isAdmin
                          ? 'Full Operations, Product & Order Management'
                          : 'Customer Order & Checkout Only'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RESTAURANTS */}
      {activeTab === 'restaurants' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-black text-white">Partner Restaurants Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img src={r.logo} alt={r.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-black text-white text-sm">{r.name}</h4>
                    <div className="text-xs text-slate-400">{r.cuisine}</div>
                    <div className="text-[11px] text-amber-400 mt-0.5">
                      Commission: {r.commissionRate * 100}% • {r.area}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                  Active & Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ZONES */}
      {activeTab === 'zones' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-black text-white">Delivery Zones Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SEED_SERVICE_AREAS.map((z) => (
              <div key={z.id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-white text-sm">{z.zoneName}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>City: {z.city} ({z.postalCode})</div>
                  <div>Base Delivery: ₹{z.baseDelivery} • Radius: {z.radiusKm} km</div>
                  <div>Surge Rate: ₹{z.surgeFee}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-black text-white">Platform Audit Trail</h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-brand-400 font-bold">{log.action}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-white">{log.entity}: {log.entityId}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">{log.details || log.adminName}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}
