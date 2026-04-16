"use client";

import {
  createContext, useContext, useEffect, useState,
  useCallback, ReactNode, useRef,
} from "react";
import { useRouter } from "next/navigation";

console.log('[store-context] module loaded');

export const STORE_COOKIE = "selected_store_id";
export const FALLBACK_STORE_ID = "00000000-0000-0000-0000-000000000001";

export interface StoreItem {
  id: string;
  name: string;
  area: string;
  category: string;
  keywords: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  map_rank: number | null;
}

interface StoreContextValue {
  stores: StoreItem[];
  currentStore: StoreItem | null;
  currentStoreId: string;
  switchStore: (id: string) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextValue>({
  stores: [],
  currentStore: null,
  currentStoreId: FALLBACK_STORE_ID,
  switchStore: () => {},
  loading: true,
});

function getStoredId(): string {
  if (typeof window === "undefined") return FALLBACK_STORE_ID;
  return localStorage.getItem(STORE_COOKIE) ?? FALLBACK_STORE_ID;
}

function setCookie(id: string) {
  document.cookie = `${STORE_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  console.log('[StoreProvider] rendering');
  const router = useRouter();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string>(FALLBACK_STORE_ID);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    console.log('[StoreProvider] effect called, initialized:', initialized.current);
    if (initialized.current) return;
    initialized.current = true;

    const saved = getStoredId();
    console.log('[StoreProvider] fetching stores, savedId:', saved);
    setCurrentStoreId(saved);
    setCookie(saved);

    fetch("/api/stores")
      .then((r) => r.json())
      .then((data: { stores: StoreItem[] }) => {
        console.log('[StoreProvider] stores loaded:', data.stores?.length);
        const list = data.stores ?? [];
        setStores(list);

        // 保存済みIDが有効でなければ最初の店舗を選択
        if (list.length > 0 && !list.find((s) => s.id === saved)) {
          const firstId = list[0].id;
          setCurrentStoreId(firstId);
          localStorage.setItem(STORE_COOKIE, firstId);
          setCookie(firstId);
        }
      })
      .catch((e) => { console.error('[StoreProvider] fetch error:', e); })
      .finally(() => {
        console.log('[StoreProvider] setLoading(false)');
        setLoading(false);
      });
  }, []);

  const switchStore = useCallback(
    (id: string) => {
      if (id === currentStoreId) return;
      setCurrentStoreId(id);
      localStorage.setItem(STORE_COOKIE, id);
      setCookie(id);
      // API ルートが新しい cookie を読むようにページを更新
      router.refresh();
    },
    [currentStoreId, router]
  );

  const currentStore = stores.find((s) => s.id === currentStoreId) ?? null;

  return (
    <StoreContext.Provider
      value={{ stores, currentStore, currentStoreId, switchStore, loading }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
