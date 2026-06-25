import { useState } from 'react'
import VODArchDiagram from '../diagrams/VODArchDiagram'
import JITPArchDiagram from '../diagrams/JITPArchDiagram'

type ArchView = 'basic' | 'jitp'

export default function VODArchitectureTab() {
  const [view, setView] = useState<ArchView>('basic')
  const [filename, setFilename] = useState('')

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('basic')}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            view === 'basic' ? 'bg-akamai-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Basic VOD Pipeline
        </button>
        <button
          onClick={() => setView('jitp')}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            view === 'jitp' ? 'bg-akamai-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          VOD with JITP
        </button>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
        {view === 'basic' ? <VODArchDiagram /> : <JITPArchDiagram />}
      </div>

      {/* Filename Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">VOD Asset:</label>
          <input
            type="text"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            placeholder="Enter filename without extension (e.g., tos4k)"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
          />
          <button className="bg-akamai-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-akamai-dark transition-colors whitespace-nowrap">
            Play Asset
          </button>
        </div>
      </div>

      {/* VOD Players */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-orange text-white px-4 py-2.5 font-bold text-center">DASH HEVC 4K</div>
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/40 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/50 text-xs">DASH HEVC 4K (AMP v2)</p>
              <p className="text-white/30 text-[10px] mt-1 max-w-[200px]">linode-vod-obj.akamaized.net</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-orange text-white px-4 py-2.5 font-bold text-center">HLS HEVC 4K</div>
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/40 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/50 text-xs">HLS HEVC 4K (AMP v2)</p>
              <p className="text-white/30 text-[10px] mt-1 max-w-[200px]">linode-vod-obj.akamaized.net</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
