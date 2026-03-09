// Meta (Facebook) Pixel Integration
// Configure Pixel ID in site_settings with key 'meta_pixel_id'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const initMetaPixel = (pixelId: string) => {
  if (!pixelId || typeof window === "undefined") return;
  if (window.fbq) return; // Already initialized

  // Facebook Pixel base code
  const n = (window.fbq = function () {
    // @ts-ignore
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  } as any);
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
};

const fbq = (...args: any[]) => {
  if (window.fbq) window.fbq(...args);
};

// Standard Events
export const trackMetaPageView = () => fbq("track", "PageView");

export const trackMetaViewContent = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) => {
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    content_category: product.category,
    value: product.price,
    currency: "TRY",
  });
};

export const trackMetaAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) => {
  fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price * product.quantity,
    currency: "TRY",
  });
};

export const trackMetaInitiateCheckout = (value: number, numItems: number) => {
  fbq("track", "InitiateCheckout", {
    value,
    currency: "TRY",
    num_items: numItems,
  });
};

export const trackMetaAddPaymentInfo = () => {
  fbq("track", "AddPaymentInfo");
};

export const trackMetaPurchase = (orderId: string, value: number, items: { id: string; quantity: number }[]) => {
  fbq("track", "Purchase", {
    content_ids: items.map((i) => i.id),
    content_type: "product",
    value,
    currency: "TRY",
    order_id: orderId,
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  });
};

export const trackMetaSearch = (searchQuery: string) => {
  fbq("track", "Search", { search_string: searchQuery });
};

export const trackMetaAddToWishlist = (product: { id: string; name: string; price: number }) => {
  fbq("track", "AddToWishlist", {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price,
    currency: "TRY",
  });
};

export const trackMetaLead = (email?: string) => {
  fbq("track", "Lead", email ? { email } : undefined);
};

export const trackMetaCompleteRegistration = (method: string) => {
  fbq("track", "CompleteRegistration", { status: true, method });
};

// Custom event helper
export const trackMetaCustomEvent = (eventName: string, params?: Record<string, any>) => {
  fbq("trackCustom", eventName, params);
};
