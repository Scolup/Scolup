// Keys of the "quests" IndexedDB store (all values are JSON strings).
export const PROGRESS_KEY = "progress"
export const LEGACY_REWARDED_KEY = "rewarded" // old format, only read for migration
export const CONTRACT_KEY = "contract" // this week's personalised quests
export const LEDGER_KEY = "ledger" // homework the student has been given
export const SEEN_GRADES_KEY = "seen-grades" // grades already known
export const WEAKEST_KEY = "weakest" // most fragile subject, for the weekly challenge

export const HIDE_GRADE_QUESTS = "hideGradeQuests" // setting
