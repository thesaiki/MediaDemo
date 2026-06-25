import { formats, comparisonData, codecData } from '../../data/streamingFormats'

const colorMap: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-50',
  purple: 'border-purple-500 bg-purple-50',
  green: 'border-green-500 bg-green-50',
  orange: 'border-orange-500 bg-orange-50',
}

const nameColorMap: Record<string, string> = {
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
}

export default function StreamingFormatsTab() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-akamai-blue to-akamai-dark rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Media Delivery 101</h1>
        <p className="mt-2 text-sm text-white/70 max-w-2xl mx-auto">
          Core media fundamentals — containers, codecs, streaming protocols, and quality metrics that power modern video delivery.
        </p>
      </div>

      {/* Core Concepts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Core Media Concepts</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-akamai-blue mb-2">Container Formats</h3>
            <p className="text-sm text-gray-600 mb-3">Containers wrap encoded video, audio, and metadata into a single file for transport and playback.</p>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between"><span className="font-medium">MP4 (ISOBMFF)</span><span className="text-gray-400">VOD standard</span></div>
              <div className="flex justify-between"><span className="font-medium">fMP4</span><span className="text-gray-400">Fragmented, streaming</span></div>
              <div className="flex justify-between"><span className="font-medium">MPEG-TS (.ts)</span><span className="text-gray-400">Legacy HLS segments</span></div>
              <div className="flex justify-between"><span className="font-medium">WebM</span><span className="text-gray-400">VP9/AV1, web-native</span></div>
              <div className="flex justify-between"><span className="font-medium">MKV</span><span className="text-gray-400">Flexible, multi-track</span></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-akamai-blue mb-2">Video Codecs</h3>
            <p className="text-sm text-gray-600 mb-3">Codecs compress raw video frames. Newer codecs achieve better quality at lower bitrates.</p>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between"><span className="font-medium">H.264 / AVC</span><span className="text-gray-400">Universal</span></div>
              <div className="flex justify-between"><span className="font-medium">H.265 / HEVC</span><span className="text-gray-400">50% smaller, 4K/HDR</span></div>
              <div className="flex justify-between"><span className="font-medium">AV1</span><span className="text-gray-400">Royalty-free, 30%+ smaller</span></div>
              <div className="flex justify-between"><span className="font-medium">VP9</span><span className="text-gray-400">Google, YouTube</span></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-akamai-blue mb-2">Audio Codecs</h3>
            <p className="text-sm text-gray-600 mb-3">Audio codecs compress audio tracks. Multiple tracks enable multi-language and accessibility.</p>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between"><span className="font-medium">AAC</span><span className="text-gray-400">Universal standard</span></div>
              <div className="flex justify-between"><span className="font-medium">Opus</span><span className="text-gray-400">Low-latency, WebRTC</span></div>
              <div className="flex justify-between"><span className="font-medium">Dolby AC-3/EC-3</span><span className="text-gray-400">Surround sound</span></div>
              <div className="flex justify-between"><span className="font-medium">DTS</span><span className="text-gray-400">Premium audio</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ABR Streaming Explained */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Adaptive Bitrate (ABR) Streaming</h2>
        <p className="text-sm text-gray-500 mb-4">
          ABR dynamically switches between quality levels based on network conditions and device capability, ensuring smooth playback without buffering.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 text-xs mb-4 flex-wrap justify-center">
            <div className="bg-white border border-gray-200 rounded px-3 py-2 text-center">
              <div className="font-semibold text-gray-700">Source Video</div>
              <div className="text-gray-400">Raw / Mezzanine</div>
            </div>
            <span className="text-akamai-blue font-bold">→</span>
            <div className="bg-white border border-gray-200 rounded px-3 py-2 text-center">
              <div className="font-semibold text-gray-700">Encoder</div>
              <div className="text-gray-400">Multi-bitrate</div>
            </div>
            <span className="text-akamai-blue font-bold">→</span>
            <div className="flex flex-col gap-1">
              <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-medium text-blue-700">4K @ 12 Mbps</div>
              <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-medium text-blue-700">1080p @ 4.5 Mbps</div>
              <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-medium text-blue-700">720p @ 2.4 Mbps</div>
              <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-medium text-blue-700">480p @ 1.2 Mbps</div>
              <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-medium text-blue-700">360p @ 600 Kbps</div>
            </div>
            <span className="text-akamai-blue font-bold">→</span>
            <div className="bg-white border border-gray-200 rounded px-3 py-2 text-center">
              <div className="font-semibold text-gray-700">Manifest</div>
              <div className="text-gray-400">.m3u8 / .mpd</div>
            </div>
            <span className="text-akamai-blue font-bold">→</span>
            <div className="bg-akamai-blue text-white rounded px-3 py-2 text-center">
              <div className="font-semibold">CDN</div>
              <div className="text-white/70">AMD</div>
            </div>
            <span className="text-akamai-blue font-bold">→</span>
            <div className="bg-white border border-gray-200 rounded px-3 py-2 text-center">
              <div className="font-semibold text-gray-700">Player</div>
              <div className="text-gray-400">AMP v2</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            The player requests the manifest, evaluates bandwidth, and switches between renditions seamlessly. Segments are typically 2-6 seconds.
          </p>
        </div>
      </div>

      {/* Streaming Protocol Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Streaming Protocols</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {formats.map(f => (
            <div key={f.name} className={`rounded-lg border-l-4 p-5 ${colorMap[f.color]}`}>
              <h3 className={`text-lg font-bold ${nameColorMap[f.color]}`}>{f.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{f.fullName}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-akamai-dark text-white px-5 py-3 font-semibold text-sm">
          Protocol Comparison
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Format</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Latency</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Device Support</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">DRM</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Best Use Case</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={row.format} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-medium text-akamai-blue">{row.format}</td>
                  <td className="px-4 py-2 text-gray-600">{row.latency}</td>
                  <td className="px-4 py-2 text-gray-600">{row.deviceSupport}</td>
                  <td className="px-4 py-2 text-gray-600">{row.drmSupport}</td>
                  <td className="px-4 py-2 text-gray-600">{row.bestUseCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Codec Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-akamai-dark text-white px-5 py-3 font-semibold text-sm">
          Video Codec Comparison
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Codec</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Standard</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Compression</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Quality</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Adoption</th>
              </tr>
            </thead>
            <tbody>
              {codecData.map((row, i) => (
                <tr key={row.codec} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-medium text-gray-800">{row.codec}</td>
                  <td className="px-4 py-2 text-gray-600">{row.standard}</td>
                  <td className="px-4 py-2 text-gray-600">{row.compression}</td>
                  <td className="px-4 py-2 text-gray-600">{row.quality}</td>
                  <td className="px-4 py-2 text-gray-600">{row.adoption}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRM & Content Protection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">DRM &amp; Content Protection</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🍎</div>
            <h4 className="font-semibold text-gray-800">Apple FairPlay</h4>
            <p className="text-xs text-gray-500 mt-1">iOS, macOS, Apple TV. Required for HLS with DRM on Apple devices.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="font-semibold text-gray-800">Google Widevine</h4>
            <p className="text-xs text-gray-500 mt-1">Android, Chrome, Chromecast. L1 (hardware) for HD, L3 (software) for SD.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🪟</div>
            <h4 className="font-semibold text-gray-800">Microsoft PlayReady</h4>
            <p className="text-xs text-gray-500 mt-1">Edge, Xbox, Smart TVs. Widely supported in DASH workflows.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
