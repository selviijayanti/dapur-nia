export interface MenuItem {
  id?: string
  nama: string
  harga: number
  sisa_porsi: number
  kategori?: string
  created_at?: string
}

export interface CustomerItem {
  id?: string
  nama: string
  whatsapp: string
  alamat: string
  created_at?: string
}

export type OrderStatus =
  | 'menunggu_konfirmasi'
  | 'dikonfirmasi'
  | 'diproses'
  | 'dikirim'
  | 'selesai'
  | 'dibatalkan'

export interface OrderItemEntry {
  menu_id: string
  nama: string
  harga_satuan: number
  jumlah_porsi: number
  subtotal: number
}

export interface OrderItem {
  id?: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: OrderItemEntry[]
  ongkir: number
  total_tagihan: number
  status: OrderStatus
  created_at: string
}
