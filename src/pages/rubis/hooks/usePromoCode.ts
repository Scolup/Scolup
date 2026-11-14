import { useState } from "react"
import { celebrate } from "@/lib/celebrate"
import { useAsync } from "@/hooks/useAsync"
import { triggerHapticNope, triggerHapticReward } from "@/services/haptics"
import { loadVault, redeemCode, type RedeemResult } from "@/features/shop/shop"
import { EMPTY_VAULT } from "@/features/shop/vault"
import {
  emptyFieldLine,
  errorLine,
  greeting,
  hintMood,
  nearLine,
  thinkingLine,
  usedLine,
  winLine,
  wrongLine,
  type JoseMood,
} from "@/features/shop/vaultLines"

// How long José "listens" before answering: the suspense is the point.
const LISTEN_MS = 900

export interface JoseSpeech {
  text: string
  mood: JoseMood
  tick: number // grows with every line, so a repeated mood replays its animation
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

// State of the vault sheet: the field, José's last line, and the reward once a
// code is found. Touching José with a code validates it; with an empty field he
// whispers a hint instead.
export function usePromoCode() {
  const [code, setCodeState] = useState("")
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [hintCount, setHintCount] = useState(0)
  const [reload, setReload] = useState(0)
  const [speech, setSpeech] = useState<JoseSpeech>(() => ({
    text: greeting(),
    mood: "idle",
    tick: 0,
  }))
  const vault = useAsync(loadVault, [reload]).data ?? EMPTY_VAULT

  const say = (text: string, mood: JoseMood) =>
    setSpeech((previous) => ({ text, mood, tick: previous.tick + 1 }))

  // Typing calms José down; the line stays so the answer can be reread.
  const setCode = (value: string) => {
    setCodeState(value)
    setResult(null)
    setSpeech((previous) =>
      previous.mood === "thinking" ? previous : { ...previous, mood: "idle" }
    )
  }

  const whisperHint = () => {
    const line = emptyFieldLine(vault, hintCount, speech.text)
    setHintCount((count) => count + 1)
    say(line, hintMood(speech.mood))
  }

  const answer = (next: RedeemResult) => {
    if (next.status === "ok") {
      setResult(next)
      setReload((count) => count + 1)
      say(next.message ?? winLine(speech.text), "happy")
      triggerHapticReward()
      celebrate()
      return
    }
    if (next.status === "used") {
      say(usedLine(speech.text), "nope")
      return
    }
    if (next.status === "error") {
      say(errorLine(speech.text), "nope")
      return
    }
    say(
      next.near ? nearLine(speech.text) : wrongLine(speech.text),
      next.near ? "near" : "nope"
    )
    setShaking(true)
    triggerHapticNope()
  }

  const touchJose = async () => {
    if (busy) return
    if (!code.trim()) {
      whisperHint()
      return
    }
    setBusy(true)
    say(thinkingLine(speech.text), "thinking")
    const [next] = await Promise.all([redeemCode(code), wait(LISTEN_MS)])
    setBusy(false)
    answer(next)
  }

  const reset = () => {
    setCodeState("")
    setResult(null)
    setShaking(false)
    setHintCount(0)
    setReload((count) => count + 1)
    setSpeech({ text: greeting(), mood: "idle", tick: 0 })
  }

  return {
    code,
    setCode,
    result,
    busy,
    shaking,
    endShake: () => setShaking(false),
    speech,
    vault,
    touchJose,
    reset,
  }
}
