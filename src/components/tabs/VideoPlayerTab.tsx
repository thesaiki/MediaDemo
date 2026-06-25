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
      {/* Hero */}
      <div className="bg-gradient-to-br from-akamai-blue to-akamai-dark rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Adaptive Media Player v2
        </h1>
        <p className="mt-1 text-base text-white/80">Powered by Bitmovin</p>
        <p className="mt-2 text-sm text-white/60 max-w-2xl mx-auto">
          Deliver high-quality playback with complete control — dedicated SDKs and built-in analytics for every device.
        </p>
      </div>

      {/* Product Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Product Overview</h2>
        <p className="text-sm text-gray-600 mb-4">
          Akamai's Adaptive Media Player v2 (AMP v2) is an enterprise-grade video player built on Bitmovin's player engine. It provides a unified playback experience across web, mobile, Smart TVs, and gaming consoles — with native support for adaptive streaming, DRM, advertising, and real-time analytics through Akamai's media delivery network.
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-akamai-blue">30+</div>
            <div className="text-xs text-gray-500 mt-1">Supported Devices &amp; Platforms</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-akamai-blue">5</div>
            <div className="text-xs text-gray-500 mt-1">Native SDKs</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-akamai-blue">3</div>
            <div className="text-xs text-gray-500 mt-1">DRM Systems</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-akamai-blue">&lt; 5s</div>
            <div className="text-xs text-gray-500 mt-1">LL-HLS Latency</div>
          </div>
        </div>
      </div>

      {/* Key Capabilities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Key Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { title: 'Adaptive Bitrate Streaming', desc: 'Native HLS, DASH, and CMAF support with intelligent ABR algorithms that adapt to network conditions in real-time for buffer-free playback.' },
            { title: 'Low-Latency Playback', desc: 'LL-HLS and LL-DASH support for sub-5-second glass-to-glass latency — critical for live sports, auctions, and interactive broadcasts.' },
            { title: 'Multi-Codec Support', desc: 'H.264/AVC, H.265/HEVC, AV1, and VP9 codec support. Automatic codec selection based on device capabilities and content optimization.' },
            { title: 'DRM & Content Protection', desc: 'Integrated Widevine, FairPlay, and PlayReady DRM. Seamless license acquisition with support for persistent and streaming licenses.' },
            { title: 'Server-Side Ad Insertion (SSAI)', desc: 'Pre-roll, mid-roll, and post-roll ad support via SSAI for ad-blocker-proof monetization. VAST/VPAID/VMAP compliance.' },
            { title: 'CMCD Support', desc: 'Common Media Client Data (CMCD) transmission for CDN-side quality-of-experience optimization and intelligent edge caching decisions.' },
            { title: 'Built-In Analytics', desc: 'Real-time QoE metrics — startup time, rebuffer ratio, bitrate, error rates. Integration with MediaMelon, Datazoom, Conviva, and Akamai analytics.' },
            { title: 'Customizable UI', desc: 'Fully skinnable player chrome with CSS-based theming. Custom overlays, watermarks, and branded controls without forking the player.' },
          ].map(item => (
            <div key={item.title} className="flex gap-3">
              <div className="w-1.5 shrink-0 rounded-full bg-akamai-blue mt-1" style={{ height: '14px' }} />
              <div>
                <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform & SDK Support */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Platform &amp; SDK Support</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { platform: 'Web', sdk: 'JavaScript SDK', devices: 'Chrome, Safari, Firefox, Edge', icon: '🌐' },
            { platform: 'iOS', sdk: 'Native Swift SDK', devices: 'iPhone, iPad, Apple TV', icon: '📱' },
            { platform: 'Android', sdk: 'Native Kotlin SDK', devices: 'Phones, tablets, Android TV', icon: '🤖' },
            { platform: 'Smart TVs', sdk: 'TV SDKs', devices: 'Samsung Tizen, LG webOS, Roku', icon: '📺' },
            { platform: 'Gaming', sdk: 'Console SDKs', devices: 'PlayStation, Xbox', icon: '🎮' },
          ].map(p => (
            <div key={p.platform} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">{p.icon}</div>
              <h4 className="font-semibold text-sm text-gray-800">{p.platform}</h4>
              <p className="text-[10px] text-akamai-blue font-medium mt-1">{p.sdk}</p>
              <p className="text-[10px] text-gray-500 mt-1">{p.devices}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Streaming & DRM Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-akamai-dark text-white px-5 py-3 font-semibold text-sm">
          Supported Streaming Protocols &amp; DRM
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Protocol</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Format</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">DRM</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Low-Latency</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Use Case</th>
              </tr>
            </thead>
            <tbody>
              {[
                { protocol: 'HLS', format: '.m3u8 / fMP4, TS', drm: 'FairPlay', ll: '—', use: 'Apple ecosystem, broad reach' },
                { protocol: 'LL-HLS', format: '.m3u8 / fMP4', drm: 'FairPlay', ll: '< 5 sec', use: 'Low-latency live on Apple' },
                { protocol: 'DASH', format: '.mpd / fMP4', drm: 'Widevine, PlayReady', ll: '—', use: 'Multi-DRM, Android/Web' },
                { protocol: 'LL-DASH', format: '.mpd / CMAF', drm: 'Widevine, PlayReady', ll: '< 3 sec', use: 'Ultra-low-latency live' },
                { protocol: 'CMAF', format: 'fMP4 (unified)', drm: 'All (CBCS)', ll: '3-5 sec', use: 'Cross-platform, cost reduction' },
                { protocol: 'Progressive', format: 'MP4', drm: '—', ll: '—', use: 'Simple VOD, fallback' },
              ].map((row, i) => (
                <tr key={row.protocol} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-medium text-akamai-blue">{row.protocol}</td>
                  <td className="px-4 py-2 text-gray-600">{row.format}</td>
                  <td className="px-4 py-2 text-gray-600">{row.drm}</td>
                  <td className="px-4 py-2 text-gray-600">{row.ll}</td>
                  <td className="px-4 py-2 text-gray-600">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Demo */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Player Demo</h2>
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
                  <p className="text-white/80 font-semibold mb-1">Adaptive Media Player v2</p>
                  <p className="text-white/50 text-xs max-w-sm">
                    Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">VITE_BITMOVIN_KEY</code> in your <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">.env</code> file to activate AMP v2.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-akamai-blue rounded-full animate-pulse" />
                    <span className="text-white/40 text-xs">Stream ready: {format.toUpperCase()}</span>
                  </div>
                </div>
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
          <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-5">
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
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
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
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
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

      {/* Additional Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Additional Features</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Thumbnail Seeking', desc: 'Visual preview thumbnails during scrubbing for instant content discovery. Supports WebVTT and BIF thumbnail formats.' },
            { title: 'Offline Playback', desc: 'Download-to-go with DRM persistence for mobile SDKs. Content available offline with configurable license expiry.' },
            { title: 'Cast & AirPlay', desc: 'Native Chromecast and AirPlay support. Seamless handoff between mobile, TV, and speaker devices.' },
            { title: 'Multi-Audio & Subtitles', desc: 'Multiple audio tracks and subtitle/caption support (WebVTT, TTML, CEA-608/708) with in-player language selection.' },
            { title: 'Picture-in-Picture', desc: 'Native PiP mode on supported platforms. Viewers continue watching while browsing other content or apps.' },
            { title: 'VR / 360° Video', desc: 'Immersive 360-degree and VR video playback with gyroscope and drag controls on web and mobile.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-800 mb-1">{f.title}</h4>
              <p className="text-xs text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Link */}
      <div className="bg-gradient-to-r from-akamai-blue to-akamai-dark rounded-lg p-6 text-white flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Documentation &amp; Resources</h3>
          <p className="text-sm text-white/70 mt-1">Full API reference, SDK guides, and integration tutorials</p>
        </div>
        <a
          href="https://www.akamai.com/resources/product-brief/adaptive-media-player-2"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-akamai-blue px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          AMP v2 Product Brief →
        </a>
      </div>
    </div>
  )
}
