import {
  Restaurant,
  Product,
  Order,
  OrderStatus,
  CartItem,
  CartPricing,
  Coupon,
  DeliveryPartner,
  Review,
  SupportTicket,
  AuditLog,
  ServiceArea,
} from '@/types';
import {
  SEED_RESTAURANTS,
  SEED_PRODUCTS,
  SEED_GROCERY_STORE,
  SEED_SERVICE_AREAS,
  SEED_COUPONS,
  INITIAL_ORDERS,
  SEED_USERS,
} from './seedData';

// Central Reactive Data Store for Zestora
// Ensures cross-actor synchronization between Customer, Restaurant, Delivery Partner, and Admin
class ZestoraStore {
  private restaurants: Restaurant[] = JSON.parse(JSON.stringify(SEED_RESTAURANTS));
  private products: Product[] = JSON.parse(JSON.stringify(SEED_PRODUCTS));
  private orders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  private coupons: Coupon[] = JSON.parse(JSON.stringify(SEED_COUPONS));
  private serviceAreas: ServiceArea[] = JSON.parse(JSON.stringify(SEED_SERVICE_AREAS));
  private deliveryPartners: DeliveryPartner[] = [
    {
      id: 'partner-1',
      userId: 'user-delivery-1',
      name: 'Rahul Naik',
      phone: '+91 94488 55667',
      vehicleNumber: 'KA-47-E-8821',
      vehicleType: 'Honda Activa 6G',
      onlineStatus: 'ONLINE',
      rating: 4.85,
      totalTrips: 342,
      todayTrips: 6,
      todayEarnings: 420,
      walletBalance: 1250,
      currentLat: 13.9872,
      currentLng: 74.5612,
    },
  ];
  private reviews: Review[] = [
    {
      id: 'rev-1',
      orderId: 'order-10480',
      restaurantId: 'rest-1',
      restaurantName: 'Spice Garden',
      userName: 'Anas Ahmed',
      foodRating: 5,
      packagingRating: 5,
      deliveryRating: 5,
      comment: 'The authentic Bhatkali biryani flavor was incredible! Arrived steaming hot.',
      reply: 'Thank you Anas! We pride ourselves on preserving original recipes.',
      createdAt: '2026-09-21T18:50:00Z',
    },
  ];
  private tickets: SupportTicket[] = [
    {
      id: 'tkt-1',
      ticketId: 'TKT-7821',
      userId: 'user-customer-1',
      userName: 'Anas Ahmed',
      category: 'ORDER_ISSUE',
      subject: 'Inquiry regarding cutlery eco-packaging',
      status: 'RESOLVED',
      messages: [
        { sender: 'Anas Ahmed', message: 'Does Zestora support 100% biodegradable bagasse boxes?', timestamp: '2026-09-21T17:00:00Z' },
        { sender: 'Zestora Support', message: 'Yes! All partner restaurants in Bhatkal use certified food-grade eco containers.', timestamp: '2026-09-21T17:15:00Z' },
      ],
      createdAt: '2026-09-21T17:00:00Z',
    },
  ];
  private auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      adminName: 'Operations Admin',
      action: 'SYSTEM_BOOT',
      entity: 'Platform',
      entityId: 'SYSTEM',
      timestamp: new Date().toISOString(),
    },
  ];

  // RESTAURANTS
  getRestaurants(): Restaurant[] {
    return this.restaurants;
  }

  getRestaurantById(id: string): Restaurant | undefined {
    return this.restaurants.find((r) => r.id === id || r.slug === id);
  }

  updateRestaurantStatus(id: string, isOpen: boolean): boolean {
    const rest = this.getRestaurantById(id);
    if (!rest) return false;
    const oldVal = rest.isOpen ? 'OPEN' : 'CLOSED';
    rest.isOpen = isOpen;
    this.addAuditLog('UPDATE_STORE_STATUS', 'Restaurant', rest.id, oldVal, isOpen ? 'OPEN' : 'CLOSED');
    return true;
  }

  // GROCERY & PRODUCTS
  getGroceryStore() {
    return SEED_GROCERY_STORE;
  }

  getProducts(): Product[] {
    return this.products;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  // COUPONS
  getCoupons(): Coupon[] {
    return this.coupons;
  }

  validateCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; discount: number; message: string } {
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid or expired coupon code' };
    }
    if (subtotal < coupon.minimumOrder) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order value for ${coupon.code} is ₹${coupon.minimumOrder}`,
      };
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = Math.min(coupon.discountValue, subtotal);
    } else if (coupon.type === 'FREE_DELIVERY') {
      discount = 30; // base delivery discount
    }

    return { valid: true, coupon, discount: Math.round(discount), message: 'Coupon applied successfully!' };
  }

  // PRICING (AUTHORITATIVE SERVER-SIDE)
  calculateCartPricing(
    items: CartItem[],
    couponCode?: string,
    tipAmount: number = 0,
    areaZone?: string
  ): CartPricing {
    const subtotal = items.reduce((sum, item) => {
      let itemPrice = item.unitPrice;
      if (item.selectedVariant) itemPrice = item.selectedVariant.price;
      const addonsCost = (item.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
      return sum + (itemPrice + addonsCost) * item.quantity;
    }, 0);

    const hasGrocery = items.some((i) => i.type === 'GROCERY');
    const packagingFee = items.length > 0 ? (hasGrocery ? 10 : 20) : 0;
    const platformFee = items.length > 0 ? 5 : 0;

    // Determine delivery fee from zone or subtotal
    let deliveryFee = 30;
    if (subtotal >= 499) {
      deliveryFee = 0; // Free delivery for large orders
    } else if (areaZone) {
      const zone = this.serviceAreas.find((z) => z.zoneName.toLowerCase().includes(areaZone.toLowerCase()));
      if (zone) deliveryFee = zone.baseDelivery + zone.surgeFee;
    }

    // Taxes: 5% on restaurant items, 0% on raw groceries
    const taxes = Math.round(subtotal * 0.05);

    let discount = 0;
    let appliedCoupon: Coupon | null = null;
    if (couponCode) {
      const cRes = this.validateCoupon(couponCode, subtotal);
      if (cRes.valid && cRes.coupon) {
        discount = cRes.discount;
        appliedCoupon = cRes.coupon;
      }
    }

    const tip = Math.max(0, tipAmount);
    const total = Math.max(0, subtotal + packagingFee + deliveryFee + platformFee + taxes + tip - discount);

    return {
      subtotal,
      packagingFee,
      deliveryFee,
      platformFee,
      taxes,
      discount,
      total,
      appliedCoupon,
      tip,
    };
  }

  // ORDERS & TRANSACTIONAL WORKFLOW
  getOrders(): Order[] {
    return this.orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  createOrder(payload: {
    items: CartItem[];
    address: any;
    paymentMethod: any;
    couponCode?: string;
    tip?: number;
    deliveryType?: 'STANDARD' | 'SCHEDULED';
    scheduledTime?: string;
    restaurantId?: string;
    restaurantName?: string;
    groceryStoreId?: string;
    groceryStoreName?: string;
  }): { success: boolean; order?: Order; message?: string } {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, message: 'Cart cannot be empty' };
    }

    // Validate inventory for grocery items
    for (const item of payload.items) {
      if (item.type === 'GROCERY' && item.productId) {
        const prod = this.getProductById(item.productId);
        if (prod && prod.stock < item.quantity) {
          return {
            success: false,
            message: `Item "${item.name}" has only ${prod.stock} units available. Please update cart.`,
          };
        }
      }
    }

    // Reserve stock
    for (const item of payload.items) {
      if (item.type === 'GROCERY' && item.productId) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.stock -= item.quantity;
          prod.reserved += item.quantity;
        }
      }
    }

    // Server-side authoritative pricing
    const pricing = this.calculateCartPricing(
      payload.items,
      payload.couponCode,
      payload.tip || 0,
      payload.address.area
    );

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ZES-${dateStr}-${randomSuffix}`;
    const orderId = `order-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: 'user-customer-1',
      customerName: 'Anas Ahmed',
      customerPhone: payload.address.phone || '+91 98765 43210',
      restaurantId: payload.restaurantId,
      restaurantName: payload.restaurantName,
      groceryStoreId: payload.groceryStoreId,
      groceryStoreName: payload.groceryStoreName,
      address: payload.address,
      items: payload.items.map((i, idx) => ({
        id: `item-${idx}-${Date.now()}`,
        name: i.name,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        totalPrice: (i.selectedVariant ? i.selectedVariant.price : i.unitPrice) * i.quantity,
        variantName: i.selectedVariant?.name,
        addons: i.selectedAddons?.map((a) => a.name),
        instructions: i.instructions,
      })),
      status: 'PLACED',
      statusHistory: [
        {
          status: 'PLACED',
          note: 'Order successfully created and payment verified',
          timestamp: new Date().toISOString(),
        },
      ],
      subtotal: pricing.subtotal,
      packagingFee: pricing.packagingFee,
      deliveryFee: pricing.deliveryFee,
      platformFee: pricing.platformFee,
      taxes: pricing.taxes,
      discount: pricing.discount,
      tip: pricing.tip,
      totalAmount: pricing.total,
      paymentMethod: payload.paymentMethod || 'UPI',
      paymentStatus: 'SUCCESS',
      deliveryType: payload.deliveryType || 'STANDARD',
      scheduledTime: payload.scheduledTime,
      estimatedDeliveryTime: '30-40 mins',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);

    this.addAuditLog(
      'ORDER_CREATED',
      'Order',
      newOrder.orderNumber,
      'NONE',
      `Amount: ₹${newOrder.totalAmount}`
    );

    return { success: true, order: newOrder };
  }

  // ORDER STATE MACHINE & PROGRESSION
  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    rejectionReason?: string
  ): { success: boolean; order?: Order; message?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    // Valid transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['CONFIRMED', 'RESTAURANT_ACCEPTED', 'CANCELLED'],
      PAYMENT_PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['RESTAURANT_ACCEPTED', 'CANCELLED'],
      RESTAURANT_ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: ['DELIVERY_ASSIGNED', 'PICKED_UP'],
      DELIVERY_ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['ON_THE_WAY'],
      ON_THE_WAY: ['ARRIVING', 'DELIVERED'],
      ARRIVING: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
      REFUND_PENDING: ['REFUNDED'],
      REFUNDED: [],
    };

    // If already in that state
    if (order.status === newStatus) return { success: true, order };

    const allowed = validTransitions[order.status];
    if (allowed && !allowed.includes(newStatus) && newStatus !== 'CANCELLED') {
      return {
        success: false,
        message: `Illegal status transition from ${order.status} to ${newStatus}`,
      };
    }

    const prevStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (rejectionReason) {
      order.rejectionReason = rejectionReason;
    }

    order.statusHistory.push({
      status: newStatus,
      note: note || `Status transitioned to ${newStatus}`,
      timestamp: new Date().toISOString(),
    });

    // Auto assign rider if restaurant marks ready or accepted
    if (newStatus === 'READY_FOR_PICKUP' || newStatus === 'DELIVERY_ASSIGNED') {
      const rider = this.deliveryPartners.find((p) => p.onlineStatus === 'ONLINE');
      if (rider) {
        order.deliveryPartnerId = rider.userId;
        order.deliveryPartnerName = rider.name;
        order.deliveryPartnerPhone = rider.phone;
        order.currentRiderLat = rider.currentLat;
        order.currentRiderLng = rider.currentLng;
      }
    }

    if (newStatus === 'DELIVERED') {
      const rider = this.deliveryPartners.find((p) => p.userId === order.deliveryPartnerId);
      if (rider) {
        rider.todayTrips += 1;
        rider.totalTrips += 1;
        rider.todayEarnings += Math.round(order.deliveryFee + order.tip);
        rider.walletBalance += Math.round(order.deliveryFee + order.tip);
      }
    }

    this.addAuditLog('ORDER_STATUS_UPDATE', 'Order', order.orderNumber, prevStatus, newStatus);

    return { success: true, order };
  }

  // DELIVERY PARTNERS
  getDeliveryPartners(): DeliveryPartner[] {
    return this.deliveryPartners;
  }

  togglePartnerOnline(partnerId: string): boolean {
    const partner = this.deliveryPartners.find((p) => p.id === partnerId || p.userId === partnerId);
    if (!partner) return false;
    partner.onlineStatus = partner.onlineStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    return true;
  }

  // REVIEWS
  getReviews(): Review[] {
    return this.reviews;
  }

  addReview(data: {
    orderId: string;
    restaurantId: string;
    restaurantName: string;
    foodRating: number;
    packagingRating: number;
    deliveryRating: number;
    comment?: string;
  }): Review {
    const rev: Review = {
      id: `rev-${Date.now()}`,
      orderId: data.orderId,
      restaurantId: data.restaurantId,
      restaurantName: data.restaurantName,
      userName: 'Anas Ahmed',
      foodRating: data.foodRating,
      packagingRating: data.packagingRating,
      deliveryRating: data.deliveryRating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };
    this.reviews.unshift(rev);
    return rev;
  }

  // SUPPORT TICKETS
  getSupportTickets(): SupportTicket[] {
    return this.tickets;
  }

  createSupportTicket(data: { category: string; subject: string; message: string; orderId?: string }): SupportTicket {
    const num = Math.floor(1000 + Math.random() * 9000);
    const ticket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketId: `TKT-${num}`,
      userId: 'user-customer-1',
      userName: 'Anas Ahmed',
      orderId: data.orderId,
      category: data.category,
      subject: data.subject,
      status: 'OPEN',
      messages: [
        {
          sender: 'Anas Ahmed',
          message: data.message,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    this.tickets.unshift(ticket);
    return ticket;
  }

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  private addAuditLog(action: string, entity: string, entityId: string, oldValue?: string, newValue?: string) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminName: 'Operations Admin',
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  }

  // METRICS FOR ADMIN & RESTAURANT DASHBOARDS
  getAdminMetrics() {
    const completedOrders = this.orders.filter((o) => o.status === 'DELIVERED');
    const totalGMV = this.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPlatformCommission = Math.round(totalGMV * 0.20);
    const activeRiders = this.deliveryPartners.filter((p) => p.onlineStatus === 'ONLINE').length;
    const openOrders = this.orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;

    return {
      totalGMV,
      totalPlatformCommission,
      totalOrders: this.orders.length,
      completedOrdersCount: completedOrders.length,
      openOrdersCount: openOrders,
      activeRestaurantsCount: this.restaurants.filter((r) => r.isOpen).length,
      activeRidersCount: activeRiders,
      satisfactionRate: 4.8,
    };
  }

  getRestaurantMetrics(restaurantId: string) {
    const restOrders = this.orders.filter((o) => o.restaurantId === restaurantId);
    const revenue = restOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const commission = Math.round(revenue * 0.20);
    const netPayout = revenue - commission;
    const pendingOrders = restOrders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));

    return {
      totalOrders: restOrders.length,
      todayRevenue: revenue,
      commission,
      netPayout,
      pendingCount: pendingOrders.length,
      averageRating: 4.7,
    };
  }
}

// Global Singleton for development and demo mode
const globalForStore = globalThis as unknown as { zestoraStore: ZestoraStore };
export const zestoraStore = globalForStore.zestoraStore || new ZestoraStore();
if (process.env.NODE_ENV !== 'production') globalForStore.zestoraStore = zestoraStore;
