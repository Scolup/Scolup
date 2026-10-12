// Grammaire motion partagée de l'app (façon Papillon `ui/utils/Animation`) :
// un seul easing, deux ressorts, des variants prêts à l'emploi. Toute
// nouvelle animation passe par ici plutôt que de recopier des tableaux
// d'easing.
// `motion-reduce` est géré globalement par le MotionConfig de main.tsx.
export const EASE_OUT = [0.25, 0.1, 0.15, 1] as const

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const

export const SPRING_POP = {
  type: "spring",
  stiffness: 500,
  damping: 25,
} as const

export const staggerContainer = (stagger = 0.08, delay = 0.15) =>
  ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  }) as const

export const fadeUp = (y = 16, duration = 0.5) =>
  ({
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: EASE_OUT },
    },
  }) as const

// Entrée avec un petit rebond : belles notes, checks, badges.
export const popIn = (delay = 0) =>
  ({
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { ...SPRING_POP, delay },
    },
  }) as const
