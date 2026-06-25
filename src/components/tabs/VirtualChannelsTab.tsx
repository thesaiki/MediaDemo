import { useState } from 'react'
import ChannelArchDiagram from '../diagrams/ChannelArchDiagram'
import { channels, smilExample, channelFeatureTags } from '../../data/channelSchedule'

type ChannelView = 'architecture' | 'lineup'

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-50 border-l-blue-500',
  amber: 'bg-amber-50 border-l-amber-500',
  green: 'bg-green-50 border-l-green-500',
  pink: 'bg-pink-50 border-l-pink-500',
  purple: 'bg-purple-50 border-l-purple-500',
}

export default function VirtualChannelsTab() {
  const [view, setView] = useState<ChannelView>('architecture')

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('architecture')}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            view === 'architecture' ? 'bg-akamai-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Architecture
        </button>
        <button
          onClick={() => setView('lineup')}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            view === 'lineup' ? 'bg-akamai-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Channel Lineup
        </button>
      </div>

      {view === 'architecture' ? (
        <>
          {/* Architecture Diagram */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
            <ChannelArchDiagram />
          </div>

          {/* SMIL Example */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">SMIL / Server Manifest Example</h3>
            <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">
              {smilExample}
            </pre>
          </div>
        </>
      ) : (
        /* Channel Lineup EPG */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Time Header */}
          <div className="flex bg-akamai-dark text-white text-xs font-semibold">
            <div className="w-28 shrink-0 px-3 py-2.5 border-r border-white/20">Channel</div>
            {['08:00', '09:00', '10:00', '11:00', '12:00'].map(t => (
              <div key={t} className="flex-1 px-3 py-2.5 border-r border-white/10 last:border-r-0">{t}</div>
            ))}
          </div>

          {/* Channel Rows */}
          {channels.map(ch => (
            <div key={ch.name} className="flex border-b border-gray-200 last:border-b-0">
              <div className="w-28 shrink-0 px-3 py-3 font-semibold text-sm bg-gray-50 border-r border-gray-200 flex items-center">
                {ch.name}
              </div>
              {ch.programs.map((p, i) => (
                <div key={i} className="p-1.5" style={{ flex: p.flex }}>
                  <div className={`border-l-[3px] rounded px-2.5 py-2 h-full ${colorClasses[p.color] || 'bg-gray-50 border-l-gray-400'}`}>
                    <div className="font-semibold text-xs text-gray-800">{p.title}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{p.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Feature Tags */}
      <div className="flex flex-wrap gap-2">
        {channelFeatureTags.map(tag => (
          <span key={tag} className="bg-unified-light text-green-800 px-3 py-1.5 rounded-full text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
