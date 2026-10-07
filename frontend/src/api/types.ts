// Types mirror the Spring Boot DTOs (backend/src/main/java/com/zestora/**).

export type Role =
  | 'CUSTOMER' | 'RESTAURANT_OWNER' | 'RESTAURANT_MANAGER' | 'DELIVERY_PARTNER'
  | 'GROCERY_MANAGER' | 'SUPPORT_AGENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: User;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cuisines: string[];
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  deliveryMin: number;
  deliveryMax: number;
  minOrder: number;
  costForTwo?: number;
  vegOnly: boolean;
  open: boolean;
  city: string;
}

export interface Option {
  id: number;
  name: string;
  price: number;
}

export interface Product {
  id: number;
  restaurantId: number | null;
  name: string;
  description?: string;
  category?: string;
  /** null = the menu lists no price (ask the restaurant); such an item cannot be ordered. */
  price?: number | null;
  imageUrl?: string;
  /** null = not known. */
  veg?: boolean | null;
  available: boolean;
  grocery: boolean;
  stock?: number | null;
  prepMinutes: number;
  variants: Option[];
  addons: Option[];
}

export interface RestaurantMenu {
  restaurant: Restaurant;
  items: Product[];
}

export type OrderStatus =
  | 'PLACED' | 'CONFIRMED' | 'RESTAURANT_ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP'
  | 'DELIVERY_ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: number;
  name: string;
  variantName?: string;
  addons?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED';
  paymentMethod: string;
  grocery: boolean;
  restaurantId: number | null;
  restaurantName?: string;
  items: OrderItem[];
  subtotal: number;
  packagingFee: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  couponCode?: string;
  address: { street: string; area?: string; city: string; pincode?: string; instructions?: string };
  customerName?: string;
  customerPhone?: string;
  rider?: { name: string; phone?: string; lat?: number; lng?: number };
  deliveryOtp?: string;
  rejectionReason?: string;
  history: { status: OrderStatus; actorRole?: string; note?: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: { productId: number; quantity: number; variantId?: number; addonIds?: number[]; notes?: string }[];
  address: { street: string; area?: string; city: string; pincode?: string; instructions?: string };
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'COD';
  couponCode?: string;
  tip?: number;
}

export interface Checkout {
  orderId: number;
  orderNumber: string;
  provider: 'RAZORPAY' | 'MOCK';
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  mock: boolean;
}

export interface Coupon {
  code: string;
  description?: string;
  type: 'PERCENT' | 'FLAT' | 'FREE_DELIVERY';
  value: number;
  maxDiscount?: number;
  minOrder: number;
}

export interface RiderProfile {
  online: boolean;
  totalTrips: number;
  walletBalance: number;
  rating: number;
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface Ticket {
  id: number;
  ticketNo: string;
  orderId?: number;
  category: string;
  subject: string;
  status: string;
  createdAt: string;
  messages: { senderId: number; message: string; at: string }[];
}

export interface AdminMetrics {
  gmv: number;
  platformCommission: number;
  activeOrders: number;
  ordersByStatus: Record<string, number>;
  restaurants: number;
  ridersOnline: number;
  users: number;
}

export interface AuditEntry {
  id: number;
  actorId?: number;
  actorRole?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}
