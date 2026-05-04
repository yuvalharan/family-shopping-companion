import { useSyncExternalStore } from "react";
import { SEED_PRODUCTS, type Product, type ShoppingItem, type Category, type Unit } from "./familycart-data";

type State = {
  products: Product[];
  items: ShoppingItem[];
};

let state: State = {
  products: SEED_PRODUCTS,
  items: [],
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useFamilyCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const actions = {
  addProduct(input: { name: string; category: Category; default_quantity: number; unit: Unit }) {
    state = { ...state, products: [...state.products, { id: uid(), ...input }] };
    emit();
  },
  removeProduct(id: string) {
    state = {
      products: state.products.filter((p) => p.id !== id),
      items: state.items.filter((i) => i.product_id !== id),
    };
    emit();
  },
  addToShoppingList(product: Product) {
    if (state.items.some((i) => i.product_id === product.id)) return;
    state = {
      ...state,
      items: [
        ...state.items,
        {
          id: uid(),
          product_id: product.id,
          quantity_needed: product.default_quantity,
          is_checked: false,
        },
      ],
    };
    emit();
  },
  removeFromShoppingList(itemId: string) {
    state = { ...state, items: state.items.filter((i) => i.id !== itemId) };
    emit();
  },
  toggleChecked(itemId: string) {
    state = {
      ...state,
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, is_checked: !i.is_checked } : i
      ),
    };
    emit();
  },
  setQuantity(itemId: string, qty: number) {
    state = {
      ...state,
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, quantity_needed: Math.max(1, qty) } : i
      ),
    };
    emit();
  },
  clearChecked() {
    state = { ...state, items: state.items.filter((i) => !i.is_checked) };
    emit();
  },
};
