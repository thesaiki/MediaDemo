import { useState } from 'react'

const mmCodeSnippet = `// Initialize MediaMelon with AMP v2
const mmSdkConfig = {
  customerID: import.meta.env.VITE_MM_CUSTOMER_ID,
  playerName: "AMP-v2",
  domainName: window.location.host,
  subscriberID: "demo-user",
  playerBrand: "Bitmovin",
  playerModel: "v2",
  playerVersion: "8.x",
};

// Attach to AMP v2 player instance
if (window.mmSmartStreaming) {
  window.mmSmartStreaming.init(
    player,
    mmSdkConfig
  );
}`

type DashboardView = 'mediamelon' | 'trafficpeak'

export default function AnalyticsTab() {
  const [view, setView] = useState<DashboardView>('mediamelon')
  const mmDashboardUrl = import.meta.env.VITE_MM_DASHBOARD_URL
  const trafficpeakUrl = import.meta.env.VITE_TRAFFICPEAK_URL

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Integration Code */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">MediaMelon SDK Integration</h3>
          <p className="text-sm text-gray-500 mb-3">
            Initialize MediaMelon SmartStreaming SDK with AMP v2 for real-time QoE analytics.
          </p>
          <pre className="bg-gray-900 rounded-lg p-4 text-[11px] text-green-300 overflow-x-auto leading-relaxed font-mono">
            {mmCodeSnippet}
          </pre>
        </div>

        {/* Dashboard Embed */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              {view === 'mediamelon' ? 'MediaMelon Dashboard' : 'TrafficPeak Dashboard'}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setView('mediamelon')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  view === 'mediamelon'
                    ? 'bg-akamai-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                MediaMelon
              </button>
              <button
                onClick={() => setView('trafficpeak')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  view === 'trafficpeak'
                    ? 'bg-akamai-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                TrafficPeak
              </button>
            </div>
          </div>

          {view === 'mediamelon' && mmDashboardUrl ? (
            <iframe
              src={mmDashboardUrl}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '400px' }}
              title="MediaMelon Dashboard"
            />
          ) : view === 'trafficpeak' && trafficpeakUrl ? (
            <iframe
              src={trafficpeakUrl}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '400px' }}
              title="TrafficPeak Dashboard"
            />
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-center" style={{ height: '400px' }}>
              <div className="px-6">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-gray-600 font-medium mb-1">
                  {view === 'mediamelon' ? 'MediaMelon Dashboard' : 'TrafficPeak Grafana Dashboard'}
                </p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Set <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                    {view === 'mediamelon' ? 'VITE_MM_DASHBOARD_URL' : 'VITE_TRAFFICPEAK_URL'}
                  </code> in your <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">.env</code> file to embed the dashboard here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QoE Metrics Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">QoE Metrics Tracked</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Startup Time', value: '1.2s', icon: '⚡' },
            { label: 'Buffer Ratio', value: '0.3%', icon: '📦' },
            { label: 'Avg Bitrate', value: '4.5 Mbps', icon: '📶' },
            { label: 'VMAF Score', value: '92/100', icon: '🎯' },
            { label: 'Rebuffer Events', value: '0', icon: '🔄' },
            { label: 'Error Rate', value: '0.01%', icon: '⚠️' },
            { label: 'CDN Latency', value: '45ms', icon: '🌐' },
            { label: 'Viewer Sessions', value: '1,247', icon: '👥' },
          ].map(m => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-lg font-bold text-gray-800">{m.value}</div>
              <div className="text-xs text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
