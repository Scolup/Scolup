import type { Lesson, Level } from "./curriculum"

export interface LearnUnit {
  id: string
  checkpoints: { id: string; lesson: Lesson }[]
  chestId?: string
}

export function buildPath(
  level: Level,
  lessons: readonly Lesson[]
): LearnUnit[] {
  return Array.from({ length: Math.ceil(lessons.length / 3) }, (_, index) => {
    const checkpoints = lessons
      .slice(index * 3, index * 3 + 3)
      .map((lesson) => ({
        id: `${level}-${lesson.id}`,
        lesson,
      }))
    const id = checkpoints[checkpoints.length - 1].id
    return {
      id,
      checkpoints,
      chestId: checkpoints.length === 3 ? `chest-${id}` : undefined,
    }
  })
}
