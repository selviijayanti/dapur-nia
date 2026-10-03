import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { MenuItem, CustomerItem, OrderItem, OrderStatus } from '@/types/database'

// Koleksi Firestore
const MENUS_COLLECTION = 'menus'
const CUSTOMERS_COLLECTION = 'customers'
const ORDERS_COLLECTION = 'orders'

// State Machine Status Pesanan (Runtut sesuai AC 4.3.3)
export const VALID_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  menunggu_konfirmasi: ['dikonfirmasi', 'dibatalkan'],
  dikonfirmasi: ['diproses', 'dibatalkan'],
  diproses: ['dikirim'],
  dikirim: ['selesai'],
  selesai: [],
  dibatalkan: [],
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  menunggu_konfirmasi: 'Menunggu Konfirmasi',
  dikonfirmasi: 'Dikonfirmasi',
  diproses: 'Diproses / Masak',
  dikirim: 'Dalam Pengiriman',
  selesai: 'Selesai Diterima',
  dibatalkan: 'Dibatalkan',
}

// ---------------- MENU SERVICES ----------------
export function subscribeMenus(
  callback: (menus: MenuItem[]) => void,
  errorCallback?: (error: Error) => void
) {
  if (!isFirebaseConfigured) return () => {}

  const q = query(collection(db, MENUS_COLLECTION), orderBy('nama', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const list: MenuItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MenuItem, 'id'>),
      }))
      callback(list)
    },
    (err) => {
      if (errorCallback) errorCallback(err)
    }
  )
}

export async function createMenu(menu: Omit<MenuItem, 'id'>) {
  if (menu.harga <= 0) throw new Error('Harga menu harus bernilai positif!')
  if (menu.sisa_porsi < 0) throw new Error('Sisa porsi tidak boleh bernilai negatif!')

  return await addDoc(collection(db, MENUS_COLLECTION), {
    ...menu,
    created_at: new Date().toISOString(),
  })
}

export async function updateMenu(id: string, menu: Partial<MenuItem>) {
  if (menu.harga !== undefined && menu.harga <= 0) throw new Error('Harga menu harus bernilai positif!')
  if (menu.sisa_porsi !== undefined && menu.sisa_porsi < 0) throw new Error('Sisa porsi tidak boleh bernilai negatif!')
  const docRef = doc(db, MENUS_COLLECTION, id)
  return await updateDoc(docRef, menu)
}

export async function updateMenuStock(id: string, sisa_porsi: number) {
  if (sisa_porsi < 0) throw new Error('Sisa porsi tidak boleh negatif!')
  const docRef = doc(db, MENUS_COLLECTION, id)
  return await updateDoc(docRef, { sisa_porsi })
}

export async function deleteMenu(id: string) {
  const docRef = doc(db, MENUS_COLLECTION, id)
  return await deleteDoc(docRef)
}

// ---------------- CUSTOMER SERVICES ----------------
export function subscribeCustomers(
  callback: (customers: CustomerItem[]) => void,
  errorCallback?: (error: Error) => void
) {
  if (!isFirebaseConfigured) return () => {}

  const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy('nama', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CustomerItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CustomerItem, 'id'>),
      }))
      callback(list)
    },
    (err) => {
      if (errorCallback) errorCallback(err)
    }
  )
}

export async function createCustomer(customer: Omit<CustomerItem, 'id'>) {
  if (!customer.nama.trim()) throw new Error('Nama pelanggan wajib diisi!')
  if (!customer.whatsapp.trim()) throw new Error('Nomor WhatsApp wajib diisi!')
  if (!customer.alamat.trim()) throw new Error('Alamat pengiriman wajib diisi!')

  return await addDoc(collection(db, CUSTOMERS_COLLECTION), {
    ...customer,
    created_at: new Date().toISOString(),
  })
}

export async function updateCustomer(id: string, customer: Partial<CustomerItem>) {
  if (customer.nama !== undefined && !customer.nama.trim()) throw new Error('Nama pelanggan wajib diisi!')
  if (customer.whatsapp !== undefined && !customer.whatsapp.trim()) throw new Error('Nomor WhatsApp wajib diisi!')
  if (customer.alamat !== undefined && !customer.alamat.trim()) throw new Error('Alamat pengiriman wajib diisi!')
  const docRef = doc(db, CUSTOMERS_COLLECTION, id)
  return await updateDoc(docRef, customer)
}

export async function deleteCustomer(id: string) {
  const docRef = doc(db, CUSTOMERS_COLLECTION, id)
  return await deleteDoc(docRef)
}

// ---------------- ORDER SERVICES ----------------
export function subscribeOrders(
  callback: (orders: OrderItem[]) => void,
  errorCallback?: (error: Error) => void
) {
  if (!isFirebaseConfigured) return () => {}

  const q = query(collection(db, ORDERS_COLLECTION), orderBy('created_at', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const list: OrderItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<OrderItem, 'id'>),
      }))
      callback(list)
    },
    (err) => {
      if (errorCallback) errorCallback(err)
    }
  )
}

export async function deleteOrder(id: string) {
  const docRef = doc(db, ORDERS_COLLECTION, id)
  return await deleteDoc(docRef)
}

// Membuat pesanan dengan transaksi atomik untuk memastikan stok berkurang & tidak negatif
export async function createOrder(orderData: Omit<OrderItem, 'id'>) {
  if (orderData.items.length === 0) {
    throw new Error('Pesanan harus memiliki minimal 1 item menu!')
  }

  for (const item of orderData.items) {
    if (item.jumlah_porsi <= 0) {
      throw new Error(`Jumlah porsi untuk ${item.nama} harus lebih dari 0!`)
    }
  }

  if (orderData.total_tagihan <= 0) {
    throw new Error('Total tagihan pesanan harus bernilai lebih dari 0!')
  }

  return await runTransaction(db, async (transaction) => {
    // 1. Verifikasi dan kurangi stok menu
    for (const item of orderData.items) {
      const menuRef = doc(db, MENUS_COLLECTION, item.menu_id)
      const menuSnap = await transaction.get(menuRef)
      if (!menuSnap.exists()) {
        throw new Error(`Menu "${item.nama}" tidak ditemukan di database!`)
      }

      const currentStock = menuSnap.data().sisa_porsi ?? 0
      if (currentStock < item.jumlah_porsi) {
        throw new Error(`Sisa porsi untuk "${item.nama}" tidak mencukupi (sisa: ${currentStock})!`)
      }

      transaction.update(menuRef, {
        sisa_porsi: currentStock - item.jumlah_porsi,
      })
    }

    // 2. Simpan pesanan
    const newOrderRef = doc(collection(db, ORDERS_COLLECTION))
    transaction.set(newOrderRef, {
      ...orderData,
      created_at: new Date().toISOString(),
    })

    return newOrderRef.id
  })
}

// Update status pesanan dengan validasi transisi kaku (AC 4.3.3)
export async function advanceOrderStatus(
  orderId: string,
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
) {
  const allowedTransitions = VALID_STATUS_FLOW[currentStatus] || []
  if (!allowedTransitions.includes(nextStatus)) {
    throw new Error(
      `Perubahan status tidak sah: Tidak dapat mengubah dari "${STATUS_LABELS[currentStatus]}" ke "${STATUS_LABELS[nextStatus]}".`
    )
  }

  const orderRef = doc(db, ORDERS_COLLECTION, orderId)
  return await updateDoc(orderRef, { status: nextStatus })
}
