import { useState, type ReactNode } from "react"
import { AnimatePresence, m, type Variants } from "motion/react"
import { Restaurant01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Meal, Menu } from "@blockshub/pawnote-lts"
import { EmptyState } from "@/components/EmptyState"
import { InlineError } from "@/components/InlineError"
import { SchoolPage } from "@/components/SchoolPage"
import { DateNavigator } from "@/components/DateNavigator"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAsync } from "@/hooks/useAsync"
import { addDays, dayName, toDayKey, weekOf } from "@/lib/dates"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { triggerHapticLight } from "@/services/haptics"
import { withPronoteSession } from "@/services/litenote"

const dateLabel = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
})
const weekTransition: Variants = {
  start: (direction: number) => ({ opacity: 0, x: direction * 20 }),
  visible: { opacity: 1, x: 0 },
  end: (direction: number) => ({ opacity: 0, x: direction * -20 }),
}
const COURSES = [
  ["entry", "Entrée"],
  ["main", "Plat"],
  ["side", "Garniture"],
  ["fromage", "Fromage"],
  ["dessert", "Dessert"],
  ["drink", "Boisson"],
] as const
const MEALS = [
  ["lunch", "Déjeuner"],
  ["dinner", "Dîner"],
] as const

interface MenuColumn {
  date: Date
  key: string
  menu?: Menu
}

function mealTitle(meal: Meal | undefined, label: string) {
  const title = meal?.name?.trim()
  return title?.toLowerCase() === label.toLowerCase() ? undefined : title
}

function hasPublishedMeal(meal: Meal | undefined, label: string): boolean {
  return Boolean(
    meal &&
    (mealTitle(meal, label) ||
      COURSES.some(([key]) => meal[key]?.some((food) => food.name?.trim())))
  )
}

function hasPublishedMenu(menu: Menu | undefined): boolean {
  return MEALS.some(([key, label]) => hasPublishedMeal(menu?.[key], label))
}

async function fetchMenus(dates: Date[]) {
  const { AccessDeniedError, menus, TabLocation } =
    await import("@blockshub/pawnote-lts")
  const first = dates[0]
  const last = toDayKey(dates[dates.length - 1])
  const start = toDayKey(first)
  return withPronoteSession(async (session) => {
    // The resource tab map only contains tabs with school periods.
    if (!session.user.authorizations.tabs.includes(TabLocation.Menus))
      return null
    try {
      const result = await menus(session, first)
      if (
        !result.days.some((menu) => {
          const key = toDayKey(menu.date)
          return key >= start && key <= last && hasPublishedMenu(menu)
        })
      ) {
        // PRONOTE can open another published week when the selected day has no menu.
        return (await menus(session, addDays(first, 3))).days
      }
      return result.days
    } catch (error) {
      if (error instanceof AccessDeniedError) return null
      throw error
    }
  })
}

