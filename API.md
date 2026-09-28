# Zestora REST API Reference (`/api/v1/*`)

This document provides complete documentation for the REST API endpoints implemented in the Zestora platform.

---

## Base URL
```
http://localhost:3000/api/v1
```

---

## 1. Restaurants API

### `GET /api/v1/restaurants`
Returns a list of all active restaurants. Supports filtering by cuisine, search term, and dietary preferences.

**Query Parameters:**
- `q` (string, optional): Search keyword matching restaurant name, cuisine, or description.
- `cuisine` (string, optional): Filter by cuisine name.
- `vegOnly` (boolean, optional): If `true`, returns only pure vegetarian restaurants.

**Response:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "id": "rest-spice-garden",
      "name": "Spice Garden",
      "slug": "spice-garden",
      "description": "Authentic North Indian curries, aromatic biryanis and tandoor breads",
      "rating": 4.6,
      "reviewCount": 384,
      "cuisines": ["North Indian", "Biryani", "Tandoor", "Mughlai"],
      "deliveryTimeMin": 25,
      "deliveryTimeMax": 35,
      "minOrderAmount": 149,
      "costForTwo": 400,
      "isOpen": true
    }
  ]
}
```

### `GET /api/v1/restaurants/:id`
Returns a single restaurant with its full catalog of categorized menu items.

---

## 2. Products API

### `GET /api/v1/products`
Retrieves products across restaurants or the QuickMart grocery catalog.

**Query Parameters:**
- `restaurantId` (string, optional): Filter products by restaurant.
- `isGrocery` (boolean, optional): Filter for quick-commerce grocery items.
- `category` (string, optional): Filter by product category.

---

## 3. Orders API

### `POST /api/v1/orders`
Creates and validates a new customer order. Performs authoritative server-side pricing calculation and inventory verification.

**Request Body:**
```json
{
  "customerId": "user-cust-1",
  "restaurantId": "rest-spice-garden",
  "items": [
    {
      "productId": "prod-biryani-1",
      "quantity": 2,
      "selectedVariant": { "id": "var-2", "name": "Jumbo Pack", "price": 420 },
      "selectedAddons": [{ "id": "add-1", "name": "Extra Egg", "price": 25 }]
    }
  ],
  "deliveryAddress": {
    "street": "Main Road, Near Old Bus Stand",
    "area": "Bhatkal Central",
    "city": "Bhatkal",
    "pincode": "581320",
    "instructions": "Leave at front gate"
  },
  "paymentMethod": "UPI",
  "couponCode": "ZEST50",
  "tip": 20
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ZES-20260928-84291",
    "status": "PLACED",
    "subtotal": 890,
    "discount": 100,
    "deliveryFee": 0,
    "packagingFee": 15,
    "platformFee": 5,
    "tax": 45.25,
    "tip": 20,
    "total": 870.25,
    "estimatedDeliveryTime": "35 mins"
  }
}
```

### `GET /api/v1/orders`
Retrieves orders with optional filtering by `customerId`, `restaurantId`, or `status`.

### `GET /api/v1/orders/:id`
Retrieves real-time order details including current status, status history, driver location coordinates, and breakdown.

### `PATCH /api/v1/orders/:id`
Advances the order state or updates delivery assignments. Validated against the order state machine.

**Request Body:**
```json
{
  "status": "PREPARING",
  "actorRole": "RESTAURANT_OWNER",
  "note": "Chef began food preparation"
}
```

---

## 4. Coupons & Offers API

### `GET /api/v1/coupons`
Returns active promotional coupons.

### `POST /api/v1/coupons/validate`
Validates a coupon code against a given order subtotal and restaurant.

**Request Body:**
```json
{
  "code": "ZEST50",
  "subtotal": 350
}
```

**Response:**
```json
{
  "valid": true,
  "discountAmount": 100,
  "coupon": {
    "code": "ZEST50",
    "description": "50% off up to ₹100",
    "discountType": "PERCENTAGE",
    "discountValue": 50,
    "maxDiscount": 100,
    "minOrderAmount": 299
  }
}
```

---

## 5. Delivery Partner API

### `GET /api/v1/delivery`
Fetches available orders for pickup and active assignments for a delivery partner.

### `POST /api/v1/delivery`
Updates delivery partner online/offline status or coordinates.

---

## 6. Admin API

### `GET /api/v1/admin/metrics`
Returns real-time platform metrics, daily GMV, commission earned, audit logs, and delivery zone configurations.
