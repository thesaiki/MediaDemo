import { useState } from 'react'

type StreamFormat = 'hls' | 'dash' | 'cmaf'

const DEFAULT_STREAMS: Record<StreamFormat, string> = {
  hls: import.meta.env.VITE_STREAM_URL || 'https://low-latency-demo.akamaized.net/live/media0/demonab/hls-r/demonab.m3u8',
  dash: 'https://low-latency-demo.akamaized.net/live/media0/demonab/dash-r/demonab.mpd',
  cmaf: 'https://linode-vod-obj.akamaized.net/ateme/tos4k/cmaf/hevc/manifest.mpd',
}

export default function VideoPlayerTab() {
  const [format, setFormat] = useState<StreamFormat>('hls')
  const [streamUrl, setStreamUrl] = useState(DEFAULT_STREAMS.hls)
  const bitmovinKey = import.meta.env.VITE_BITMOVIN_KEY

  const handleFormatChange = (f: StreamFormat) => {
    setFormat(f)
    setStreamUrl(DEFAULT_STREAMS[f])
  }

  return (
    <div className="space-y-6">
      {/* Hero / Title Section */}
      <div className="bg-gradient-to-br from-akamai-blue to-akamai-dark rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Akamai Media Player v2
        </h1>
        <p className="mt-1 text-base text-white/80">Powered by Bitmovin</p>
        <p className="mt-2 text-sm text-white/60 max-w-2xl mx-auto">
          Enterprise-grade adaptive video playback delivered through Akamai's global media delivery network with real-time analytics by MediaMelon.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Player Area */}
        <div className="flex-[2]">
          {bitmovinKey ? (
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
              <div id="amp-player" className="w-full h-full" />
              <p className="absolute text-white/60 text-sm">AMP v2 initializing...</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="text-center px-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-white/80 font-semibold mb-1">Akamai Media Player v2</p>
                <p className="text-white/50 text-xs max-w-sm">
                  Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">VITE_BITMOVIN_KEY</code> in your <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">.env</code> file to activate AMP v2.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-akamai-blue rounded-full animate-pulse" />
                  <span className="text-white/40 text-xs">Stream ready: {format.toUpperCase()}</span>
                </div>
              </div>
              {/* Mock controls bar */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/60 flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="flex-1 h-1 bg-white/20 rounded-full">
                  <div className="w-[35%] h-full bg-akamai-blue rounded-full" />
                </div>
                <span className="text-white text-[10px]">0:00 / 3:45</span>
              </div>
            </div>
          )}
        </div>

        {/* Config Panel */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Stream Configuration</h3>

          <label className="block mb-3">
            <span className="text-xs text-gray-500 block mb-1">Stream URL</span>
            <input
              type="text"
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
              placeholder="Enter stream URL..."
            />
          </label>

          <div className="mb-4">
            <span className="text-xs text-gray-500 block mb-1.5">Format</span>
            <div className="flex gap-2">
              {(['hls', 'dash', 'cmaf'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => handleFormatChange(f)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    format === f
                      ? 'bg-akamai-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div>
              <span className="text-xs text-gray-500">Player</span>
              <p className="text-sm font-medium text-gray-800">AMP v2 (Bitmovin)</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Current Quality</span>
              <p className="text-sm font-medium text-gray-800">1080p @ 4.5 Mbps</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Buffer Health</span>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-green-500 rounded-full transition-all" />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Protocol</span>
              <p className="text-sm font-medium text-gray-800">{format.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">CDN</span>
              <p className="text-sm font-medium text-gray-800">Akamai AMD</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
