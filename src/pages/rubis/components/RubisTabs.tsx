import { SegmentedTabs } from "@/components/SegmentedTabs"

export type RubisTab = "quests" | "shop"

const TABS = [
  { value: "quests", label: "Quêtes" },
  { value: "shop", label: "Boutique" },
] as const

export function RubisTabs(props: {
  value: RubisTab
  onChange: (tab: RubisTab) => void
  className?: string
  buttonClassName?: string
}) {
  return (
    <SegmentedTabs
      {...props}
      tabs={TABS}
      label="Quêtes et boutique"
      layoutId="rubis-tab-pill"
    />
  )
}
