const CLOUDINARY_SITE_URL = import.meta.env.VITE_CLOUDINARY_SITE_URL || 'https://cloudinary.fde-demo.com'

export default function Navbar() {
  return (
    <nav className="bg-akamai-blue px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/akamai-logo.svg" alt="Akamai" className="h-8 brightness-0 invert" />
        <span className="text-white/50">|</span>
        <span className="text-white/90 text-sm font-medium">Akamai Media Solutions Demo</span>
      </div>
      <a
        href={CLOUDINARY_SITE_URL}
        className="text-white/80 hover:text-white text-xs font-medium whitespace-nowrap transition-colors"
      >
        Cloudinary Demos →
      </a>
    </nav>
  )
}
