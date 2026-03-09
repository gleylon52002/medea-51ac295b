// GA4 E-Commerce Event Tracking
// Configure GA4 Measurement ID in site_settings with key 'ga4_measurement_id'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const initGA4 = (measurementId: string) => {
  if (!measurementId || typeof window === "undefined") return;

  // Prevent double-loading
  if (document.querySelector(`script[src*="${measurementId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
  });
};

const gtag = (...args: any[]) => {
  if (window.gtag) window.gtag(...args);
};

// ─── Page & Navigation Events ────────────────────────────────────

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};

// ─── E-Commerce Events (GA4 Enhanced) ────────────────────────────

export const trackViewItem = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
}) => {
  gtag("event", "view_item", {
    currency: "TRY",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.category, item_brand: product.brand }],
  });
};

export const trackViewItemList = (listName: string, items: any[]) => {
  gtag("event", "view_item_list", {
    item_list_name: listName,
    items: items.slice(0, 10).map((item, index) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      index,
    })),
  });
};

export const trackSelectItem = (product: { id: string; name: string; price: number }, listName?: string) => {
  gtag("event", "select_item", {
    item_list_name: listName,
    items: [{ item_id: product.id, item_name: product.name, price: product.price }],
  });
};

export const trackAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}) => {
  gtag("event", "add_to_cart", {
    currency: "TRY",
    value: product.price * product.quantity,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity, item_category: product.category }],
  });
};

export const trackRemoveFromCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) => {
  gtag("event", "remove_from_cart", {
    currency: "TRY",
    value: product.price * product.quantity,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
  });
};

export const trackViewCart = (value: number, items: any[]) => {
  gtag("event", "view_cart", {
    currency: "TRY",
    value,
    items: items.map((item, index) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
      index,
    })),
  });
};

export const trackBeginCheckout = (value: number, items: any[], coupon?: string) => {
  gtag("event", "begin_checkout", {
    currency: "TRY",
    value,
    coupon,
    items,
  });
};

export const trackAddShippingInfo = (value: number, shippingTier: string, items: any[]) => {
  gtag("event", "add_shipping_info", {
    currency: "TRY",
    value,
    shipping_tier: shippingTier,
    items,
  });
};

export const trackAddPaymentInfo = (value: number, paymentType: string, items: any[]) => {
  gtag("event", "add_payment_info", {
    currency: "TRY",
    value,
    payment_type: paymentType,
    items,
  });
};

export const trackPurchase = (orderId: string, value: number, items: any[], shipping?: number, coupon?: string, tax?: number) => {
  gtag("event", "purchase", {
    transaction_id: orderId,
    currency: "TRY",
    value,
    shipping,
    tax,
    coupon,
    items,
  });
};

export const trackRefund = (orderId: string, value?: number, items?: any[]) => {
  const params: any = { transaction_id: orderId, currency: "TRY" };
  if (value !== undefined) params.value = value;
  if (items) params.items = items;
  gtag("event", "refund", params);
};

// ─── Engagement Events ───────────────────────────────────────────

export const trackSearch = (searchTerm: string) => {
  gtag("event", "search", { search_term: searchTerm });
};

export const trackSignUp = (method: string) => {
  gtag("event", "sign_up", { method });
};

export const trackLogin = (method: string) => {
  gtag("event", "login", { method });
};

export const trackShare = (contentType: string, itemId: string, method: string) => {
  gtag("event", "share", { content_type: contentType, item_id: itemId, method });
};

export const trackAddToWishlist = (product: { id: string; name: string; price: number }) => {
  gtag("event", "add_to_wishlist", {
    currency: "TRY",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price }],
  });
};

// ─── Behavioral / UX Events ─────────────────────────────────────

export const trackScrollDepth = (percent: number, pagePath: string) => {
  gtag("event", "scroll_depth", {
    percent_scrolled: percent,
    page_path: pagePath,
  });
};

export const trackCouponApply = (couponCode: string, success: boolean) => {
  gtag("event", success ? "apply_coupon_success" : "apply_coupon_fail", {
    coupon: couponCode,
  });
};

export const trackNewsletterSignup = (method: string) => {
  gtag("event", "newsletter_signup", { method });
};

export const trackException = (description: string, fatal: boolean = false) => {
  gtag("event", "exception", { description, fatal });
};

// ─── Custom Event Helper ─────────────────────────────────────────

export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  gtag("event", eventName, params);
};

// ─── Scroll Depth Auto-Tracker ───────────────────────────────────

let scrollTrackerInitialized = false;
const scrollMilestones = new Set<number>();

export const initScrollDepthTracker = () => {
  if (scrollTrackerInitialized || typeof window === "undefined") return;
  scrollTrackerInitialized = true;

  const thresholds = [25, 50, 75, 90, 100];

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const percent = Math.round((window.scrollY / scrollHeight) * 100);
    
    for (const t of thresholds) {
      if (percent >= t && !scrollMilestones.has(t)) {
        scrollMilestones.add(t);
        trackScrollDepth(t, window.location.pathname);
      }
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
};

export const resetScrollTracker = () => {
  scrollMilestones.clear();
};
