import { useState, useEffect } from 'react'
import {
  UtensilsCrossed,
  Users,
  ShoppingBag,
  TrendingUp,
  Plus,
  ChefHat,
  Phone,
  MapPin,
  Database,
  ArrowRight,
  XCircle,
  HelpCircle,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isFirebaseConfigured } from '@/lib/firebase'
import {
  subscribeMenus,
  createMenu,
  updateMenu,
  updateMenuStock,
  deleteMenu,
  subscribeCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  subscribeOrders,
  createOrder,
  advanceOrderStatus,
  deleteOrder,
  STATUS_LABELS,
  VALID_STATUS_FLOW,
} from '@/services/firestoreService'
import type { MenuItem, CustomerItem, OrderItem, OrderStatus } from '@/types/database'

type TabType = 'menu' | 'pelanggan' | 'pesanan' | 'laporan'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('menu')

  // Realtime state from Firestore (or fallback demo)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])

  // 3 States according to Praktik 1 (Loading, Empty, Error)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Modal Dialog States (Tambah)
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  // Modal Dialog States (Ubah)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false)
  const [editMenuForm, setEditMenuForm] = useState({ nama: '', harga: '', porsi: '', kategori: 'Paket Nasi' })

  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null)
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false)
  const [editCustomerForm, setEditCustomerForm] = useState({ nama: '', whatsapp: '', alamat: '' })

  // Forms Tambah
  const [menuForm, setMenuForm] = useState({ nama: '', harga: '', porsi: '', kategori: 'Paket Nasi' })
  const [customerForm, setCustomerForm] = useState({ nama: '', whatsapp: '', alamat: '' })
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    menuId: '',
    porsi: '1',
    ongkir: '10000',
  })

  // Date Filter untuk Laporan
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0])

  // Initial Sync / Subscriptions dengan Loading & Error State
  useEffect(() => {
    setIsLoading(true)
    setErrorMessage(null)

    if (isFirebaseConfigured) {
      let loadedCount = 0
      const checkDone = () => {
        loadedCount++
        if (loadedCount >= 3) setIsLoading(false)
      }

      const unsubMenus = subscribeMenus(
        (items) => {
          setMenus(items)
          checkDone()
        },
        (err) => {
          setErrorMessage('Gagal memuat daftar menu dari server: ' + err.message)
          setIsLoading(false)
        }
      )

      const unsubCustomers = subscribeCustomers(
        (items) => {
          setCustomers(items)
          checkDone()
        },
        (err) => {
          setErrorMessage('Gagal memuat data pelanggan dari server: ' + err.message)
          setIsLoading(false)
        }
      )

      const unsubOrders = subscribeOrders(
        (items) => {
          setOrders(items)
          checkDone()
        },
        (err) => {
          setErrorMessage('Gagal memuat pesanan dari server: ' + err.message)
          setIsLoading(false)
        }
      )

      const timer = setTimeout(() => setIsLoading(false), 1500)

      return () => {
        clearTimeout(timer)
        unsubMenus()
        unsubCustomers()
        unsubOrders()
      }
    } else {
      // Mock Data Contoh (Praktik 1)
      setMenus([
        { id: 'demo-1', nama: 'Paket Ayam Bakar Madu', harga: 25000, sisa_porsi: 12, kategori: 'Paket Nasi' },
        { id: 'demo-2', nama: 'Nasi Liwet Komplit Solo', harga: 28000, sisa_porsi: 5, kategori: 'Tradisional' },
        { id: 'demo-3', nama: 'Rendang Daging Sapi Suwir', harga: 35000, sisa_porsi: 0, kategori: 'Lauk Utama' },
      ])
      setCustomers([
        { id: 'cust-1', nama: 'Ibu Ratna S.', whatsapp: '081234567890', alamat: 'Jl. Melati No. 14, Kebayoran' },
        { id: 'cust-2', nama: 'Pak Hendra', whatsapp: '081398765432', alamat: 'Gedung Menara Mulia Lt. 5' },
      ])
      setOrders([
        {
          id: 'ord-1',
          customer_id: 'cust-1',
          customer_name: 'Ibu Ratna S.',
          customer_phone: '081234567890',
          customer_address: 'Jl. Melati No. 14, Kebayoran',
          items: [{ menu_id: 'demo-1', nama: 'Paket Ayam Bakar Madu', harga_satuan: 25000, jumlah_porsi: 2, subtotal: 50000 }],
          ongkir: 10000,
          total_tagihan: 60000,
          status: 'menunggu_konfirmasi',
          created_at: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
    }
  }, [])

  // Action: Tambah Menu
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    const harga = Number(menuForm.harga)
    const sisa_porsi = Number(menuForm.porsi)

    if (!menuForm.nama.trim() || harga <= 0 || sisa_porsi < 0) {
      setErrorMessage('Validasi gagal: Nama wajib diisi, harga harus bernilai positif (> 0), dan sisa porsi tidak boleh negatif (>= 0).')
      return
    }

    try {
      if (isFirebaseConfigured) {
        await createMenu({
          nama: menuForm.nama.trim(),
          harga,
          sisa_porsi,
          kategori: menuForm.kategori || 'Umum',
        })
      } else {
        setMenus((prev) => [
          ...prev,
          {
            id: `demo-${Date.now()}`,
            nama: menuForm.nama.trim(),
            harga,
            sisa_porsi,
            kategori: menuForm.kategori || 'Umum',
          },
        ])
      }
      setMenuForm({ nama: '', harga: '', porsi: '', kategori: 'Paket Nasi' })
      setIsMenuDialogOpen(false)
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan menu')
    }
  }

  // Action: Ubah (Edit) Menu
  const handleOpenEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu)
    setEditMenuForm({
      nama: menu.nama,
      harga: String(menu.harga),
      porsi: String(menu.sisa_porsi),
      kategori: menu.kategori || 'Paket Nasi',
    })
    setIsEditMenuOpen(true)
  }

  const handleSaveEditMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMenu?.id) return
    const harga = Number(editMenuForm.harga)
    const sisa_porsi = Number(editMenuForm.porsi)

    if (!editMenuForm.nama.trim() || harga <= 0 || sisa_porsi < 0) {
      setErrorMessage('Validasi gagal: Nama wajib diisi, harga harus > 0, dan porsi tidak boleh negatif.')
      return
    }

    try {
      if (isFirebaseConfigured) {
        await updateMenu(editingMenu.id, {
          nama: editMenuForm.nama.trim(),
          harga,
          sisa_porsi,
          kategori: editMenuForm.kategori || 'Umum',
        })
      } else {
        setMenus((prev) =>
          prev.map((m) =>
            m.id === editingMenu.id
              ? { ...m, nama: editMenuForm.nama.trim(), harga, sisa_porsi, kategori: editMenuForm.kategori }
              : m
          )
        )
      }
      setIsEditMenuOpen(false)
      setEditingMenu(null)
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memperbarui menu')
    }
  }

  // Action: Hapus Menu
  const handleDeleteMenu = async (id: string, nama: string) => {
    if (!window.confirm(`Yakin ingin menghapus menu "${nama}"? Data akan dihapus secara permanen.`)) return
    try {
      if (isFirebaseConfigured) {
        await deleteMenu(id)
      } else {
        setMenus((prev) => prev.filter((m) => m.id !== id))
      }
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menghapus menu')
    }
  }

  // Action: Tambah Pelanggan
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerForm.nama.trim() || !customerForm.whatsapp.trim() || !customerForm.alamat.trim()) {
      setErrorMessage('Validasi gagal: Semua field pelanggan (Nama, WhatsApp, Alamat) wajib diisi.')
      return
    }

    try {
      if (isFirebaseConfigured) {
        await createCustomer({
          nama: customerForm.nama.trim(),
          whatsapp: customerForm.whatsapp.trim(),
          alamat: customerForm.alamat.trim(),
        })
      } else {
        setCustomers((prev) => [
          ...prev,
          {
            id: `cust-${Date.now()}`,
            nama: customerForm.nama.trim(),
            whatsapp: customerForm.whatsapp.trim(),
            alamat: customerForm.alamat.trim(),
          },
        ])
      }
      setCustomerForm({ nama: '', whatsapp: '', alamat: '' })
      setIsCustomerDialogOpen(false)
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan pelanggan')
    }
  }

  // Action: Ubah (Edit) Pelanggan
  const handleOpenEditCustomer = (customer: CustomerItem) => {
    setEditingCustomer(customer)
    setEditCustomerForm({
      nama: customer.nama,
      whatsapp: customer.whatsapp,
      alamat: customer.alamat,
    })
    setIsEditCustomerOpen(true)
  }

  const handleSaveEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer?.id) return
    if (!editCustomerForm.nama.trim() || !editCustomerForm.whatsapp.trim() || !editCustomerForm.alamat.trim()) {
      setErrorMessage('Validasi gagal: Nama, WhatsApp, dan Alamat pelanggan wajib diisi.')
      return
    }

    try {
      if (isFirebaseConfigured) {
        await updateCustomer(editingCustomer.id, {
          nama: editCustomerForm.nama.trim(),
          whatsapp: editCustomerForm.whatsapp.trim(),
          alamat: editCustomerForm.alamat.trim(),
        })
      } else {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? { ...c, nama: editCustomerForm.nama.trim(), whatsapp: editCustomerForm.whatsapp.trim(), alamat: editCustomerForm.alamat.trim() }
              : c
          )
        )
      }
      setIsEditCustomerOpen(false)
      setEditingCustomer(null)
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memperbarui pelanggan')
    }
  }

  // Action: Hapus Pelanggan
  const handleDeleteCustomer = async (id: string, nama: string) => {
    if (!window.confirm(`Yakin ingin menghapus pelanggan "${nama}"?`)) return
    try {
      if (isFirebaseConfigured) {
        await deleteCustomer(id)
      } else {
        setCustomers((prev) => prev.filter((c) => c.id !== id))
      }
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menghapus pelanggan')
    }
  }

  // Action: Buat Pesanan
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetCustomer = customers.find((c) => c.id === orderForm.customerId)
    const targetMenu = menus.find((m) => m.id === orderForm.menuId)
    const porsi = Number(orderForm.porsi)
    const ongkir = Number(orderForm.ongkir) || 0

    if (!targetCustomer || !targetMenu) {
      setErrorMessage('Pilih pelanggan dan menu masakan terlebih dahulu.')
      return
    }

    if (porsi <= 0) {
      setErrorMessage('Jumlah porsi pesanan harus minimal 1.')
      return
    }

    if (porsi > targetMenu.sisa_porsi) {
      setErrorMessage(`Sisa porsi untuk "${targetMenu.nama}" tidak mencukupi (tersedia: ${targetMenu.sisa_porsi}).`)
      return
    }

    const subtotal = targetMenu.harga * porsi
    const total_tagihan = subtotal + ongkir

    try {
      if (isFirebaseConfigured) {
        await createOrder({
          customer_id: targetCustomer.id!,
          customer_name: targetCustomer.nama,
          customer_phone: targetCustomer.whatsapp,
          customer_address: targetCustomer.alamat,
          items: [
            {
              menu_id: targetMenu.id!,
              nama: targetMenu.nama,
              harga_satuan: targetMenu.harga,
              jumlah_porsi: porsi,
              subtotal,
            },
          ],
          ongkir,
          total_tagihan,
          status: 'menunggu_konfirmasi',
          created_at: new Date().toISOString(),
        })
      } else {
        // Local simulation
        setOrders((prev) => [
          {
            id: `ord-${Date.now()}`,
            customer_id: targetCustomer.id!,
            customer_name: targetCustomer.nama,
            customer_phone: targetCustomer.whatsapp,
            customer_address: targetCustomer.alamat,
            items: [
              {
                menu_id: targetMenu.id!,
                nama: targetMenu.nama,
                harga_satuan: targetMenu.harga,
                jumlah_porsi: porsi,
                subtotal,
              },
            ],
            ongkir,
            total_tagihan,
            status: 'menunggu_konfirmasi',
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
        setMenus((prev) =>
          prev.map((m) =>
            m.id === targetMenu.id ? { ...m, sisa_porsi: m.sisa_porsi - porsi } : m
          )
        )
      }

      setOrderForm({ customerId: '', menuId: '', porsi: '1', ongkir: '10000' })
      setIsOrderDialogOpen(false)
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal membuat pesanan')
    }
  }

  // Action: Transisi Status Pesanan
  const handleTransitionStatus = async (orderId: string, current: OrderStatus, next: OrderStatus) => {
    try {
      if (isFirebaseConfigured) {
        await advanceOrderStatus(orderId, current, next)
      } else {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: next } : ord))
        )
      }
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memperbarui status')
    }
  }

  // Action: Hapus Pesanan
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus riwayat pesanan ini?')) return
    try {
      if (isFirebaseConfigured) {
        await deleteOrder(id)
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== id))
      }
      setErrorMessage(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menghapus pesanan')
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Hitung Laporan Penjualan (Hanya pesanan bukan "dibatalkan" pada tanggal terpilih)
  const validOrdersOnDate = orders.filter((o) => {
    const isMatchingDate = o.created_at?.startsWith(reportDate)
    const isNotCancelled = o.status !== 'dibatalkan'
    return isMatchingDate && isNotCancelled
  })

  const totalOmzet = validOrdersOnDate.reduce((sum, o) => sum + o.total_tagihan, 0)
  const totalPorsi = validOrdersOnDate.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.jumlah_porsi, 0),
    0
  )

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col">
      <div className="w-full min-h-screen bg-stone-50/50 flex flex-col relative">
        
        {/* Connection Status Bar */}
        <div className={`w-full py-1.5 px-4 md:px-8 text-[11px] font-medium transition-colors ${
          isFirebaseConfigured
            ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
            : 'bg-amber-50 text-amber-900 border-b border-amber-200'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>
                {isFirebaseConfigured
                  ? 'Firestore Terhubung (Realtime)'
                  : 'Mode Demo Lokal (Belum Terhubung)'}
              </span>
            </div>
            <button
              onClick={() => setIsConfigDialogOpen(true)}
              className="underline hover:text-stone-900 flex items-center gap-1 text-[10px] md:text-[11px]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Setup .env</span>
            </button>
          </div>
        </div>

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 md:px-8 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base md:text-lg font-bold tracking-tight text-stone-900 leading-none">
                      Dapur Nia
                    </h1>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-300 text-orange-700 bg-orange-50 font-medium">
                      Sesi 3
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">Sistem Katering Cloud Firestore</p>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'menu'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Menu</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'menu' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {menus.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('pelanggan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'pelanggan'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Pelanggan</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'pelanggan' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {customers.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('pesanan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'pesanan'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pesanan</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'pesanan' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('laporan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'laporan'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Laporan</span>
                </button>
              </nav>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-2">
              {activeTab === 'menu' && (
                <Button
                  size="sm"
                  onClick={() => setIsMenuDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm gap-1 text-xs px-3 h-8.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Menu</span>
                </Button>
              )}

              {activeTab === 'pelanggan' && (
                <Button
                  size="sm"
                  onClick={() => setIsCustomerDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm gap-1 text-xs px-3 h-8.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pelanggan</span>
                </Button>
              )}

              {activeTab === 'pesanan' && (
                <Button
                  size="sm"
                  onClick={() => setIsOrderDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm gap-1 text-xs px-3 h-8.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Pesanan</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* ERROR STATE: Banner Pesan Galat Visual (Sesuai PRD Bab 6 & Lembar Praktik 1) */}
        {errorMessage && (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label="Tutup pesan error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-12 space-y-6">
          
          {/* LOADING STATE (Sesuai Ketentuan Praktik 1 & PRD Bab 6) */}
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-stone-700">Sedang memuat data katering Dapur Nia...</p>
              <p className="text-xs text-stone-400">Sinkronisasi data menu, pelanggan, dan pesanan</p>
            </div>
          ) : (
            <>
              {/* TAB 1: MENU */}
              {activeTab === 'menu' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-stone-900">Daftar Menu Harian</h2>
                      <p className="text-xs text-stone-500">Kelola stok, harga, dan ketersediaan katering</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2.5 py-0.5">
                      {menus.length} Item
                    </Badge>
                  </div>

                  {/* EMPTY STATE: Menu (Sesuai Ketentuan Praktik 1) */}
                  {menus.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                      <UtensilsCrossed className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-stone-700">Belum ada menu</p>
                      <p className="text-xs text-stone-500 mt-1">Klik tombol "+ Tambah Menu" untuk mulai menambahkan menu masakan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {menus.map((item) => (
                        <Card key={item.id} className="border-stone-200/80 shadow-xs hover:border-orange-300 hover:shadow-md transition-all rounded-xl bg-white flex flex-col justify-between">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                  {item.kategori || 'Paket Nasi'}
                                </span>
                                <CardTitle className="text-sm font-semibold text-stone-900 mt-1.5 line-clamp-1">
                                  {item.nama}
                                </CardTitle>
                              </div>
                              <span className="text-sm font-bold text-stone-900 whitespace-nowrap">
                                {formatRupiah(item.harga)}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 flex items-center justify-between border-t border-stone-100 mt-3">
                            <div className="flex items-center gap-1.5">
                              {item.sisa_porsi > 0 ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                  Sisa {item.sisa_porsi} porsi
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                                  Habis
                                </Badge>
                              )}
                            </div>
                            {/* Aksi CRUD: Ubah & Hapus */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 rounded-lg border-stone-300 hover:border-orange-500 hover:text-orange-600"
                                onClick={() => {
                                  const newStock = prompt('Masukkan sisa porsi baru:', String(item.sisa_porsi))
                                  if (newStock !== null) {
                                    const num = Number(newStock)
                                    if (num >= 0 && item.id) {
                                      if (isFirebaseConfigured) updateMenuStock(item.id, num)
                                      else setMenus(prev => prev.map(m => m.id === item.id ? { ...m, sisa_porsi: num } : m))
                                    } else {
                                      setErrorMessage('Sisa porsi tidak boleh negatif!')
                                    }
                                  }
                                }}
                                title="Update Stok Cepat"
                              >
                                Stok
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg text-stone-500 hover:text-orange-600 hover:bg-orange-50"
                                onClick={() => handleOpenEditMenu(item)}
                                title="Ubah (Edit) Menu"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => item.id && handleDeleteMenu(item.id, item.nama)}
                                title="Hapus Menu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PELANGGAN */}
              {activeTab === 'pelanggan' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-stone-900">Database Pelanggan</h2>
                      <p className="text-xs text-stone-500">Kontak WhatsApp & Alamat Kirim</p>
                    </div>
                    <Badge variant="secondary" className="text-xs px-2.5 py-0.5">{customers.length} Kontak</Badge>
                  </div>

                  {/* EMPTY STATE: Pelanggan (Sesuai Ketentuan Praktik 1) */}
                  {customers.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                      <Users className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-stone-700">Belum ada data pelanggan</p>
                      <p className="text-xs text-stone-500 mt-1">Klik "+ Tambah Pelanggan" untuk mendaftarkan kontak katering.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {customers.map((c) => (
                        <Card key={c.id} className="border-stone-200 rounded-xl p-4 space-y-3 bg-white shadow-xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-stone-900">{c.nama}</h3>
                              <Badge variant="secondary" className="text-[10px] bg-stone-100 text-stone-600">Pelanggan</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-2">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-mono">{c.whatsapp}</span>
                            </div>
                            <div className="flex items-start gap-1.5 text-xs text-stone-500 mt-1.5">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{c.alamat}</span>
                            </div>
                          </div>
                          {/* Aksi CRUD: Ubah & Hapus Pelanggan */}
                          <div className="pt-2.5 border-t border-stone-100 flex items-center justify-end gap-1 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 rounded-lg text-stone-600 hover:text-orange-600 hover:bg-orange-50"
                              onClick={() => handleOpenEditCustomer(c)}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Ubah</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 rounded-lg text-stone-600 hover:text-red-600 hover:bg-red-50"
                              onClick={() => c.id && handleDeleteCustomer(c.id, c.nama)}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PESANAN */}
              {activeTab === 'pesanan' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-stone-900">Pesanan Aktif</h2>
                      <p className="text-xs text-stone-500">Alur status katering terstruktur (AC 4.3)</p>
                    </div>
                    <Badge variant="secondary" className="text-xs px-2.5 py-0.5">{orders.length} Pesanan</Badge>
                  </div>

                  {/* EMPTY STATE: Pesanan (Sesuai Ketentuan Praktik 1) */}
                  {orders.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                      <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-stone-700">Belum ada pesanan aktif</p>
                      <p className="text-xs text-stone-500 mt-1">Buat pesanan baru dengan memilih pelanggan dan menu.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orders.map((ord) => {
                        const nextAllowed = VALID_STATUS_FLOW[ord.status] || []
                        return (
                          <Card key={ord.id} className="border-stone-200 rounded-xl p-4 space-y-3 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-xs font-bold text-stone-900">
                                    #{ord.id?.slice(-5).toUpperCase() || 'ORD'}
                                  </span>
                                  <h4 className="text-sm font-semibold text-stone-800 mt-0.5">
                                    {ord.customer_name}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-orange-600 block">
                                    {formatRupiah(ord.total_tagihan)}
                                  </span>
                                  <Badge className="text-[10px] py-0.5 mt-1" variant="outline">
                                    {STATUS_LABELS[ord.status]}
                                  </Badge>
                                </div>
                              </div>

                              <div className="p-2.5 bg-stone-50 rounded-lg text-xs space-y-1">
                                <p className="text-stone-700 font-medium">
                                  {ord.items.map((it) => `${it.nama} (${it.jumlah_porsi}x)`).join(', ')}
                                </p>
                                <div className="flex justify-between text-[11px] text-stone-500">
                                  <span>Ongkir:</span>
                                  <span>{formatRupiah(ord.ongkir)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status Transition & Hapus Action Buttons */}
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5 flex-wrap">
                              <div>
                                {(ord.status === 'selesai' || ord.status === 'dibatalkan') && ord.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs px-2 text-stone-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteOrder(ord.id!)}
                                    title="Hapus riwayat pesanan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                                {nextAllowed.map((nextSt) => (
                                  <Button
                                    key={nextSt}
                                    size="sm"
                                    variant={nextSt === 'dibatalkan' ? 'ghost' : 'default'}
                                    className={`h-7 text-xs px-3 rounded-lg ${
                                      nextSt === 'dibatalkan'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                                    }`}
                                    onClick={() => handleTransitionStatus(ord.id!, ord.status, nextSt)}
                                  >
                                    {nextSt === 'dibatalkan' ? (
                                      <span className="flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Batal
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <span>Lanjut: {STATUS_LABELS[nextSt]}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </span>
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LAPORAN */}
              {activeTab === 'laporan' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-stone-900">Laporan Penjualan</h2>
                      <p className="text-xs text-stone-500">Ringkasan porsi dan uang masuk harian (AC 4.4)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600 font-medium">Pilih Tanggal:</span>
                      <Input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-40 h-8 text-xs rounded-lg bg-stone-50"
                      />
                    </div>
                  </div>

                  {/* Cards Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 rounded-xl border-none shadow-md shadow-orange-500/15">
                      <p className="text-xs font-medium text-orange-100">Total Uang Masuk</p>
                      <p className="text-2xl font-extrabold mt-1">{formatRupiah(totalOmzet)}</p>
                      <span className="text-[11px] text-orange-100/80">{validOrdersOnDate.length} transaksi sah</span>
                    </Card>

                    <Card className="bg-white border-stone-200 p-4 rounded-xl shadow-xs">
                      <p className="text-xs font-medium text-stone-500">Total Porsi Terjual</p>
                      <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalPorsi} Porsi</p>
                      <span className="text-[11px] text-stone-400">Status batal diabaikan</span>
                    </Card>

                    <Card className="bg-white border-stone-200 p-4 rounded-xl shadow-xs">
                      <p className="text-xs font-medium text-stone-500">Pesanan Aktif Hari Ini</p>
                      <p className="text-2xl font-extrabold text-stone-900 mt-1">{validOrdersOnDate.length} Pesanan</p>
                      <span className="text-[11px] text-emerald-600 font-medium">Tercatat di sistem</span>
                    </Card>

                    <Card className="bg-white border-stone-200 p-4 rounded-xl shadow-xs">
                      <p className="text-xs font-medium text-stone-500">Katalog Menu & Pelanggan</p>
                      <p className="text-2xl font-extrabold text-stone-900 mt-1">{menus.length} / {customers.length}</p>
                      <span className="text-[11px] text-stone-400">Menu / Pelanggan aktif</span>
                    </Card>
                  </div>

                  {/* Transactions List */}
                  {validOrdersOnDate.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                      <TrendingUp className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-stone-700">Belum ada transaksi pada tanggal ini</p>
                      <p className="text-xs text-stone-400 mt-1">Ubah tanggal atau buat pesanan baru.</p>
                    </div>
                  ) : (
                    <Card className="border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden shadow-xs bg-white">
                      <div className="px-5 py-3.5 bg-stone-50/70 border-b border-stone-100 font-semibold text-xs text-stone-700 flex justify-between">
                        <span>Rincian Transaksi ({validOrdersOnDate.length})</span>
                        <span>Total: {formatRupiah(totalOmzet)}</span>
                      </div>
                      {validOrdersOnDate.map((ord) => (
                        <div key={ord.id} className="p-4 flex items-center justify-between text-xs hover:bg-stone-50/50 transition-colors">
                          <div>
                            <p className="font-semibold text-stone-900 text-sm">{ord.customer_name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {ord.items.map((it) => `${it.nama} (${it.jumlah_porsi} porsi)`).join(', ')}
                            </p>
                          </div>
                          <span className="font-bold text-stone-900 text-sm">{formatRupiah(ord.total_tagihan)}</span>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* DIALOG: TAMBAH MENU */}
        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <form onSubmit={handleSaveMenu}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-stone-900">
                  <Plus className="w-5 h-5 text-orange-600" />
                  Tambah Menu Katering
                </DialogTitle>
                <DialogDescription className="text-stone-500 text-xs">
                  Tambahkan menu masakan baru beserta harga dan stok porsi.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nama Menu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Paket Ayam Geprek Keju"
                    value={menuForm.nama}
                    onChange={(e) => setMenuForm({ ...menuForm, nama: e.target.value })}
                    required
                    className="rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Kategori Menu
                  </label>
                  <select
                    className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    value={menuForm.kategori}
                    onChange={(e) => setMenuForm({ ...menuForm, kategori: e.target.value })}
                  >
                    <option value="Paket Nasi">Paket Nasi</option>
                    <option value="Tradisional">Tradisional</option>
                    <option value="Lauk Utama">Lauk Utama</option>
                    <option value="Sayur & Sup">Sayur &amp; Sup</option>
                    <option value="Snack & Minuman">Snack &amp; Minuman</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Harga Satuan (Rp) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="25000"
                      min="1"
                      value={menuForm.harga}
                      onChange={(e) => setMenuForm({ ...menuForm, harga: e.target.value })}
                      required
                      className="rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Sisa Porsi (Stok) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="15"
                      min="0"
                      value={menuForm.porsi}
                      onChange={(e) => setMenuForm({ ...menuForm, porsi: e.target.value })}
                      required
                      className="rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Simpan Menu
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: TAMBAH PELANGGAN */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <form onSubmit={handleSaveCustomer}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-stone-900">
                  <Plus className="w-5 h-5 text-orange-600" />
                  Tambah Pelanggan Baru
                </DialogTitle>
                <DialogDescription className="text-stone-500 text-xs">
                  Semua field wajib diisi untuk kelancaran pengiriman katering.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Ibu Dina Mariana"
                    value={customerForm.nama}
                    onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
                    required
                    className="rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: 08123456789"
                    value={customerForm.whatsapp}
                    onChange={(e) => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                    required
                    className="rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Alamat Pengiriman <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Jl. Mawar No. 12, RT 02/05, Kebayoran"
                    value={customerForm.alamat}
                    onChange={(e) => setCustomerForm({ ...customerForm, alamat: e.target.value })}
                    required
                    className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Simpan Pelanggan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: BUAT PESANAN */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-[390px] rounded-2xl">
            <form onSubmit={handleSaveOrder}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-stone-900">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  Buat Pesanan Katering
                </DialogTitle>
                <DialogDescription className="text-stone-500 text-xs">
                  Stok menu akan otomatis berkurang secara atomik saat pesanan dibuat.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Pilih Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-white"
                    value={orderForm.customerId}
                    onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} ({c.whatsapp})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Pilih Menu Masakan <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-white"
                    value={orderForm.menuId}
                    onChange={(e) => setOrderForm({ ...orderForm, menuId: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Menu --</option>
                    {menus.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.sisa_porsi === 0}>
                        {m.nama} - {formatRupiah(m.harga)} (Sisa: {m.sisa_porsi})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Jumlah Porsi <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={orderForm.porsi}
                      onChange={(e) => setOrderForm({ ...orderForm, porsi: e.target.value })}
                      required
                      className="rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Ongkir (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={orderForm.ongkir}
                      onChange={(e) => setOrderForm({ ...orderForm, ongkir: e.target.value })}
                      className="rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Buat Pesanan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: UBAH MENU */}
        <Dialog open={isEditMenuOpen} onOpenChange={setIsEditMenuOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <form onSubmit={handleSaveEditMenu}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-stone-900">
                  <Edit2 className="w-5 h-5 text-orange-600" />
                  Ubah Menu Katering
                </DialogTitle>
                <DialogDescription className="text-stone-500 text-xs">
                  Perbarui nama, harga, atau stok menu masakan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nama Menu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editMenuForm.nama}
                    onChange={(e) => setEditMenuForm({ ...editMenuForm, nama: e.target.value })}
                    required
                    className="rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Kategori Menu
                  </label>
                  <select
                    className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-white"
                    value={editMenuForm.kategori}
                    onChange={(e) => setEditMenuForm({ ...editMenuForm, kategori: e.target.value })}
                  >
                    <option value="Paket Nasi">Paket Nasi</option>
                    <option value="Tradisional">Tradisional</option>
                    <option value="Lauk Utama">Lauk Utama</option>
                    <option value="Sayur & Sup">Sayur &amp; Sup</option>
                    <option value="Snack & Minuman">Snack &amp; Minuman</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Harga Satuan (Rp) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={editMenuForm.harga}
                      onChange={(e) => setEditMenuForm({ ...editMenuForm, harga: e.target.value })}
                      required
                      className="rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Sisa Porsi (Stok) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={editMenuForm.porsi}
                      onChange={(e) => setEditMenuForm({ ...editMenuForm, porsi: e.target.value })}
                      required
                      className="rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditMenuOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: UBAH PELANGGAN */}
        <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <form onSubmit={handleSaveEditCustomer}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-stone-900">
                  <Edit2 className="w-5 h-5 text-orange-600" />
                  Ubah Data Pelanggan
                </DialogTitle>
                <DialogDescription className="text-stone-500 text-xs">
                  Perbarui informasi kontak dan alamat pengiriman katering.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editCustomerForm.nama}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, nama: e.target.value })}
                    required
                    className="rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editCustomerForm.whatsapp}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, whatsapp: e.target.value })}
                    required
                    className="rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Alamat Pengiriman <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editCustomerForm.alamat}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, alamat: e.target.value })}
                    required
                    className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditCustomerOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: PETUNJUK SETUP FIREBASE */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-stone-900">
                <Database className="w-5 h-5 text-amber-600" />
                Koneksi Firebase Firestore
              </DialogTitle>
              <DialogDescription className="text-stone-500 text-xs">
                Hubungkan project ini ke Cloud Firestore milikmu.
              </DialogDescription>
            </DialogHeader>

            <div className="text-xs text-stone-600 space-y-2 py-2">
              <p>Untuk mengaktifkan Firestore secara live:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-stone-700">
                <li>Buka file <code className="bg-stone-100 px-1 py-0.5 rounded text-orange-600 font-mono">.env.local</code> di root folder proyek ini.</li>
                <li>Salin konfigurasi Web App dari <strong>Firebase Console &gt; Project Settings</strong>:</li>
              </ol>
              <div className="bg-stone-900 text-stone-100 p-2.5 rounded-lg font-mono text-[10px] space-y-1">
                <div>VITE_FIREBASE_API_KEY=AIzaSy...</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=dapur-nia.firebaseapp.com</div>
                <div>VITE_FIREBASE_PROJECT_ID=dapur-nia-xyz</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET=dapur-nia.appspot.com</div>
                <div>VITE_FIREBASE_MESSAGING_SENDER_ID=123456789</div>
                <div>VITE_FIREBASE_APP_ID=1:123456789:web:abcdef</div>
              </div>
              <p className="text-[11px] text-stone-500">
                Setelah file disimpan, aplikasi akan otomatis memuat ulang dan langsung terhubung secara live ke Firestore!
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => setIsConfigDialogOpen(false)} className="bg-orange-600 text-white">
                Saya Mengerti
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="fixed bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 flex items-center justify-around shadow-lg md:hidden">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'menu' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px]">Menu</span>
          </button>

          <button
            onClick={() => setActiveTab('pelanggan')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'pelanggan' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Pelanggan</span>
          </button>

          <button
            onClick={() => setActiveTab('pesanan')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'pesanan' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">Pesanan</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'laporan' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px]">Laporan</span>
          </button>
        </nav>

      </div>
    </div>
  )
}
