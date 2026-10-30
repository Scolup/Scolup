// Quest system types
export type QuestPeriod = "once" | "daily" | "weekly"

export type QuestEvent =
  | "app-open"
  | "setting-changed"
  | "homework-done"
  | "homework-early"
  | "homework-ontime"
  | "homework-late"
  | "test-prepared"
  | "grade-received"
  | "average-up"
  | "week-complete"
  | "week-streak"
  | "purchase"

// Details of an event, so a quest can look only at what matters to it.
export interface QuestPayload {
  subject?: string // subject id (see subjectId)
  ratio?: number // grade / scale, 0..1
  improved?: boolean // strictly better than the previous grade in that subject
  aboveAvg?: number // ratio minus the student's average in that subject so far
  delta?: number // ratio minus the previous grade's ratio in that subject
  streak?: number // consecutive complete weeks, this one included
  due?: string // due day key of a homework
}

// A quest only counts events matching ALL of these (plain data: it is saved).
export interface QuestMatch {
  subject?: string
  minRatio?: number
  improved?: boolean
  minAboveAvg?: number
  minDelta?: number
  minStreak?: number
}

export interface QuestDef {
  id: string // never change an id once shipped: progress is stored by id
  title: string
  description: string
  reward: number
  event: QuestEvent // the event that makes this quest progress
  goal?: number // how many times (default 1)
  period?: QuestPeriod // when progress resets (default "once" = never)
  income?: boolean // pays `reward` for every distinct key, never completes
  match?: QuestMatch
  unique?: boolean // count each track(event, key) key once (e.g. a homework id)
  grades?: boolean // about grades: hidden when the student turns them off
  secret?: boolean // shown as "???" until achieved
  silent?: boolean // no toast when achieved
}

export type QuestState = "secret" | "unachieved" | "achieved"

export interface QuestProgress {
  count: number
  period: string // key of the period this count belongs to
  seen?: string[] // keys already counted (unique / income quests)
  done: boolean
}

export type ProgressMap = Record<string, QuestProgress>

export interface QuestToast {
  quests: QuestDef[]
  text?: string
}
