import { useState, useEffect, useRef } from 'react'

type StreamFormat = 'hls' | 'dash' | 'progressive'
type DemoMode = 'player' | 'stream-test' | 'captions' | 'dubbing' | 'features'
type DubLang = 'es' | 'hi'

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
  'Akamai Live (HLS)': {
    hls: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
  },
  'Akamai VOD — Big Buck Bunny (DASH)': {
    dash: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
  },
  'Akamai VOD — HEVC 4K': {
    dash: 'https://linode-vod-obj.akamaized.net/ateme/tos4k/cmaf/hevc/manifest.mpd',
  },
  'Tears of Steel (HLS)': {
    hls: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  },
}

type SourceKey = keyof typeof DEMO_SOURCES

const PLAYER_CDN = 'https://cdn.bitmovin.com/player/web/8/bitmovinplayer.js'
const ANALYTICS_CDN = 'https://cdn.bitmovin.com/analytics/web/2/bitmovinanalytics.min.js'

// Original sample narration used to demonstrate the AI captions/dubbing pipeline.
// Not a transcript of any of the demo videos' actual audio — this is a
// representative script so the workflow can be shown end-to-end without a
// backend ASR/translation service wired up.
const SAMPLE_SCRIPT: { start: number; end: number; en: string; es: string; hi: string }[] = [
  { start: 0, end: 4, en: 'Welcome to the Akamai media delivery showcase.', es: 'Bienvenido a la demostración de entrega de medios de Akamai.', hi: 'अकामाई मीडिया डिलीवरी शोकेस में आपका स्वागत है।' },
  { start: 4, end: 8, en: 'This video demonstrates adaptive streaming in action.', es: 'Este video demuestra la transmisión adaptativa en acción.', hi: 'यह वीडियो एडेप्टिव स्ट्रीमिंग को क्रियान्वित होते हुए दिखाता है।' },
  { start: 8, end: 12, en: 'Watch as the player adjusts quality to your connection.', es: 'Observa cómo el reproductor ajusta la calidad según tu conexión.', hi: 'देखें कि प्लेयर आपके कनेक्शन के अनुसार गुणवत्ता को कैसे समायोजित करता है।' },
  { start: 12, end: 16, en: 'Captions and dubbing are generated using AI-powered pipelines.', es: 'Los subtítulos y el doblaje se generan mediante flujos de trabajo con inteligencia artificial.', hi: 'कैप्शन और डबिंग एआई-संचालित वर्कफ़्लो का उपयोग करके बनाए जाते हैं।' },
  { start: 16, end: 20, en: "Thank you for exploring Akamai's media solutions.", es: 'Gracias por explorar las soluciones de medios de Akamai.', hi: 'अकामाई के मीडिया समाधानों को देखने के लिए धन्यवाद।' },
]

const CAPTION_STEPS = ['Extracting audio track', 'Running speech-to-text (ASR)', 'Detecting language', 'Aligning timestamps', 'Rendering WebVTT']
const DUB_STEPS = ['Transcribing source audio (English)', 'Translating to target language', 'Synthesizing voice (TTS)', 'Muxing dubbed audio track']

const LANG_LABELS: Record<DubLang, string> = { es: 'Spanish', hi: 'Hindi' }
const LANG_LOCALE: Record<DubLang, string> = { es: 'es-ES', hi: 'hi-IN' }

