export default function CloudinaryTab() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#3448C5] to-[#1B2559] rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Cloudinary Video Manager</h1>
        <p className="mt-2 text-sm text-white/70 max-w-2xl mx-auto">
          AI-powered video management, transformation, and delivery — from upload to optimized playback at scale.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-2xl mb-2">📁</div>
          <h3 className="font-semibold text-gray-800 mb-2">Media Library &amp; DAM</h3>
          <p className="text-sm text-gray-600">
            Centralized digital asset management for video, images, and rich media. Upload, organize, tag, search, and manage assets with AI-powered auto-tagging and content moderation.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-2xl mb-2">🎬</div>
          <h3 className="font-semibold text-gray-800 mb-2">Video Transformations</h3>
          <p className="text-sm text-gray-600">
            URL-based on-the-fly transformations — resize, crop, transcode, overlay text/images, concatenate clips, add effects, and optimize quality. No pre-processing required.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-2xl mb-2">📺</div>
          <h3 className="font-semibold text-gray-800 mb-2">Video Player</h3>
          <p className="text-sm text-gray-600">
            Configurable, embeddable video player with adaptive streaming (HLS/DASH), shoppable overlays, captions, and analytics. Optimized for all devices and bandwidths.
          </p>
        </div>
      </div>

      {/* Key Capabilities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Key Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { title: 'Adaptive Streaming', desc: 'Automatic ABR transcoding into HLS and MPEG-DASH for smooth playback across all network conditions.' },
            { title: 'AI-Powered Cropping', desc: 'Intelligent gravity-based cropping that detects subjects and optimizes framing for different aspect ratios (16:9, 9:16, 1:1).' },
            { title: 'On-the-Fly Transformations', desc: 'URL-based API transforms video in real-time: resize, trim, add overlays, change format, adjust quality — no re-encoding pipeline needed.' },
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

      {/* URL-based Transformation Example */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">URL-Based Video Transformation</h2>
        <p className="text-sm text-gray-500 mb-4">
          Cloudinary transforms video on-the-fly via URL parameters — no re-encoding pipeline required.
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

      {/* Documentation Links */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Documentation &amp; Resources</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Video Transformations', desc: 'Resize, crop, overlay, effects, and format conversion', url: 'https://cloudinary.com/documentation/video_transformations' },
            { title: 'Adaptive Streaming', desc: 'HLS and MPEG-DASH ABR delivery', url: 'https://cloudinary.com/documentation/video_manipulation_and_delivery#adaptive_bitrate_streaming' },
            { title: 'Video Player', desc: 'Embeddable player with analytics and ads', url: 'https://cloudinary.com/documentation/cloudinary_video_player' },
            { title: 'Upload API', desc: 'Server and client-side upload workflows', url: 'https://cloudinary.com/documentation/upload_videos' },
            { title: 'Live Streaming', desc: 'Create and manage live streams', url: 'https://cloudinary.com/documentation/live_streaming' },
            { title: 'SDKs &amp; Quick Starts', desc: 'Node.js, Python, Ruby, PHP, Java, React', url: 'https://cloudinary.com/documentation/sdks' },
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
      </div>
    </div>
  )
}
