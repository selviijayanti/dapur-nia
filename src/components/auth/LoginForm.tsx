import { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { loginWithEmail, getIndonesianAuthErrorMessage } from '@/services/authService'
import { ResetPasswordModal } from './ResetPasswordModal'

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
  onBackToGuestMenu: () => void
  redirectMessage?: string | null
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onBackToGuestMenu,
  redirectMessage,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isResetOpen, setIsResetOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMessage('Harap isi email dan kata sandi.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await loginWithEmail(email, password)
      onSuccess()
    } catch (err) {
      setErrorMessage(getIndonesianAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Kartu Formulir Masuk */}
      <Card className="border-stone-200 shadow-lg rounded-2xl bg-white overflow-hidden">
        {/* Header Visual ala PDF Sesi 4 */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-xs rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Masuk ke Dapur Nia</h2>
          <p className="text-xs text-orange-100 mt-1">
            Silakan masuk untuk mengelola menu, pesanan, dan laporan katering
          </p>
        </div>

        <CardHeader className="pt-4 pb-2 text-center">
          {redirectMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 mb-2 text-left">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Email Pengelola
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nia@dapurnia.id"
                  required
                  autoComplete="email"
                  className="pl-9 rounded-xl text-xs h-10 border-stone-300 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 block">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pl-9 pr-10 rounded-xl text-xs h-10 border-stone-300 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Masuk */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold h-10 rounded-xl shadow-md shadow-orange-500/20 transition-all mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Memeriksa...
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            {/* Tautan ke Pendaftaran */}
            <div className="pt-3 text-center border-t border-stone-100">
              <p className="text-xs text-stone-600">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Daftar di sini
                </button>
              </p>
            </div>

            {/* Navigasi Kembali ke Daftar Menu */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onBackToGuestMenu}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Lihat Menu Masakan (Sebagai Tamu)</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal Lupa Kata Sandi */}
      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        defaultEmail={email}
      />
    </div>
  )
}
