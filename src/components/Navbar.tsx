export default function Navbar() {
  return (
    <nav className="bg-akamai-blue px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/akamai-logo.svg" alt="Akamai" className="h-8 brightness-0 invert" />
        <span className="text-white/50">|</span>
        <span className="text-white/90 text-sm font-medium">Akamai Media Solutions Demo</span>
      </div>
    </nav>
  )
}
