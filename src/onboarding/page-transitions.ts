import { type Variants } from "motion/react"

export type Direction = 1 | -1

export const pageTransitionVariants: Variants = {
  initial: (direction: Direction = 1) => ({
    opacity: 0,
    x: direction * 40,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.15, 1] },
  },
  exit: (direction: Direction = 1) => ({
    opacity: 0,
    x: direction * -40,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
}
