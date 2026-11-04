import { describe, expect, test } from "bun:test"
import { createPinHash, isPinFormat, matchesPin } from "@/lib/pin"

describe("pin", () => {
  test("accepts only six digits", () => {
    expect(isPinFormat("123456")).toBe(true)
    expect(isPinFormat("12345")).toBe(false)
    expect(isPinFormat("1234567")).toBe(false)
    expect(isPinFormat("12a456")).toBe(false)
  })

  test("matches the PIN that created the hash", async () => {
    const stored = await createPinHash("123456")
    expect(await matchesPin("123456", stored)).toBe(true)
    expect(await matchesPin("654321", stored)).toBe(false)
  })

  test("stores a salt and never the PIN in clear", async () => {
    const stored = await createPinHash("123456")
    expect(stored.salt).not.toBe("")
    expect(stored.hash).not.toBe("123456")
    expect(stored.hash).not.toContain("123456")
  })
})
