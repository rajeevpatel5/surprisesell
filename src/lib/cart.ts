export type CartKind = "BUY" | "RENT";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  kind: CartKind;
  quantity: number;
  unitPriceCents: number;
  depositCents: number;
};

const STORAGE_KEY = "surprisesell_cart_v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("surprisesell-cart"));
}

export function addToCart(item: CartItem) {
  const cart = readCart();
  const idx = cart.findIndex((c) => c.productId === item.productId && c.kind === item.kind);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  writeCart(cart);
}

export function removeFromCart(productId: string, kind: CartKind) {
  writeCart(readCart().filter((c) => !(c.productId === productId && c.kind === kind)));
}

export function clearCart() {
  writeCart([]);
}

export function cartTotals(items: CartItem[]) {
  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const depositCents = items.reduce((sum, i) => sum + i.depositCents * i.quantity, 0);
  return { subtotalCents, depositCents };
}
