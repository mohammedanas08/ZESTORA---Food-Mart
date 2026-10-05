export type Role =
  | 'CUSTOMER'
  | 'RESTAURANT_OWNER'
  | 'RESTAURANT_MANAGER'
  | 'DELIVERY_PARTNER'
  | 'GROCERY_MANAGER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'SUPPORT_AGENT';

export type OrderStatus =
  | 'PLACED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'RESTAURANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'DELIVERY_ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'ARRIVING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'NET_BANKING'
  | 'WALLET'
  | 'CASH_ON_DELIVERY';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  passwordHash?: string; // stored server-side only, never sent to client
}

export interface Address {
  id: string;
  userId: string;
  label: string; // "Home", "Work", "Other"
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number; // minutes
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy';
  rating: number;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  description: string;
  cuisine: string;
  logo: string;
  coverImage: string;
  rating: number;
  ratingCount: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  minimumOrder: number;
  commissionRate: number; // e.g. 0.20
  isOpen: boolean;
  isVerified: boolean;
  addressLine: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  menuCategories?: MenuCategory[];
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  brand?: string;
  description: string;
  image: string;
  mrp: number;
  price: number;
  unit: string;
  stock: number;
  reserved: number;
  sku: string;
  categoryName: string;
  isAvailable?: boolean;
  rating?: number;
  ratingCount?: number;
}

export interface ProductCategory {
  id: string;
  storeId: string;
  name: string;
  icon?: string;
  products?: Product[];
}

export interface GroceryStore {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  rating: number;
  deliveryEta: string;
  isOpen: boolean;
}

export interface CartItem {
  id: string;
  type: 'FOOD' | 'GROCERY';
  menuItemId?: string;
  productId?: string;
  name: string;
  restaurantId?: string;
  restaurantName?: string;
  storeId?: string;
  unitPrice: number;
  quantity: number;
  selectedVariant?: MenuVariant;
  selectedAddons?: MenuAddon[];
  instructions?: string;
  image?: string;
  isVeg?: boolean;
}

export interface CartPricing {
  subtotal: number;
  packagingFee: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  total: number;
  appliedCoupon?: Coupon | null;
  tip: number;
}

export interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  variantName?: string;
  addons?: string[];
  instructions?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  note?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ZES-20260921-10482
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId?: string;
  restaurantName?: string;
  groceryStoreId?: string;
  groceryStoreName?: string;
  address: Address;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  subtotal: number;
  packagingFee: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  tip: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpayQrString?: string;
  deliveryType: 'STANDARD' | 'SCHEDULED';
  scheduledTime?: string;
  estimatedDeliveryTime?: string;
  rejectionReason?: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  currentRiderLat?: number;
  currentRiderLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrderDetails {
  orderId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  amountInRupees: number;
  currency: string;
  qrString: string;
  paymentStatus: PaymentStatus;
  expiresAt: string;
}


export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';
  discountValue: number;
  minimumOrder: number;
  maxDiscount?: number;
  description: string;
  isActive: boolean;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  onlineStatus: 'ONLINE' | 'OFFLINE' | 'BUSY';
  rating: number;
  totalTrips: number;
  todayTrips: number;
  todayEarnings: number;
  walletBalance: number;
  currentLat: number;
  currentLng: number;
}

export interface ServiceArea {
  id: string;
  city: string;
  zoneName: string;
  postalCode: string;
  radiusKm: number;
  baseDelivery: number;
  minOrder: number;
  surgeFee: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  userName: string;
  foodRating: number;
  packagingRating: number;
  deliveryRating: number;
  comment?: string;
  reply?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketId: string; // TKT-XXXXX
  userId: string;
  userName: string;
  orderId?: string;
  category: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: { sender: string; message: string; timestamp: string }[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}