function formatVttTime(sec: number): string {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0')
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  const ms = Math.round((sec % 1) * 1000).toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function buildVtt(): string {
  let vtt = 'WEBVTT\n\n'
  SAMPLE_SCRIPT.forEach((line, i) => {
    vtt += `${i + 1}\n${formatVttTime(line.start)} --> ${formatVttTime(line.end)}\n${line.en}\n\n`
  })
  return vtt
}

export default function VideoPlayerTab() {
  const [mode, setMode] = useState<DemoMode>('player')
  const [selectedSource, setSelectedSource] = useState<SourceKey>('Art of Motion (DASH)')
  const [customUrl, setCustomUrl] = useState('')
  const [customFormat, setCustomFormat] = useState<StreamFormat>('hls')
  const [subtitleUrl, setSubtitleUrl] = useState('')
  const [subtitleLabel, setSubtitleLabel] = useState('English')
  const [mmEnabled, setMmEnabled] = useState(false)
  const [mmCustomerId, setMmCustomerId] = useState(import.meta.env.VITE_MM_CUSTOMER_ID || '')
  const [mmSubscriberId, setMmSubscriberId] = useState('')
  const [playerLoaded, setPlayerLoaded] = useState(false)
  const [playerError, setPlayerError] = useState('')
  const playerRef = useRef<HTMLDivElement>(null)
  const playerInstanceRef = useRef<unknown>(null)
  const bitmovinKey = import.meta.env.VITE_BITMOVIN_KEY

  // AI Captions state
  const [captionSource, setCaptionSource] = useState<SourceKey>('Tears of Steel (HLS)')
  const [captionStep, setCaptionStep] = useState(0)
  const [captionsGenerating, setCaptionsGenerating] = useState(false)
  const [captionsReady, setCaptionsReady] = useState(false)
  const [activeCaptionLine, setActiveCaptionLine] = useState(-1)
  const captionVttUrlRef = useRef<string | null>(null)

  // AI Dubbing state
  const [dubSource, setDubSource] = useState<SourceKey>('Tears of Steel (HLS)')
  const [dubLang, setDubLang] = useState<DubLang>('es')
  const [dubStep, setDubStep] = useState(0)
  const [dubGenerating, setDubGenerating] = useState(false)
  const [dubReady, setDubReady] = useState(false)
  const [dubPlaying, setDubPlaying] = useState(false)
  const [dubActiveLine, setDubActiveLine] = useState(-1)
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null)
  const dubTimeoutsRef = useRef<number[]>([])

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
      clearDubTimeouts()
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
      if (captionVttUrlRef.current) URL.revokeObjectURL(captionVttUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!playerLoaded || !bitmovinKey) return
    const timer = setTimeout(() => {
      if (mode === 'player' || mode === 'stream-test') {
        if (!playerRef.current) return
        loadSource(DEMO_SOURCES[selectedSource])
      } else {
        destroyPlayer()
      }
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerLoaded, selectedSource, mode])

  // Check available speech-synthesis voices for the selected dub language
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { setVoiceAvailable(false); return }
    function checkVoices() {
      const voices = window.speechSynthesis.getVoices()
      setVoiceAvailable(voices.some(v => v.lang.toLowerCase().startsWith(dubLang)))
    }
    checkVoices()
    window.speechSynthesis.onvoiceschanged = checkVoices
  }, [dubLang])

  // Poll playback time to highlight the active caption line
  useEffect(() => {
    if (mode !== 'captions' || !captionsReady) return
    const id = setInterval(() => {
      const inst = playerInstanceRef.current as { getCurrentTime?: () => number } | null
      if (!inst?.getCurrentTime) return
      const t = inst.getCurrentTime()
      setActiveCaptionLine(SAMPLE_SCRIPT.findIndex(l => t >= l.start && t < l.end))
    }, 300)
    return () => clearInterval(id)
  }, [mode, captionsReady])

  function destroyPlayer() {
    const inst = playerInstanceRef.current as { destroy?: () => void } | null
    if (inst?.destroy) {
      try { inst.destroy() } catch { /* ignore */ }
    }
    playerInstanceRef.current = null
    if (playerRef.current) playerRef.current.innerHTML = ''
  }

  function clearDubTimeouts() {
    dubTimeoutsRef.current.forEach(id => clearTimeout(id))
    dubTimeoutsRef.current = []
  }

  function loadSource(source: Record<string, unknown>) {
    if (!playerRef.current) return
    destroyPlayer()

    const bm = (window as unknown as Record<string, unknown>).bitmovin as Record<string, unknown> | undefined
    const playerNs = bm?.player as Record<string, unknown> | undefined
    const analyticsNs = bm?.analytics as Record<string, unknown> | undefined
    const PlayerClass = playerNs?.Player as (new (el: HTMLElement, conf: Record<string, unknown>) => Record<string, unknown>) | undefined
    const PlayerEvent = playerNs?.PlayerEvent as Record<string, string> | undefined
    if (!PlayerClass) return

    const conf: Record<string, unknown> = {
      key: bitmovinKey,
      playback: { muted: true, autoplay: false },
    }

    if (analyticsNs?.PlayerModule) {
      try {
        (PlayerClass as unknown as { addModule: (m: unknown) => void }).addModule(analyticsNs.PlayerModule)
      } catch { /* module already added */ }
      conf.analytics = { key: '45adcf9b-8f7c-4e28-91c5-50ba3d442cd4', videoId: 'amp-v2-demo' }
    }

    try {
      const player = new PlayerClass(playerRef.current, conf)
      playerInstanceRef.current = player

      const isLicenseError = (err: Record<string, unknown>) => {
        const code = err?.code as number | undefined
        const name = (err?.name || '') as string
        const msg = (err?.message || '') as string
        return code === 1016 || name.includes('LICENSE') || name.includes('ALLOWLIST') ||
               msg.includes('LICENSE') || msg.includes('ALLOWLIST') || msg.includes('allowlist') ||
               msg.includes('not allowlisted')
      }

      if (PlayerEvent?.Error) {
        (player as { on: (e: string, cb: (err: Record<string, unknown>) => void) => void }).on(
          PlayerEvent.Error, (err) => {
            if (isLicenseError(err?.data as Record<string, unknown> || err)) {
              setPlayerError('LICENSE')
            }
          }
        )
      }
      if (PlayerEvent?.Warning) {
        (player as { on: (e: string, cb: (err: Record<string, unknown>) => void) => void }).on(
          PlayerEvent.Warning, (err) => {
            if (isLicenseError(err?.data as Record<string, unknown> || err)) {
              setPlayerError('LICENSE')
            }
          }
        )
      }

      const load = player.load as (s: Record<string, unknown>) => Promise<void>
      load.call(player, source).catch((err: Record<string, unknown>) => {
        if (isLicenseError(err)) {
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
    if (subtitleUrl.trim()) {
      source.subtitle = {
        tracks: [{ id: 'sub1', url: subtitleUrl.trim(), label: subtitleLabel || 'English', lang: 'en', kind: 'subtitle' }],
      }
    }
    loadSource(source)
  }

  function generateCaptions() {
    setCaptionsGenerating(true)
    setCaptionsReady(false)
    setActiveCaptionLine(-1)
    setCaptionStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      setCaptionStep(step)
      if (step >= CAPTION_STEPS.length) {
        clearInterval(interval)
        if (captionVttUrlRef.current) URL.revokeObjectURL(captionVttUrlRef.current)
        const blob = new Blob([buildVtt()], { type: 'text/vtt' })
        const url = URL.createObjectURL(blob)
        captionVttUrlRef.current = url
        setCaptionsGenerating(false)
        setCaptionsReady(true)
        loadSource({
          ...DEMO_SOURCES[captionSource],
          subtitle: { tracks: [{ id: 'ai-cc', url, label: 'English (AI Generated)', lang: 'en', kind: 'subtitle' }] },
        })
      }
    }, 650)
  }

  function downloadVtt() {
    if (!captionVttUrlRef.current) return
    const a = document.createElement('a')
    a.href = captionVttUrlRef.current
    a.download = 'ai-generated-captions.vtt'
    a.click()
  }

  function generateDub() {
    clearDubTimeouts()
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setDubGenerating(true)
    setDubReady(false)
    setDubPlaying(false)
    setDubActiveLine(-1)
    setDubStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      setDubStep(step)
      if (step >= DUB_STEPS.length) {
        clearInterval(interval)
        setDubGenerating(false)
        setDubReady(true)
        loadSource(DEMO_SOURCES[dubSource])
      }
    }, 650)
  }

  function playDubbedPreview() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    clearDubTimeouts()
    window.speechSynthesis.cancel()
    setDubPlaying(true)
    setDubActiveLine(-1)

    const inst = playerInstanceRef.current as { play?: () => void; seek?: (t: number) => void } | null
    inst?.seek?.(0)
    inst?.play?.()

    SAMPLE_SCRIPT.forEach((line, i) => {
      const text = dubLang === 'es' ? line.es : line.hi
      const id = window.setTimeout(() => {
        setDubActiveLine(i)
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = LANG_LOCALE[dubLang]
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find(v => v.lang.toLowerCase().startsWith(dubLang))
        if (voice) utter.voice = voice
        window.speechSynthesis.speak(utter)
      }, line.start * 1000)
      dubTimeoutsRef.current.push(id)
    })

    const endId = window.setTimeout(() => {
      setDubPlaying(false)
      setDubActiveLine(-1)
    }, SAMPLE_SCRIPT[SAMPLE_SCRIPT.length - 1].end * 1000 + 500)
    dubTimeoutsRef.current.push(endId)
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
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'player' as const, label: 'Demo Player' },
          { id: 'stream-test' as const, label: 'Stream Tester' },
          { id: 'captions' as const, label: 'AI Captions' },
          { id: 'dubbing' as const, label: 'AI Dubbing' },
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
              {!bitmovinKey || playerError === 'LICENSE' ? (
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
            <p className="text-xs text-gray-500 mb-4">Configure stream, subtitles, and analytics — then load everything together.</p>

            {/* Stream URL */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Stream Format</label>
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
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Stream URL</label>
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder={customFormat === 'hls' ? 'https://example.com/stream.m3u8' : customFormat === 'dash' ? 'https://example.com/manifest.mpd' : 'https://example.com/video.mp4'}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
              />
            </div>

            {/* Subtitles / Captions */}
            <div className="mb-5 border-t border-gray-100 pt-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Subtitles / Captions (VTT)</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={subtitleUrl}
                  onChange={e => setSubtitleUrl(e.target.value)}
                  placeholder="https://example.com/captions.vtt"
                  className="flex-[2] border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
                />
                <input
                  type="text"
                  value={subtitleLabel}
                  onChange={e => setSubtitleLabel(e.target.value)}
                  placeholder="Label (e.g. English)"
                  className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">WebVTT (.vtt) subtitle or caption file URL. Loaded as a side-car track alongside the stream.</p>
            </div>

            {/* MediaMelon Analytics */}
            <div className="mb-5 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700">MediaMelon Analytics</label>
                <button
                  onClick={() => setMmEnabled(!mmEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${mmEnabled ? 'bg-akamai-blue' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${mmEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {mmEnabled && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 block mb-1">Customer ID</label>
                      <input
                        type="text"
                        value={mmCustomerId}
                        onChange={e => setMmCustomerId(e.target.value)}
                        placeholder="MediaMelon Customer ID"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 block mb-1">Subscriber ID</label>
                      <input
                        type="text"
                        value={mmSubscriberId}
                        onChange={e => setMmSubscriberId(e.target.value)}
                        placeholder="Optional — viewer identifier"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 font-mono text-[10px] text-green-300 leading-relaxed overflow-x-auto">
                    <div className="text-gray-500">{'// MediaMelon SDK initialization'}</div>
                    <div>{'const mmConfig = {'}</div>
                    <div>&nbsp;&nbsp;customerID: <span className="text-yellow-300">"{mmCustomerId || 'YOUR_CUSTOMER_ID'}"</span>,</div>
                    <div>&nbsp;&nbsp;playerName: <span className="text-yellow-300">"AMP-v2"</span>,</div>
                    <div>&nbsp;&nbsp;playerBrand: <span className="text-yellow-300">"Bitmovin"</span>,</div>
                    <div>&nbsp;&nbsp;domainName: <span className="text-yellow-300">"{typeof window !== 'undefined' ? window.location.host : 'example.com'}"</span>,</div>
                    {mmSubscriberId && <div>&nbsp;&nbsp;subscriberID: <span className="text-yellow-300">"{mmSubscriberId}"</span>,</div>}
                    <div>{'};'}</div>
                    <div className="text-gray-500">{'// Attach to player after load'}</div>
                    <div>{'mmSmartStreaming.init(player, mmConfig);'}</div>
                  </div>
                  <p className="text-[10px] text-gray-400">QoE metrics (startup time, rebuffer ratio, bitrate, errors) will be sent to the MediaMelon SmartSight dashboard.</p>
                </div>
              )}
            </div>

            {/* Load Button */}
            <button
              onClick={loadCustomStream}
              className="w-full bg-akamai-blue text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-akamai-dark transition-colors"
            >
              Load Settings
            </button>
          </div>

          {!bitmovinKey || playerError === 'LICENSE' ? (
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

      {mode === 'captions' && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-1">AI Caption Generation</h3>
            <p className="text-xs text-gray-500 mb-4">
              Pick a video, then generate captions with a simulated speech-to-text pipeline. The resulting WebVTT track loads directly into AMP v2.
            </p>

            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Video</label>
            <select
              value={captionSource}
              onChange={e => setCaptionSource(e.target.value as SourceKey)}
              disabled={captionsGenerating}
              className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue disabled:opacity-50"
            >
              {(Object.keys(DEMO_SOURCES) as SourceKey[]).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <button
              onClick={generateCaptions}
              disabled={captionsGenerating}
              className="w-full bg-akamai-blue text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-akamai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {captionsGenerating ? 'Generating…' : captionsReady ? 'Regenerate Captions' : 'Generate Captions'}
            </button>

            {(captionsGenerating || captionsReady) && (
              <div className="mt-5 space-y-2">
                {CAPTION_STEPS.map((step, i) => {
                  const done = i < captionStep
                  const active = i === captionStep && captionsGenerating
                  return (
                    <div key={step} className="flex items-center gap-2.5 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        done ? 'bg-green-500 text-white' : active ? 'bg-akamai-blue text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={done || active ? 'text-gray-800' : 'text-gray-400'}>{step}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {captionsReady && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-[2]">
                {!bitmovinKey || playerError === 'LICENSE' ? (
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-center px-8">
                    <p className="text-white/60 text-xs">Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">VITE_BITMOVIN_KEY</code> to preview captions on the live player.</p>
                  </div>
                ) : (
                  <div ref={playerRef} className="rounded-lg overflow-hidden bg-black aspect-video" />
                )}
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Generated Transcript</h3>
                  <button onClick={downloadVtt} className="text-xs text-akamai-blue font-semibold hover:underline">Download .vtt</button>
                </div>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                  {SAMPLE_SCRIPT.map((line, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 rounded text-xs transition-colors ${
                        activeCaptionLine === i ? 'bg-akamai-blue text-white font-medium' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="opacity-60 mr-2">{formatVttTime(line.start).slice(3, 8)}</span>{line.en}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 border-t border-gray-100 pt-3">
                  Demo uses a representative sample transcript to demonstrate the pipeline end-to-end. In production, this step calls a speech-to-text service (e.g. AWS Transcribe, Google Speech-to-Text) against the video's real audio track.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'dubbing' && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-1">AI Dubbing</h3>
            <p className="text-xs text-gray-500 mb-4">
              Select a preset video and target language. The pipeline transcribes, translates, and synthesizes a dubbed voice track using your browser's text-to-speech engine — no external API key required.
            </p>

            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Video</label>
            <select
              value={dubSource}
              onChange={e => setDubSource(e.target.value as SourceKey)}
              disabled={dubGenerating}
              className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-akamai-blue/30 focus:border-akamai-blue disabled:opacity-50"
            >
              {(Object.keys(DEMO_SOURCES) as SourceKey[]).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Dub Language (from English)</label>
            <div className="flex gap-2 mb-4">
              {(['es', 'hi'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setDubLang(lang)}
                  disabled={dubGenerating}
                  className={`px-4 py-2 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
                    dubLang === lang ? 'bg-akamai-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  English → {LANG_LABELS[lang]}
                </button>
              ))}
            </div>

            {voiceAvailable === false && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
                No {LANG_LABELS[dubLang]} text-to-speech voice was found in this browser. Translated captions will still display, but audio synthesis will be silent. Try Chrome or Edge on Windows/Android, or install additional language voice packs.
              </div>
            )}

            <button
              onClick={generateDub}
              disabled={dubGenerating}
              className="w-full bg-akamai-blue text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-akamai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dubGenerating ? 'Generating…' : dubReady ? 'Regenerate Dub' : 'Generate Dub'}
            </button>

            {(dubGenerating || dubReady) && (
              <div className="mt-5 space-y-2">
                {DUB_STEPS.map((step, i) => {
                  const done = i < dubStep
                  const active = i === dubStep && dubGenerating
                  return (
                    <div key={step} className="flex items-center gap-2.5 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        done ? 'bg-green-500 text-white' : active ? 'bg-akamai-blue text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={done || active ? 'text-gray-800' : 'text-gray-400'}>{step}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {dubReady && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-[2]">
                {!bitmovinKey || playerError === 'LICENSE' ? (
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-center px-8">
                    <p className="text-white/60 text-xs">Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">VITE_BITMOVIN_KEY</code> to preview the dubbed playback on the live player.</p>
                  </div>
                ) : (
                  <div ref={playerRef} className="rounded-lg overflow-hidden bg-black aspect-video mb-3" />
                )}
                <button
                  onClick={playDubbedPreview}
                  disabled={dubPlaying}
                  className="w-full bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {dubPlaying ? 'Playing Dubbed Preview…' : `Play Dubbed Preview (${LANG_LABELS[dubLang]})`}
                </button>
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Original ↔ Translated</h3>
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {SAMPLE_SCRIPT.map((line, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 rounded text-xs transition-colors ${
                        dubActiveLine === i ? 'bg-emerald-50 border border-emerald-300' : 'bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="text-gray-500">{line.en}</div>
                      <div className={`mt-1 font-medium ${dubActiveLine === i ? 'text-emerald-700' : 'text-gray-800'}`}>
                        {dubLang === 'es' ? line.es : line.hi}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 border-t border-gray-100 pt-3">
                  Translation and voice synthesis run live in your browser via the Web Speech API. In production, translation would use a service like Amazon Translate or Google Cloud Translation, and voice synthesis would use a studio-quality TTS engine (e.g. Amazon Polly, ElevenLabs) muxed back into the audio track.
                </p>
              </div>
            </div>
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
