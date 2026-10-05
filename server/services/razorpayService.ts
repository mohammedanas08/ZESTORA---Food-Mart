import crypto from 'crypto';

export interface CreateOrderParams {
  orderId: string;
  orderNumber: string;
  amountInRupees: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface RazorpayOrderResult {
  razorpayOrderId: string;
  amountInPaise: number;
  amountInRupees: number;
  currency: string;
  qrString: string;
  keyId: string;
  isTestMode: boolean;
}

class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private processedPayments = new Set<string>();

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_zestora_demo';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_zestora_demo_key';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_zestora';
  }

  getPublicConfig() {
    // Only return the public key, NEVER the secret!
    return {
      keyId: this.keyId,
      currency: 'INR',
      isTestMode: this.isTestMode(),
    };
  }

  isTestMode(): boolean {
    return !process.env.RAZORPAY_KEY_SECRET || this.keyId.startsWith('rzp_test_');
  }

  /**
   * Creates a Razorpay order and generates an order-specific UPI payment QR string.
   * Authoritative calculation: amount is converted to paise (₹500 = 50000 paise).
   */
  async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
    const amountInPaise = Math.round(params.amountInRupees * 100);
    const amountFormatted = params.amountInRupees.toFixed(2);

    // Deterministic Razorpay Order ID for tracking
    const shortRef = params.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const razorpayOrderId = `order_${shortRef}_${Date.now().toString(36)}`;

    // Generate Dynamic Order-Specific UPI QR String
    // Format adheres to NPCI UPI Specifications:
    // upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&tr=<TransactionRef>&cu=INR&tn=<Note>
    const qrString = `upi://pay?pa=zestora.pay@razorpay&pn=Zestora+Food&am=${amountFormatted}&tr=${params.orderId}&cu=INR&tn=Order+${encodeURIComponent(params.orderNumber)}`;

    // If real production Razorpay credentials exist, invoke Razorpay API
    if (
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes('xxxxxxxxxx')
    ) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: params.orderNumber,
            notes: {
              zestoraOrderId: params.orderId,
            },
          }),
        });

        if (res.ok) {
          const apiData = await res.json();
          return {
            razorpayOrderId: apiData.id,
            amountInPaise,
            amountInRupees: params.amountInRupees,
            currency: 'INR',
            qrString,
            keyId: this.keyId,
            isTestMode: false,
          };
        }
      } catch (err) {
        console.warn('[Razorpay] Live API call failed, using secure test flow:', err);
      }
    }

    return {
      razorpayOrderId,
      amountInPaise,
      amountInRupees: params.amountInRupees,
      currency: 'INR',
      qrString,
      keyId: this.keyId,
      isTestMode: true,
    };
  }

  /**
   * Verifies Razorpay payment signature server-side using HMAC SHA256.
   * Never trust client-submitted success alone.
   */
  verifyPaymentSignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
  }): boolean {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return false;
    }

    // In development / test mode with simulated payment:
    if (this.isTestMode() && razorpayPaymentId.startsWith('pay_test_')) {
      return true;
    }

    if (!razorpaySignature) {
      return false;
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  /**
   * Verifies Razorpay Webhook signature server-side.
   */
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;

    // In dev / test mode allow test header
    if (this.isTestMode() && signature === 'test_webhook_signature') {
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if payment has already been processed to guarantee webhook idempotency.
   */
  isPaymentProcessed(paymentId: string): boolean {
    return this.processedPayments.has(paymentId);
  }

  markPaymentProcessed(paymentId: string): void {
    this.processedPayments.add(paymentId);
  }
}

export const razorpayService = new RazorpayService();
