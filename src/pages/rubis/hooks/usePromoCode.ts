import { useState } from "react"
import { celebrate } from "@/lib/celebrate"
import { triggerHapticLight } from "@/services/haptics"
import { redeemCode, type RedeemResult } from "@/features/shop/shop"

// State of the "un code" sheet: the field, the verdict, and the busy flag.
// Typing again clears the previous verdict so the user can retry.
export function usePromoCode() {
  const [code, setCodeState] = useState("")
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [busy, setBusy] = useState(false)

  const setCode = (value: string) => {
    setCodeState(value)
    setResult(null)
  }

  const submit = async () => {
    if (!code.trim() || busy) return
    setBusy(true)
    const next = await redeemCode(code)
    setBusy(false)
    setResult(next)
    if (next.status === "ok") {
      triggerHapticLight()
      celebrate()
    }
  }

  const reset = () => {
    setCodeState("")
    setResult(null)
  }

  return { code, setCode, result, busy, submit, reset }
}
