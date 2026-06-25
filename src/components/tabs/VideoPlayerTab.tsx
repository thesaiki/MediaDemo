import { useState, useEffect, useRef } from 'react'

type StreamFormat = 'hls' | 'dash' | 'progressive'
type DemoMode = 'player' | 'stream-test' | 'features'

const DEMO_SOURCES = {
  'Art of Motion (DASH)': {
    dash: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    poster: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg',
  },
  'Art of Motion (HLS)': {
    hls: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    poster: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg',
  },
  'Art of Motion (Progressive)': {
    progressive: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/MI201109210084_mpeg-4_hd_high_1080p25_10mbits.mp4',
    poster: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg',
  },
  'Art of Motion + Thumbnails': {
    dash: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    poster: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg',
    thumbnailTrack: { url: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/thumbnails/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.vtt' },
  },
  'DASH + Widevine DRM': {
    dash: 'https://cdn.bitmovin.com/content/assets/art-of-motion_drm/mpds/11331.mpd',
    poster: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg',
    drm: { widevine: { LA_URL: 'https://cwip-shaka-proxy.appspot.com/no_auth' } },
  },
  'SSAI Demo': {
    dash: 'https://bitmovin-a.akamaihd.net/498364_fcb0257026d0bd3ee0ba3aad95674188/manifest.mpd',
    hls: 'https://bitmovin-a.akamaihd.net/498364_fcb0257026d0bd3ee0ba3aad95674188/playlist.m3u8',
    poster: 'https://bitmovin-a.akamaihd.net/498364_fcb0257026d0bd3ee0ba3aad95674188/poster.jpg',
  },
  'Akamai Live (HLS)': {
    hls: 'https://low-latency-demo.akamaized.net/live/media0/demonab/hls-r/demonab.m3u8',
  },
  'Akamai Live (DASH)': {
    dash: 'https://low-latency-demo.akamaized.net/live/media0/demonab/dash-r/demonab.mpd',
  },
  'Akamai VOD (HEVC 4K)': {
    dash: 'https://linode-vod-obj.akamaized.net/ateme/tos4k/cmaf/hevc/manifest.mpd',
  },
}

type SourceKey = keyof typeof DEMO_SOURCES

const PLAYER_CDN = 'https://cdn.bitmovin.com/player/web/8/bitmovinplayer.js'
const ANALYTICS_CDN = 'https://cdn.bitmovin.com/analytics/web/2/bitmovinanalytics.min.js'

export default function VideoPlayerTab() {
  const [mode, setMode] = useState<DemoMode>('player')
  const [selectedSource, setSelectedSource] = useState<SourceKey>('Art of Motion (DASH)')
  const [customUrl, setCustomUrl] = useState('')
  const [customFormat, setCustomFormat] = useState<StreamFormat>('hls')
  const [playerLoaded, setPlayerLoaded] = useState(false)
  const [playerError, setPlayerError] = useState('')
  const playerRef = useRef<HTMLDivElement>(null)
  const playerInstanceRef = useRef<unknown>(null)
  const bitmovinKey = import.meta.env.VITE_BITMOVIN_KEY || '29ba4a30-8b5e-4336-a7dd-c94ff3b25f30'

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve()
        s.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.head.appendChild(s)
      })
    }

    Promise.all([loadScript(PLAYER_CDN), loadScript(ANALYTICS_CDN)])
      .then(() => { setPlayerLoaded(true); setPlayerError('') })
      .catch(() => setPlayerError('Failed to load Bitmovin Player SDK'))

    return () => {
      destroyPlayer()
    }
  }, [])

  useEffect(() => {
    if (!playerLoaded) return
    const timer = setTimeout(() => {
      if (!playerRef.current) return
      if (mode === 'features') { destroyPlayer(); return }
      loadSource(DEMO_SOURCES[selectedSource])
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerLoaded, selectedSource, mode])

  function destroyPlayer() {
    const inst = playerInstanceRef.current as { destroy?: () => void } | null
    if (inst?.destroy) {
      try { inst.destroy() } catch { /* ignore */ }
    }
    playerInstanceRef.current = null
    if (playerRef.current) playerRef.current.innerHTML = ''
  }

  function loadSource(source: Record<string, unknown>) {
    if (!playerRef.current) return
    destroyPlayer()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bitmovinNs = (window as unknown as Record<string, unknown>).bitmovin as { player?: { Player: new (el: HTMLElement, conf: Record<string, unknown>) => { load: (s: Record<string, unknown>) => Promise<void>; destroy: () => void } }; analytics?: { PlayerModule: unknown } } | undefined
    if (!bitmovinNs?.player) return

    const conf: Record<string, unknown> = {
      key: bitmovinKey,
      playback: { muted: true, autoplay: false },
    }

    if (bitmovinNs.analytics?.PlayerModule) {
      try {
        (bitmovinNs.player.Player as unknown as { addModule: (m: unknown) => void }).addModule(bitmovinNs.analytics.PlayerModule)
      } catch { /* module already added */ }
      conf.analytics = { key: '45adcf9b-8f7c-4e28-91c5-50ba3d442cd4', videoId: 'amp-v2-demo' }
    }

    try {
      const player = new bitmovinNs.player.Player(playerRef.current, conf)
      playerInstanceRef.current = player
      player.load(source).catch((err: { code?: number; name?: string; message?: string }) => {
        const msg = err?.name || err?.message || ''
        if (err?.code === 1016 || msg.includes('LICENSE') || msg.includes('ALLOWLIST')) {
          setPlayerError('LICENSE')
        } else {
          setPlayerError('Failed to load stream')
        }
      })
    } catch {
      setPlayerError('LICENSE')
    }
  }

  function loadCustomStream() {
    if (!customUrl.trim()) return
    const source: Record<string, unknown> = { [customFormat]: customUrl.trim() }
    loadSource(source)
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-akamai-blue to-akamai-dark rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Adaptive Media Player v2</h1>
        <p className="mt-1 text-base text-white/80">Powered by Bitmovin</p>
        <p className="mt-2 text-sm text-white/60 max-w-2xl mx-auto">
          Deliver high-quality playback with complete control — dedicated SDKs and built-in analytics for every device.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {[
          { id: 'player' as const, label: 'Demo Player' },
          { id: 'stream-test' as const, label: 'Stream Tester' },
          { id: 'features' as const, label: 'Capabilities' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m.id ? 'bg-akamai-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'player' && (
        <>
          {/* Player + Source Selector */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-[2]">
              {playerError === 'LICENSE' ? (
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <p className="text-white/80 font-semibold mb-1">Adaptive Media Player v2</p>
                    <p className="text-white/50 text-xs max-w-sm">
                      Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">VITE_BITMOVIN_KEY</code> in your <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">.env</code> file with a licensed key that allowlists this domain.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-akamai-blue rounded-full animate-pulse" />
                      <span className="text-white/40 text-xs">Selected: {selectedSource}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/60 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <div className="flex-1 h-1 bg-white/20 rounded-full"><div className="w-[35%] h-full bg-akamai-blue rounded-full" /></div>
                    <span className="text-white text-[10px]">0:00 / 3:45</span>
                  </div>
                </div>
              ) : playerError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600 font-medium">{playerError}</p>
                </div>
              ) : (
                <div ref={playerRef} className="rounded-lg overflow-hidden bg-black aspect-video" />
              )}
            </div>

            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Demo Streams</h3>
              <p className="text-xs text-gray-500 mb-3">Select a source to load into the player.</p>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {(Object.keys(DEMO_SOURCES) as SourceKey[]).map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedSource(name)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                      selectedSource === name
                        ? 'bg-akamai-blue text-white font-semibold'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {mode === 'stream-test' && (
        <>
          {/* Stream Tester */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Test Your Stream</h3>
            <p className="text-xs text-gray-500 mb-4">Paste any HLS, DASH, or Progressive stream URL to test playback with AMP v2.</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex gap-2">
                {(['hls', 'dash', 'progressive'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setCustomFormat(f)}
                    className={`px-3 py-2 rounded text-xs font-semibold transition-colors ${
                      customFormat === f
                        ? 'bg-akamai-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder={customFormat === 'hls' ? 'https://example.com/stream.m3u8' : customFormat === 'dash' ? 'https://example.com/manifest.mpd' : 'https://example.com/video.mp4'}
                className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
                onKeyDown={e => e.key === 'Enter' && loadCustomStream()}
              />
              <button
                onClick={loadCustomStream}
                className="bg-akamai-blue text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-akamai-dark transition-colors whitespace-nowrap"
              >
                Load Stream
              </button>
            </div>
          </div>

          {playerError === 'LICENSE' ? (
            <div className="bg-gray-900 rounded-lg aspect-video max-w-4xl mx-auto flex items-center justify-center">
              <div className="text-center px-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <p className="text-white/80 font-semibold mb-1">AMP v2 — License Required</p>
                <p className="text-white/50 text-xs max-w-sm">Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">VITE_BITMOVIN_KEY</code> with a key that allowlists this domain.</p>
              </div>
            </div>
          ) : (
            <div ref={playerRef} className="rounded-lg overflow-hidden bg-black aspect-video max-w-4xl mx-auto" />
          )}
        </>
      )}

      {mode === 'features' && (
        <>
          {/* Product Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Product Overview</h2>
            <p className="text-sm text-gray-600 mb-4">
              Akamai's Adaptive Media Player v2 (AMP v2) is an enterprise-grade video player built on Bitmovin's player engine. It provides a unified playback experience across web, mobile, Smart TVs, and gaming consoles — with native support for adaptive streaming, DRM, advertising, and real-time analytics through Akamai's media delivery network.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-akamai-blue">30+</div>
                <div className="text-xs text-gray-500 mt-1">Devices &amp; Platforms</div>
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
          <div className="bg-gradient-to-r from-akamai-blue to-akamai-dark rounded-lg p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        </>
      )}
    </div>
  )
}
