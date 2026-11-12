// Animations partagées de l'app : un seul easing, deux ressorts, des variants prêts à l'emploi. Toute
// nouvelle animation passe par ici plutôt que de recopier des tableaux
// d'easing.
// `motion-reduce` est géré globalement par le MotionConfig de main.tsx.
export const EASE_OUT = [0.25, 0.1, 0.15, 1] as const

// Un ressort plus doux pour les éléments qui se déplacent (pastilles
// glissantes), à côté du SPRING_POP qui sert aux petits « pops ».
export const SPRING_SOFT = {
  type: "spring",
  stiffness: 500,
  damping: 35,
} as const

// Au-delà de ce rang, un élément de liste n'est plus animé : il est
// presque toujours hors écran, et animer cinquante nœuds d'un coup est ce qui
// fait ramer l'ouverture d'une page.
const ENTRANCE_CAP = 6

// Rang d'entrée d'un élément (0..ENTRANCE_CAP), ou null s'il ne doit pas
// s'animer. À brancher sur la variable CSS --i de la classe `rise`.
export function entranceRank(index: number): number | null {
  return index < ENTRANCE_CAP ? index : null
}

export const SPRING_POP = {
  type: "spring",
  stiffness: 500,
  damping: 25,
} as const

export const staggerContainer = (stagger = 0.06, delay = 0.1) =>
  ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  }) as const

export const fadeUp = (y = 16, duration = 0.35) =>
  ({
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: EASE_OUT },
    },
  }) as const
