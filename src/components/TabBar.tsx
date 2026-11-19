interface TabLink {
  label: string
  href: string
}

interface TabBarProps {
  tabs: string[]
  activeTab: number
  onTabChange: (index: number) => void
  /** Tabs that navigate to another page or site instead of switching the in-page view. */
  links?: TabLink[]
}

const TAB_BASE = 'shrink-0 px-4 py-3 text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-colors'
const TAB_IDLE = 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'

export default function TabBar({ tabs, activeTab, onTabChange, links = [] }: TabBarProps) {
  return (
    <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((label, i) => (
          <button
            key={label}
            onClick={() => onTabChange(i)}
            className={`${TAB_BASE}
              ${i === activeTab
                ? 'text-akamai-blue border-b-[3px] border-akamai-blue -mb-[2px]'
                : TAB_IDLE
              }`}
          >
            {label}
          </button>
        ))}
        {links.map(link => (
          <a key={link.href} href={link.href} className={`${TAB_BASE} ${TAB_IDLE}`}>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
