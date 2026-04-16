import { cookies } from 'next/headers'

export const FALLBACK_STORE_ID = '00000000-0000-0000-0000-000000000001'

/** Route Handler から現在選択中の店舗IDを取得する */
export async function getStoreId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('selected_store_id')?.value ?? FALLBACK_STORE_ID
}