function MenuTable({ columns }: { columns: MenuColumn[] }) {
  const todayKey = toDayKey(new Date())
  const emptyDays = columns.map(({ menu }) => !hasPublishedMenu(menu))
  const publishedMeals = MEALS.filter(([key, label]) =>
    columns.some(({ menu }) => hasPublishedMeal(menu?.[key], label))
  )
  return (
    <div
      role="region"
      aria-label="Menus par jour et par catégorie"
      tabIndex={0}
      className="min-h-0 w-full flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <table
        className="h-full w-full table-fixed border-separate border-spacing-0 text-sm"
        style={
          columns.length > 1
            ? { minWidth: `${7 + columns.length * 9}rem` }
            : undefined
        }
      >
        <colgroup>
          <col className="w-28" />
          {columns.map(({ key }) => (
            <col key={key} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 left-0 z-30 h-20 border-b-2 border-border bg-muted px-4 py-3 text-left align-middle text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Catégorie
            </th>
            {columns.map(({ date, key }) => (
              <th
                key={key}
                scope="col"
                className={cn(
                  "sticky top-0 z-20 h-20 border-s border-b-2 border-border/70 bg-muted px-4 py-3 text-left align-middle",
                  key === todayKey && "border-b-primary"
                )}
              >
                <time
                  dateTime={key}
                  aria-current={key === todayKey ? "date" : undefined}
                  className="flex flex-col gap-1"
                >
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {dayName(date)}
                  </span>
                  <span
                    className={cn(
                      "text-base font-semibold text-foreground",
                      key === todayKey && "text-primary-text"
                    )}
                  >
                    {dateLabel.format(date)}
                  </span>
                </time>
              </th>
            ))}
          </tr>
        </thead>
        {publishedMeals.map(([mealKey, mealLabel], mealIndex) => {
          const titles = columns.map(({ menu }) =>
            mealTitle(menu?.[mealKey], mealLabel)
          )
          const showTitle = mealKey === "dinner" || titles.some(Boolean)
          const courses = COURSES.flatMap(([key, label]) => {
            const foodsByDay = columns.map(
              ({ menu }) =>
                menu?.[mealKey]?.[key]?.filter((food) => food.name?.trim()) ??
                []
            )
            return foodsByDay.some((foods) => foods.length)
              ? [{ key, label, foodsByDay }]
              : []
          })
          const rowCount = courses.length + Number(showTitle)
          function cells(
            firstRow: boolean,
            render: (key: string, index: number) => ReactNode
          ) {
            return columns.map(({ key }, index) => {
              if (!emptyDays[index]) return render(key, index)
              if (!firstRow) return null
              return (
                <td
                  key={key}
                  rowSpan={rowCount}
                  className="border-s border-border/60 px-4 py-3 text-center align-middle text-sm"
                >
                  {mealIndex === 0 && (
                    <span className="flex flex-col items-center gap-2 font-bold text-foreground">
                      <HugeiconsIcon
                        icon={Restaurant01Icon}
                        className="size-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      C'est le néant
                    </span>
                  )}
                </td>
              )
            })
          }
          return (
            <tbody key={mealKey} aria-label={mealLabel}>
              {showTitle && (
                <tr>
                  <th
                    scope="rowgroup"
                    className="sticky left-0 z-10 h-8 border-b border-border/60 bg-muted px-4 py-2 text-left text-xs font-semibold"
                  >
                    {mealKey === "dinner" ? (
                      mealLabel
                    ) : (
                      <span className="sr-only">{mealLabel}</span>
                    )}
                  </th>
                  {cells(true, (key, index) => (
                    <td
                      key={key}
                      className="border-s border-b border-border/60 bg-muted px-4 py-2 text-xs text-muted-foreground"
                    >
                      {titles[index]}
                    </td>
                  ))}
                </tr>
              )}
              {courses.map(
                ({ key: courseKey, label, foodsByDay }, courseIndex) => (
                  <tr key={courseKey}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-b border-border/60 bg-background px-4 py-3 text-left align-top font-medium text-muted-foreground"
                    >
                      {label}
                    </th>
                    {cells(!showTitle && courseIndex === 0, (key, index) => (
                      <td
                        key={key}
                        className="border-s border-b border-border/60 px-4 py-3 align-top wrap-break-word"
                      >
                        {foodsByDay[index].length > 0 && (
                          <ul className="space-y-1.5">
                            {foodsByDay[index].map((food, position) => (
                              <li key={`${position}-${food.name}`}>
                                {food.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}

function MenuPeriod({
  dates,
  onRefresh,
}: {
  dates: Date[]
  onRefresh: () => void
}) {
  const { data, error, loading } = useAsync(() => fetchMenus(dates), [])
  const menusByDay = new Map<string, Menu>()
  for (const menu of data ?? []) {
    const key = toDayKey(menu.date)
    const previous = menusByDay.get(key)
    menusByDay.set(key, {
      date: menu.date,
      lunch: menu.lunch ?? previous?.lunch,
      dinner: menu.dinner ?? previous?.dinner,
    })
  }
  const columns = dates
    .map((date) => {
      const key = toDayKey(date)
      return { date, key, menu: menusByDay.get(key) }
    })
    .filter(({ menu }, index) => index < 5 || hasPublishedMenu(menu))

  let status = "table"
  let content: ReactNode = <MenuTable columns={columns} />
  if (loading) {
    status = "loading"
    content = (
      <div className="flex w-full items-center justify-center py-16">
        <Spinner aria-label="Chargement du menu" />
      </div>
    )
  } else if (error) {
    status = "error"
    content = (
      <InlineError
        message="Impossible de charger le menu."
        onRetry={onRefresh}
      />
    )
  } else if (data === null) {
    status = "unavailable"
    content = (
      <EmptyState
        icon={Restaurant01Icon}
        title="Menus indisponibles"
        description="Le menu de la cantine n'est pas accessible pour ce compte PRONOTE."
      />
    )
  } else if (!columns.some(({ menu }) => hasPublishedMenu(menu))) {
    status = "empty"
    content = (
      <EmptyState
        icon={Restaurant01Icon}
        title="Aucun menu cette semaine"
        description="Rien à manger !"
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            className="min-h-11"
          >
            Actualiser
          </Button>
        }
      />
    )
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <m.div
        key={status}
        className="flex h-full min-h-0 flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        {content}
      </m.div>
    </AnimatePresence>
  )
}

export function SchoolMenus() {
  const [date, setDate] = useState(() => weekOf(new Date())[0])
  const [direction, setDirection] = useState(0)
  const [reload, setReload] = useState(0)
  const refresh = () => {
    triggerHapticLight()
    setDirection(0)
    setReload((key) => key + 1)
  }

  return (
    <SchoolPage
      title="Menu de la semaine"
      controls={
        <DateNavigator
          date={date}
          view="week"
          onDateChange={(next) => {
            const monday = weekOf(next)[0]
            if (toDayKey(monday) === toDayKey(date)) return
            triggerHapticLight()
            setDirection(monday > date ? 1 : -1)
            setDate(monday)
          }}
        />
      }
    >
      <section
        aria-label="Menus de la semaine"
        className="h-full overflow-hidden"
      >
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <m.div
            key={`${toDayKey(date)}:${reload}`}
            className="h-full"
            custom={direction}
            variants={weekTransition}
            initial="start"
            animate="visible"
            exit="end"
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <MenuPeriod dates={weekOf(date)} onRefresh={refresh} />
          </m.div>
        </AnimatePresence>
      </section>
    </SchoolPage>
  )
}
