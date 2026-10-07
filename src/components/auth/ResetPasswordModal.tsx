import { useState } from 'react'
import { KeyRound, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resetPassword, getIndonesianAuthErrorMessage } from '@/services/authService'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  defaultEmail?: string
}

export function ResetPasswordModal({ isOpen, onClose, defaultEmail = '' }: ResetPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMessage('Masukkan alamat email terdaftar.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await resetPassword(email)
      // Sesuai Bab 5.2 Modul: "Bila email terdaftar, tautan atur ulang sudah dikirim."
      setSuccessMessage('Bila email terdaftar, tautan atur ulang sudah dikirim ke kotak masuk email Anda.')
    } catch (err) {
      setErrorMessage(getIndonesianAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSuccessMessage(null)
      setErrorMessage(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-stone-900">
            Lupa Kata Sandi?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-stone-500">
            Masukkan email akun Dapur Nia Anda untuk menerima tautan pembuatan kata sandi baru.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                Tutup
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                Alamat Email Akun
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nia@dapurnia.id"
                  required
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Tautan Atur Ulang'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
