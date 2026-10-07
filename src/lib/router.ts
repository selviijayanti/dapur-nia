export type AppRoute =
  | 'daftar-menu'
  | 'kelola-menu'
  | 'pelanggan'
  | 'pesanan'
  | 'laporan'
  | 'masuk'
  | 'daftar'

export function pathToRoute(path: string): AppRoute {
  // Ambil pathname tanpa trailing slash
  const cleanPath = path.toLowerCase().replace(/\/$/, '')
  if (cleanPath === '/masuk' || cleanPath === '/login') return 'masuk'
  if (cleanPath === '/daftar' || cleanPath === '/register') return 'daftar'
  if (cleanPath === '/kelola-menu') return 'kelola-menu'
  if (cleanPath === '/pelanggan') return 'pelanggan'
  if (cleanPath === '/pesanan') return 'pesanan'
  if (cleanPath === '/laporan') return 'laporan'
  return 'daftar-menu' // Beranda / Daftar Menu publik
}

export function routeToPath(route: AppRoute): string {
  switch (route) {
    case 'masuk':
      return '/masuk'
    case 'daftar':
      return '/daftar'
    case 'kelola-menu':
      return '/kelola-menu'
    case 'pelanggan':
      return '/pelanggan'
    case 'pesanan':
      return '/pesanan'
    case 'laporan':
      return '/laporan'
    case 'daftar-menu':
    default:
      return '/'
  }
}
