import { useState, useMemo } from 'react'
import { CLOUDINARY_DEMOS, DEMO_CATEGORIES, CATEGORY_COLORS } from './data/cloudinaryDemos'
import type { DemoCategory } from './data/cloudinaryDemos'
import QualityLab from './components/QualityLab'

const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || 'https://mediademo.fde-demo.com'

type Filter = DemoCategory | 'All' | 'Media Relevant'

export default function CloudinaryApp() {
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')

  const visibleDemos = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CLOUDINARY_DEMOS.filter(d => {
      if (filter === 'Media Relevant' && !d.mediaRelevant) return false
      if (filter !== 'All' && filter !== 'Media Relevant' && d.category !== filter) return false
      if (q && !d.title.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [filter, query])

  const countFor = (f: Filter) => {
    if (f === 'All') return CLOUDINARY_DEMOS.length
    if (f === 'Media Relevant') return CLOUDINARY_DEMOS.filter(d => d.mediaRelevant).length
    return CLOUDINARY_DEMOS.filter(d => d.category === f).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-[#3448C5] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg tracking-tight">Cloudinary</span>
          <span className="text-white/50">|</span>
          <span className="text-white/90 text-sm font-medium">Media Experience Demos</span>
        </div>
        <a
          href={MAIN_SITE_URL}
          className="text-white/80 hover:text-white text-xs font-medium whitespace-nowrap transition-colors"
        >
          ← Akamai Media Solutions Demo
        </a>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#3448C5] to-[#1B2559] rounded-xl py-10 px-6 text-center text-white">
          <h1 className="text-2xl md:text-3xl font-bold">Cloudinary Video &amp; Media Manager</h1>
          <p className="mt-2 text-sm text-white/70 max-w-2xl mx-auto">
            AI-powered video and image management, transformation, and delivery — from upload to optimized playback at scale.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-lg py-3">
              <div className="text-xl font-bold">{CLOUDINARY_DEMOS.length}</div>
              <div className="text-[11px] text-white/60 mt-0.5">Live Demos</div>
            </div>
            <div className="bg-white/10 rounded-lg py-3">
              <div className="text-xl font-bold">1B+</div>
              <div className="text-[11px] text-white/60 mt-0.5">Video Assets Managed</div>
            </div>
            <div className="bg-white/10 rounded-lg py-3">
              <div className="text-xl font-bold">500M+</div>
              <div className="text-[11px] text-white/60 mt-0.5">Daily Video Requests</div>
            </div>
            <div className="bg-white/10 rounded-lg py-3">
              <div className="text-xl font-bold">8</div>
              <div className="text-[11px] text-white/60 mt-0.5">Demo Categories</div>
            </div>
          </div>
        </div>

        {/* Demo Catalog */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Demo Catalog</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Interactive demos hosted by Cloudinary — each opens in a new tab.
              </p>
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search demos…"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#3448C5]/30 focus:border-[#3448C5]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(['All', 'Media Relevant', ...DEMO_CATEGORIES] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[#3448C5] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f} <span className="opacity-60">{countFor(f)}</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          {visibleDemos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No demos match that search.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDemos.map(demo => (
                <a
                  key={demo.title}
                  href={demo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col border border-gray-200 rounded-lg p-4 hover:border-[#3448C5] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CATEGORY_COLORS[demo.category]}`}>
                      {demo.category}
                    </span>
                    {demo.mediaRelevant && (
                      <span className="text-[10px] font-semibold text-[#3448C5] whitespace-nowrap">★ Media</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-800 group-hover:text-[#3448C5]">{demo.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 flex-1">{demo.description}</p>
                  <span className="text-[10px] text-[#3448C5] mt-3 font-medium">Open demo →</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quality Lab */}
        <QualityLab />

        {/* Key Capabilities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Key Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {[
              { title: 'Adaptive Streaming', desc: 'Automatic ABR transcoding into HLS and MPEG-DASH for smooth playback across all network conditions.' },
              { title: 'AI-Powered Cropping', desc: 'Intelligent gravity-based cropping that detects subjects and optimizes framing for different aspect ratios (16:9, 9:16, 1:1).' },
              { title: 'On-the-Fly Transformations', desc: 'URL-based API transforms video in real time: resize, trim, add overlays, change format, adjust quality — no re-encoding pipeline needed.' },
              { title: 'Live Streaming', desc: 'Create and manage live streams for websites and mobile apps. Simulcast to social platforms. Auto-record for VOD replay.' },
              { title: 'Video Generation', desc: 'Generate video from images, create preview thumbnails, animated GIFs, and video montages programmatically.' },
              { title: 'Content Moderation', desc: 'AI-based content analysis for automatic moderation, NSFW detection, and brand safety compliance.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <div className="w-1.5 shrink-0 rounded-full bg-[#3448C5] mt-1" style={{ height: '14px' }} />
                <div>
                  <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* URL-based Transformation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">URL-Based Video Transformation</h2>
          <p className="text-sm text-gray-500 mb-4">
            Cloudinary transforms video on the fly via URL parameters — no re-encoding pipeline required.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="text-gray-400 mb-2">{'//'} Original video</div>
            <div className="text-green-300 mb-3">
              https://res.cloudinary.com/<span className="text-yellow-300">cloud_name</span>/video/upload/<span className="text-yellow-300">sample.mp4</span>
            </div>
            <div className="text-gray-400 mb-2">{'//'} Resized to 720p, auto-quality, delivered as HLS</div>
            <div className="text-green-300 mb-3">
              https://res.cloudinary.com/<span className="text-yellow-300">cloud_name</span>/video/upload/<span className="text-cyan-300">w_1280,h_720,c_fill,q_auto</span>/<span className="text-yellow-300">sample.m3u8</span>
            </div>
            <div className="text-gray-400 mb-2">{'//'} With text overlay + 9:16 crop for mobile</div>
            <div className="text-green-300">
              https://res.cloudinary.com/<span className="text-yellow-300">cloud_name</span>/video/upload/<span className="text-cyan-300">w_1080,h_1920,c_fill,g_auto</span>/<span className="text-pink-300">l_text:Arial_48_bold:Breaking%20News,co_white,g_north,y_50</span>/<span className="text-yellow-300">sample.mp4</span>
            </div>
          </div>
        </div>

        {/* SDK Integration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">SDK Integration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Upload API</h4>
              <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">{`import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'your_cloud',
  api_key: 'your_key',
  api_secret: 'your_secret',
});

const result = await cloudinary.uploader
  .upload('video.mp4', {
    resource_type: 'video',
    eager: [
      { streaming_profile: 'hd',
        format: 'm3u8' },
      { streaming_profile: 'hd',
        format: 'mpd' },
    ],
    eager_async: true,
  });`}</pre>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Video Player Embed</h4>
              <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">{`<script src="https://unpkg.com/
  cloudinary-video-player/dist/
  cld-video-player.min.js">
</script>

<video
  id="player"
  data-cld-public-id="sample"
  class="cld-video-player"
  controls>
</video>

<script>
  const player = cloudinary
    .videoPlayer('player', {
      cloud_name: 'your_cloud',
      autoplay: true,
      muted: true,
      sourceTypes: ['hls', 'dash'],
    });
</script>`}</pre>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Documentation &amp; Resources</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Video Transformations', desc: 'Resize, crop, overlay, effects, and format conversion', url: 'https://cloudinary.com/documentation/video_transformations' },
              { title: 'Adaptive Streaming', desc: 'HLS and MPEG-DASH ABR delivery', url: 'https://cloudinary.com/documentation/video_manipulation_and_delivery#adaptive_bitrate_streaming' },
              { title: 'Video Player', desc: 'Embeddable player with analytics and ads', url: 'https://cloudinary.com/documentation/cloudinary_video_player' },
              { title: 'Upload API', desc: 'Server and client-side upload workflows', url: 'https://cloudinary.com/documentation/upload_videos' },
              { title: 'Live Streaming', desc: 'Create and manage live streams', url: 'https://cloudinary.com/documentation/live_streaming' },
              { title: 'SDKs & Quick Starts', desc: 'Node.js, Python, Ruby, PHP, Java, React', url: 'https://cloudinary.com/documentation/sdks' },
            ].map(link => (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#3448C5] hover:bg-blue-50/30 transition-colors group"
              >
                <h4 className="font-semibold text-sm text-gray-800 group-hover:text-[#3448C5]">{link.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
                <span className="text-[10px] text-[#3448C5] mt-2 block">cloudinary.com →</span>
              </a>
            ))}
          </div>
        </div>

        {/* Akamai + Cloudinary */}
        <div className="bg-gradient-to-r from-akamai-blue to-[#3448C5] rounded-lg p-6 text-white">
          <h3 className="font-bold text-lg mb-2">Akamai + Cloudinary</h3>
          <p className="text-sm text-white/80 max-w-3xl">
            Cloudinary handles video management, transformation, and optimization at the origin. Akamai AMD delivers the optimized content globally with edge caching, low-latency streaming, and TrafficPeak analytics — together providing an end-to-end media pipeline from upload to playback.
          </p>
          <a
            href={MAIN_SITE_URL}
            className="inline-block mt-4 bg-white text-[#3448C5] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Explore Akamai Media Solutions →
          </a>
        </div>
      </main>
    </div>
  )
}
