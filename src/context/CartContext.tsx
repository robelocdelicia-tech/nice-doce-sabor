"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product, ProductVariation, ProductAddOn } from "@/types";

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity: number,
    selectedVariation?: ProductVariation | null,
    selectedAddons?: ProductAddOn[],
    customNotes?: string,
    openDrawer?: boolean
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // Métodos rápidos para botões inline de sabor e produto
  getItemQuantity: (productId: string, variationName?: string) => number;
  quickIncrement: (product: Product, variation?: ProductVariation | null) => void;
  quickDecrement: (productId: string, variationName?: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Carrega carrinho do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nice_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Erro ao carregar carrinho:", e);
    }
    setIsHydrated(true);
  }, []);

  // Salva alterações no localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("nice_cart", JSON.stringify(items));
      } catch (e) {
        console.error("Erro ao salvar carrinho:", e);
      }
    }
  }, [items, isHydrated]);

  const addItem = (
    product: Product,
    quantity: number,
    selectedVariation?: ProductVariation | null,
    selectedAddons: ProductAddOn[] = [],
    customNotes: string = "",
    openDrawer: boolean = true
  ) => {
    const basePrice = selectedVariation ? selectedVariation.price : product.base_price;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + addonsTotal;
    const totalPrice = unitPrice * quantity;

    const sortedAddonKeys = [...selectedAddons].map((a) => a.name).sort().join("|");
    const variationKey = selectedVariation ? selectedVariation.name : "standard";
    const notesKey = customNotes.trim();
    const cartItemId = `${product.id}__${variationKey}__${sortedAddonKeys}__${notesKey}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cart_item_id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total_price: updated[existingIndex].unit_price * newQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cart_item_id: cartItemId,
          product,
          quantity,
          selected_variation: selectedVariation,
          selected_addons: selectedAddons,
          custom_notes: customNotes,
          unit_price: unitPrice,
          total_price: totalPrice,
        },
      ];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const getItemQuantity = (productId: string, variationName?: string): number => {
    const targetVariation = variationName || "standard";
    return items
      .filter((i) => {
        const itemVar = i.selected_variation ? i.selected_variation.name : "standard";
        return i.product.id === productId && itemVar === targetVariation;
      })
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const quickIncrement = (product: Product, variation?: ProductVariation | null) => {
    addItem(product, 1, variation, [], "", false);
  };

  const quickDecrement = (productId: string, variationName?: string) => {
    const targetVariation = variationName || "standard";
    setItems((prev) => {
      // Procura o último item adicionado correspondente
      const matchIndex = prev.map((item, idx) => ({ item, idx })).reverse().find(({ item }) => {
        const itemVar = item.selected_variation ? item.selected_variation.name : "standard";
        return item.product.id === productId && itemVar === targetVariation;
      })?.idx;

      if (matchIndex === undefined) return prev;

      const updated = [...prev];
      const target = updated[matchIndex];
      if (target.quantity > 1) {
        updated[matchIndex] = {
          ...target,
          quantity: target.quantity - 1,
          total_price: target.unit_price * (target.quantity - 1),
        };
        return updated;
      } else {
        return updated.filter((_, idx) => idx !== matchIndex);
      }
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.cart_item_id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total_price: item.unit_price * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNotes = (cartItemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.cart_item_id === cartItemId) {
          return {
            ...item,
            custom_notes: notes,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cart_item_id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateNotes,
        removeItem,
        clearCart,
        subtotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        getItemQuantity,
        quickIncrement,
        quickDecrement,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
