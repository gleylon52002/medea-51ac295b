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

  // Load gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
};

const gtag = (...args: any[]) => {
  if (window.gtag) window.gtag(...args);
};

// E-Commerce Events
export const trackViewItem = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) => {
  gtag("event", "view_item", {
    currency: "TRY",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.category }],
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

export const trackBeginCheckout = (value: number, items: any[]) => {
  gtag("event", "begin_checkout", {
    currency: "TRY",
    value,
    items,
  });
};

export const trackPurchase = (orderId: string, value: number, items: any[], shipping?: number, coupon?: string) => {
  gtag("event", "purchase", {
    transaction_id: orderId,
    currency: "TRY",
    value,
    shipping,
    coupon,
    items,
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

export const trackSearch = (searchTerm: string) => {
  gtag("event", "search", { search_term: searchTerm });
};

export const trackSelectItem = (product: { id: string; name: string; price: number }) => {
  gtag("event", "select_item", {
    items: [{ item_id: product.id, item_name: product.name, price: product.price }],
  });
};
