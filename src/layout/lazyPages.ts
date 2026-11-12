import { lazyPage } from "@/lib/lazyPage"

// Un écran n'est téléchargé qu'au moment où on l'ouvre. Pour qu'il s'affiche
// vite, MainLayout précharge tous ces écrans une seconde après le démarrage.
export const pageLoaders = {
  messages: () => import("@/pages/messages/Messages"),
  agenda: () => import("@/pages/agenda/Agenda"),
  homework: () => import("@/pages/homework/Homework"),
  grades: () => import("@/pages/grades/Grades"),
  learn: () => import("@/pages/learn/Learn"),
  absences: () => import("@/pages/absences/Absences"),
  postits: () => import("@/pages/postits/PostIts"),
  settings: () => import("@/pages/settings/SettingsDialog"),
  rubis: () => import("@/pages/rubis/RubiesPage"),
}

export const Messages = lazyPage(pageLoaders.messages, "Messages")
export const Agenda = lazyPage(pageLoaders.agenda, "Agenda")
export const Homework = lazyPage(pageLoaders.homework, "Homework")
export const Grades = lazyPage(pageLoaders.grades, "Grades")
export const Learn = lazyPage(pageLoaders.learn, "Learn")
export const Absences = lazyPage(pageLoaders.absences, "Absences")
export const PostIts = lazyPage(pageLoaders.postits, "PostIts")
export const SettingsDialog = lazyPage(pageLoaders.settings, "SettingsDialog")
export const RubiesPage = lazyPage(pageLoaders.rubis, "RubiesPage")
