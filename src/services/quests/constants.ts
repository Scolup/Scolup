// Keys of the "quests" IndexedDB store (all values are JSON strings).
export const PROGRESS_KEY = "progress"
export const LEGACY_REWARDED_KEY = "rewarded" // old format, only read for migration
export const LEDGER_KEY = "ledger" // homework the student has been given
export const SEEN_GRADES_KEY = "seen-grades" // grades already known

// The live grade streak is an entry of the progress map (not a store key), so
// the quest screens read it together with the rest of the progress.
export const GRADE_STREAK_ID = "grade-streak"

// ponytail: the weekly contract was removed; these keys are deleted once per
// session so nothing stale stays on the device. Remove after a few releases.
export const LEGACY_CONTRACT_KEYS = ["contract", "weakest"]

export const HIDE_GRADE_QUESTS = "hideGradeQuests" // setting
