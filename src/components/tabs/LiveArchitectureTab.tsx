import { useState } from 'react'
import LiveArchDiagram from '../diagrams/LiveArchDiagram'
import { featureParityData, newFeaturesData } from '../../data/msl5Features'
import type { FeatureRow } from '../../data/msl5Features'

function FeatureTable({ title, data }: { title: string; data: FeatureRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-akamai-dark text-white">
            <th className="text-left px-4 py-2.5 font-semibold">{title}</th>
            <th className="px-4 py-2.5 font-semibold text-center">MSL4</th>
            <th className="px-4 py-2.5 font-semibold text-center">MSL5</th>
            <th className="px-4 py-2.5 font-semibold text-center">Roadmap</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 text-gray-700">{row.feature}</td>
              <td className="px-4 py-2 text-center text-gray-600">{row.msl4 || '—'}</td>
              <td className="px-4 py-2 text-center font-medium text-akamai-blue">{row.msl5 || '—'}</td>
              <td className="px-4 py-2 text-center text-gray-500">{row.roadmap || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LiveArchitectureTab() {
  const [sessionId, setSessionId] = useState('')
  const [showMsl5, setShowMsl5] = useState(false)

  return (
    <div className="space-y-6">
      {/* Architecture Diagram */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
        <LiveArchDiagram />
      </div>

      {/* MSL5 Section — collapsible */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowMsl5(!showMsl5)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-akamai-blue text-white px-3 py-1 rounded text-xs font-bold">MSL5</div>
            <h3 className="font-semibold text-gray-800">Media Services Live — Powered by Harmonic</h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showMsl5 ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMsl5 && (
          <div className="border-t border-gray-200 p-5 space-y-5">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-akamai-dark text-white px-4 py-2.5 font-semibold text-sm">MSL5 — Powered by Harmonic</div>
                <div className="p-4 space-y-2 text-sm text-gray-700">
                  <p>Powered by Harmonic, runs on Akamai Connected Cloud</p>
                  <p>Feature parity with MSL4</p>
                  <p>Pricing &amp; invoicing process unchanged</p>
                  <p>Support &amp; operations unchanged</p>
                  <p className="pt-2 border-t border-gray-100 text-akamai-blue font-medium italic">Seamless upgrade after blue-green testing</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-akamai-blue text-white px-4 py-2.5 font-semibold text-sm">New Capabilities</div>
                <div className="p-4 space-y-2 text-sm text-gray-700">
                  <p>End-to-end <strong>5-7 sec</strong> low-latency streaming</p>
                  <p>Near real-time stream provisioning (<strong>~5 sec</strong> vs ~3 hours on MSL4)</p>
                  <p>Up to <strong>12-hour</strong> configurable DVR window</p>
                  <p>Easy event creation &amp; management</p>
                  <p>Powerful dashboard &amp; logs management</p>
                  <p className="text-gray-500 italic">OTT transcoding, Dynamic Ad Insertion (roadmap)</p>
                </div>
              </div>
            </div>

            {/* Feature Comparison Tables */}
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <FeatureTable title="Feature Parity" data={featureParityData} />
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <FeatureTable title="New Features" data={newFeaturesData} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CMCD Session ID */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">CMCD Session ID:</label>
          <input
            type="text"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            placeholder="Enter your unique session ID for CMCD"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
          />
          <button className="bg-akamai-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-akamai-dark transition-colors whitespace-nowrap">
            Set Session ID
          </button>
        </div>
      </div>

      {/* Side-by-side Players */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-orange text-white px-4 py-2.5 font-bold text-center">LL-HLS</div>
          <p className="text-center text-sm text-gray-500 py-1">Low latency live stream using LL-HLS</p>
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/40 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/50 text-xs">LL-HLS Stream (AMP v2)</p>
              <p className="text-white/30 text-[10px] mt-1">5-7 sec latency</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-orange text-white px-4 py-2.5 font-bold text-center">HLS</div>
          <p className="text-center text-sm text-gray-500 py-1">Regular latency live stream using HLS</p>
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/40 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/50 text-xs">HLS Stream (AMP v2)</p>
              <p className="text-white/30 text-[10px] mt-1">6-30 sec latency</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-orange text-white px-4 py-2.5 font-bold text-center">LL-DASH</div>
          <p className="text-center text-sm text-gray-500 py-1">Low latency live stream using LL-DASH</p>
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/40 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/50 text-xs">LL-DASH Stream (AMP v2)</p>
              <p className="text-white/30 text-[10px] mt-1">&lt; 3 sec latency</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-orange text-white px-4 py-2.5 font-bold text-center">DASH</div>
          <p className="text-center text-sm text-gray-500 py-1">Regular latency live stream using DASH</p>
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/40 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/50 text-xs">DASH Stream (AMP v2)</p>
              <p className="text-white/30 text-[10px] mt-1">6-30 sec latency</p>
            </div>
          </div>
        </div>
      </div>

      {/* UTC Time */}
      <div className="bg-akamai-orange text-white text-center py-2.5 rounded-lg font-bold text-sm">
        Current UTC Time: {new Date().toUTCString().split(' ')[4]}
      </div>
    </div>
  )
}
