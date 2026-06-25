interface TabBarProps {
  tabs: string[]
  activeTab: number
  onTabChange: (index: number) => void
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((label, i) => (
          <button
            key={label}
            onClick={() => onTabChange(i)}
            className={`shrink-0 px-4 py-3 text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-colors
              ${i === activeTab
                ? 'text-akamai-blue border-b-[3px] border-akamai-blue -mb-[2px]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
