import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import TabBar from './components/TabBar'

const StreamingFormatsTab = lazy(() => import('./components/tabs/StreamingFormatsTab'))
const VODArchitectureTab = lazy(() => import('./components/tabs/VODArchitectureTab'))
const LiveArchitectureTab = lazy(() => import('./components/tabs/LiveArchitectureTab'))
const EncodingTab = lazy(() => import('./components/tabs/EncodingTab'))
const VideoPlayerTab = lazy(() => import('./components/tabs/VideoPlayerTab'))
const VirtualChannelsTab = lazy(() => import('./components/tabs/VirtualChannelsTab'))
const AntiPiracyTab = lazy(() => import('./components/tabs/AntiPiracyTab'))
const AnalyticsTab = lazy(() => import('./components/tabs/AnalyticsTab'))
const CloudinaryTab = lazy(() => import('./components/tabs/CloudinaryTab'))

const TABS = [
  { id: 'formats', label: 'Media 101' },
  { id: 'vod', label: 'VOD Architecture' },
  { id: 'live', label: 'Live Architecture' },
  { id: 'encoding', label: 'Encoding' },
  { id: 'player', label: 'Video Player' },
  { id: 'channels', label: 'Virtual Channels' },
  { id: 'antipiracy', label: 'MCAP' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'cloudinary', label: 'Cloudinary' },
] as const

function getTabFromHash(): number {
  const hash = window.location.hash.replace('#', '')
  const idx = TABS.findIndex(t => t.id === hash)
  return idx >= 0 ? idx : 0
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getTabFromHash)

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const handleTabChange = (index: number) => {
    window.location.hash = TABS[index].id
    setActiveTab(index)
  }

  const renderTab = () => {
    const fallback = <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
    switch (activeTab) {
      case 0: return <Suspense fallback={fallback}><StreamingFormatsTab /></Suspense>
      case 1: return <Suspense fallback={fallback}><VODArchitectureTab /></Suspense>
      case 2: return <Suspense fallback={fallback}><LiveArchitectureTab /></Suspense>
      case 3: return <Suspense fallback={fallback}><EncodingTab /></Suspense>
      case 4: return <Suspense fallback={fallback}><VideoPlayerTab /></Suspense>
      case 5: return <Suspense fallback={fallback}><VirtualChannelsTab /></Suspense>
      case 6: return <Suspense fallback={fallback}><AntiPiracyTab /></Suspense>
      case 7: return <Suspense fallback={fallback}><AnalyticsTab /></Suspense>
      case 8: return <Suspense fallback={fallback}><CloudinaryTab /></Suspense>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TabBar tabs={TABS.map(t => t.label)} activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTab()}
      </main>
    </div>
  )
}
