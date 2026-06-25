import { useState } from 'react'
import { encodingProfile, abrLadder, featureTags } from '../../data/encodingConfig'

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-700 mb-2">{title}</h4>
      <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">
        {code}
      </pre>
    </div>
  )
}

type WorkflowMode = 'vod' | 'live'

export default function EncodingTab() {
  const [mode, setMode] = useState<WorkflowMode>('vod')
  const [ingestUrl, setIngestUrl] = useState('')
  const [vodFile, setVodFile] = useState('')

  return (
    <div className="space-y-6">
      {/* Encoding Concepts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Video Encoding</h3>
        <p className="text-sm text-gray-500 mb-4">
          The encoding process transforms source video into multiple adaptive bitrate renditions, packages them into streaming formats, and prepares manifests for CDN delivery.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Transcoding</h4>
            <p className="text-xs text-gray-600">Converts video from one codec/resolution to another. Produces the ABR ladder renditions (4K → 360p) for adaptive streaming.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Packaging</h4>
            <p className="text-xs text-gray-600">Segments transcoded output into streaming-ready chunks and generates manifests (.m3u8 for HLS, .mpd for DASH) that players consume.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Per-Title Encoding</h4>
            <p className="text-xs text-gray-600">Analyzes content complexity per title to optimize the ABR ladder. Simple scenes get lower bitrates; complex scenes get more — saving bandwidth without quality loss.</p>
          </div>
        </div>
      </div>

      {/* Bitmovin Encoding on Akamai Cloud */}
      <div className="bg-white rounded-lg border-2 border-bitmovin-purple/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-bitmovin-purple text-white px-3 py-1 rounded text-xs font-bold">BITMOVIN</div>
          <h3 className="font-semibold text-gray-800">Encoding on Akamai Cloud</h3>
        </div>

        {/* Bitmovin Architecture Diagram */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <svg viewBox="0 0 900 160" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <defs>
              <marker id="bmArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#2d1b69" />
              </marker>
            </defs>
            {/* Source */}
            <rect x="10" y="40" width="110" height="80" rx="6" fill="#f0f4f8" stroke="#ccc" />
            <text x="65" y="72" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">Source</text>
            <text x="65" y="90" textAnchor="middle" fontSize="9" fill="#888">SRT / RTMP / S3</text>
            <text x="65" y="106" textAnchor="middle" fontSize="9" fill="#888">Object Storage</text>
            <line x1="120" y1="80" x2="170" y2="80" stroke="#2d1b69" strokeWidth="2" markerEnd="url(#bmArrow)" />
            {/* Bitmovin Encoder */}
            <rect x="170" y="30" width="200" height="100" rx="8" fill="#2d1b69" />
            <text x="270" y="62" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">Bitmovin Encoder</text>
            <text x="270" y="80" textAnchor="middle" fontSize="10" fill="#c4b5fd">Transcoding + Packaging</text>
            <text x="270" y="96" textAnchor="middle" fontSize="9" fill="#c4b5fd">Per-Title • Multi-Codec</text>
            <text x="270" y="112" textAnchor="middle" fontSize="9" fill="#c4b5fd">AKAMAI_CLOUD infra</text>
            <line x1="370" y1="80" x2="420" y2="80" stroke="#2d1b69" strokeWidth="2" markerEnd="url(#bmArrow)" />
            {/* Output */}
            <rect x="420" y="35" width="120" height="90" rx="6" fill="#f0e6ff" stroke="#2d1b69" />
            <text x="480" y="62" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2d1b69">Output</text>
            <text x="480" y="80" textAnchor="middle" fontSize="9" fill="#5b21b6">HLS / DASH / CMAF</text>
            <text x="480" y="96" textAnchor="middle" fontSize="9" fill="#5b21b6">Manifest + Segments</text>
            <text x="480" y="112" textAnchor="middle" fontSize="9" fill="#5b21b6">→ Object Storage</text>
            <line x1="540" y1="80" x2="590" y2="80" stroke="#0071ce" strokeWidth="2" markerEnd="url(#bmArrow)" />
            {/* AMD */}
            <rect x="590" y="40" width="110" height="80" rx="8" fill="#0071ce" />
            <text x="645" y="72" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">AMD CDN</text>
            <text x="645" y="90" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.8)">Delivery</text>
            <line x1="700" y1="80" x2="740" y2="80" stroke="#0071ce" strokeWidth="2" markerEnd="url(#bmArrow)" />
            {/* Player */}
            <rect x="740" y="40" width="110" height="80" rx="6" fill="#f0f4f8" stroke="#0071ce" />
            <text x="795" y="72" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0071ce">AMP v2</text>
            <text x="795" y="90" textAnchor="middle" fontSize="9" fill="#0071ce">Playback</text>
          </svg>
        </div>

        {/* API Config */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CodeBlock title="Encoding Profile" code={encodingProfile} />
          <CodeBlock title="ABR Ladder (Per-Title Optimized)" code={abrLadder} />
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {featureTags.map(tag => (
            <span key={tag} className="bg-bitmovin-light text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>

        {/* Interactive Demo Section */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-800 mb-4">Encoding Demo</h4>

          {/* VOD / Live Selector */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('vod')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'vod' ? 'bg-bitmovin-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              VOD Encoding
            </button>
            <button
              onClick={() => setMode('live')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'live' ? 'bg-bitmovin-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Live Encoding
            </button>
          </div>

          {mode === 'vod' ? (
            <div className="bg-gray-50 rounded-lg p-5">
              <h5 className="font-semibold text-sm text-gray-700 mb-3">VOD: Transcode + Package</h5>
              <p className="text-xs text-gray-500 mb-4">
                Upload source content to Object Storage. Bitmovin encodes the file into multi-bitrate renditions, packages into HLS/DASH, and stores the output for AMD delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={vodFile}
                  onChange={e => setVodFile(e.target.value)}
                  placeholder="Enter source file path (e.g., s3://bucket/source.mp4)"
                  className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bitmovin-purple/30 focus:border-bitmovin-purple"
                />
                <button className="bg-bitmovin-purple text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                  Start VOD Encode
                </button>
              </div>
              <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
                <span>Transcoding → Multi-bitrate ABR ladder</span>
                <span>→</span>
                <span>Packaging → HLS + DASH manifests</span>
                <span>→</span>
                <span>Output → Object Storage → AMD</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-5">
              <h5 className="font-semibold text-sm text-gray-700 mb-3">Live: Ingest + Transcode + Package</h5>
              <p className="text-xs text-gray-500 mb-4">
                Provide the live stream ingest URL (SRT/RTMP). Bitmovin encodes in real-time, packages into LL-HLS/LL-DASH, and outputs to AMD for low-latency delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={ingestUrl}
                  onChange={e => setIngestUrl(e.target.value)}
                  placeholder="Enter stream ingest URL (e.g., srt://encoder.example.com:9000)"
                  className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bitmovin-purple/30 focus:border-bitmovin-purple"
                />
                <button className="bg-bitmovin-purple text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                  Start Live Encode
                </button>
              </div>
              <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
                <span>Ingest → SRT / RTMP</span>
                <span>→</span>
                <span>Transcoding → Real-time ABR</span>
                <span>→</span>
                <span>Packaging → LL-HLS / LL-DASH</span>
                <span>→</span>
                <span>AMD → AMP v2</span>
              </div>
            </div>
          )}

          {/* Playback Preview */}
          <div className="mt-5 bg-gray-900 rounded-lg aspect-video max-w-2xl mx-auto flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-white/30 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <p className="text-white/60 text-sm font-medium">AMP v2 Playback</p>
              <p className="text-white/30 text-xs mt-1">
                {mode === 'vod' ? 'Encoded VOD content will play here via AMD' : 'Live encoded stream will play here via AMD'}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/60 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="flex-1 h-1 bg-white/20 rounded-full" />
              <span className="text-white/40 text-[10px]">{mode === 'live' ? 'LIVE' : '0:00 / --:--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
