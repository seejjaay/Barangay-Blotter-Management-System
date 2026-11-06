"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Shield, Eye, EyeOff, Lock, Mail, User, ChevronRight, UserPlus, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { signUp } from "@/lib/auth-actions"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isValid =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 6 &&
    password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp({ fullName, email, password })
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #00174A 0%, #002576 45%, #00308F 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,0.1) 48px, rgba(255,255,255,0.1) 49px), repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.1) 48px, rgba(255,255,255,0.1) 49px)",
          }}
        />
        <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full opacity-[0.03] bg-white" />
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-[0.02] bg-white" />

        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 rounded-full bg-[#feb71a]" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#feb71a]">
              Republic of the Philippines
            </span>
          </div>

          <div className="flex flex-col items-center text-center gap-7">
            <div
              className="relative w-36 h-36 rounded-full flex items-center justify-center p-2"
              style={{
                background: "linear-gradient(135deg, #feb71a 0%, #d49a15 100%)",
                boxShadow: "0 0 0 6px rgba(254, 183, 26, 0.18), 0 20px 48px rgba(0, 37, 118, 0.5)",
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white">
                <Image
                  src="/brgy-seal.jpg"
                  alt="Official seal of Barangay Banay-Banay 2nd"
                  width={126}
                  height={126}
                  className="w-full h-full object-cover p-1 rounded-full"
                  priority
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#feb71a]/80">
                Brgy. Banay-Banay 2nd &bull; San Jose
              </p>
              <h1 className="text-3xl font-bold leading-tight text-white text-balance">
                Barangay Blotter<br />Management System
              </h1>
              <p className="text-sm leading-relaxed mt-1 text-white/70">
                Centralized digital platform for incident recording,<br />case tracking, and community safety analytics.
              </p>
            </div>

            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{ background: "rgba(254, 183, 26, 0.1)", border: "1px solid rgba(254, 183, 26, 0.3)" }}
            >
              <Shield className="w-3.5 h-3.5 text-[#feb71a]" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[#feb71a]">
                Authorized Personnel Only
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50">
            <span>BBMS v2.1.0</span>
            <span>© 2025 Brgy. Banay-Banay 2nd</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative bg-[#f4f6f8]">
        <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md bg-white p-1">
            <Image
              src="/brgy-seal.jpg"
              alt="Seal"
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <p className="text-sm font-semibold text-foreground text-center text-balance">
            Barangay Blotter Management System
          </p>
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white shadow-ambient border-none overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#002576] to-[#00308F]" />

          <div className="px-8 py-8 space-y-6">
            {success ? (
              <div className="flex flex-col items-center text-center gap-5 py-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    Account Created!
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your account has been successfully created.
                    <br />
                    You can now sign in with your credentials.
                  </p>
                </div>
                <Link href="/login" className="w-full">
                  <Button className="w-full h-11 font-bold text-[11px] uppercase tracking-widest bg-[#feb71a] text-[#002576] hover:bg-[#e0a012]">
                    <span className="flex items-center gap-1.5">
                      Go to Login
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </span>
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#002576]/10 text-[#002576]">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#002576]">
                      Account Registration
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    Create your account
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Register to access the Blotter Management System.
                  </p>
                </div>

                <Separator className="bg-border/50" />

                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 bg-red-50 border border-red-100/50">
                    <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-600" />
                    <p className="text-xs leading-relaxed text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-xs font-bold text-[#44474e] uppercase tracking-wider">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="e.g. Juan Dela Cruz"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-11 bg-[#f7f9fb] border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#002576]"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs font-bold text-[#44474e] uppercase tracking-wider">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-[#f7f9fb] border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#002576]"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#44474e] uppercase tracking-wider">
                        System Role
                      </Label>
                      <div className="h-11 px-3 flex items-center rounded-md bg-[#f7f9fb] text-sm text-foreground">
                        Brgy. Captain
                        <span className="ml-2 text-xs text-muted-foreground">(first account only)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs font-bold text-[#44474e] uppercase tracking-wider">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-11 h-11 bg-[#f7f9fb] border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#002576]"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-[#002576]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs font-bold text-[#44474e] uppercase tracking-wider">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          "pl-10 pr-11 h-11 bg-[#f7f9fb] border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#002576]",
                          confirmPassword && password !== confirmPassword ? "ring-2 ring-red-500" : ""
                        )}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-[#002576]"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600">Passwords do not match.</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className="w-full h-11 font-bold text-[11px] uppercase tracking-widest bg-[#feb71a] text-[#002576] hover:bg-[#e0a012] shadow-sm"
                  >
                    {isLoading ? "Creating Account..." : (
                      <span className="flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4" />
                        Create Account
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 bg-[#002576]/5 border border-[#002576]/10">
                  <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#002576]" />
                  <p className="text-[10px] leading-relaxed text-[#002576]/80 font-medium">
                    This system is restricted to authorized Barangay personnel only. Unauthorized access attempts are logged and monitored.
                  </p>
                </div>

                <Separator className="bg-border/50" />

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold underline underline-offset-4 text-[#002576]">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="mt-8 text-[10px] text-center text-muted-foreground max-w-sm px-6">
          All sessions are encrypted and activity is logged in accordance with the Data Privacy Act of 2012 (R.A. 10173).
        </p>
      </div>
    </div>
  )
}
