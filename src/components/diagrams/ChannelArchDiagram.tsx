export default function ChannelArchDiagram() {
  return (
    <svg viewBox="0 0 900 220" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <defs>
        <marker id="chArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#0071ce" />
        </marker>
      </defs>

      {/* Title */}
      <text x="450" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0071ce">Virtual Channel Creation Workflow</text>

      {/* Sources */}
      <rect x="20" y="55" width="110" height="55" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="75" y="78" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">VOD Assets</text>
      <text x="75" y="95" textAnchor="middle" fontSize="8" fill="#888">Object Storage</text>

      <rect x="20" y="125" width="110" height="55" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="75" y="148" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Live Feeds</text>
      <text x="75" y="165" textAnchor="middle" fontSize="8" fill="#888">RTMP / SRT</text>

      {/* Arrows to Unified Streaming */}
      <line x1="130" y1="82" x2="190" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#chArrow)" />
      <line x1="130" y1="152" x2="190" y2="125" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#chArrow)" />

      {/* Unified Streaming */}
      <rect x="190" y="75" width="150" height="85" rx="8" fill="#1a4d2e" />
      <text x="265" y="108" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Unified Streaming</text>
      <text x="265" y="126" textAnchor="middle" fontSize="10" fill="#86efac">Origin + Remix</text>
      <text x="265" y="148" textAnchor="middle" fontSize="8" fill="#86efac">unified-streaming.com</text>

      {/* Arrow */}
      <line x1="340" y1="117" x2="390" y2="117" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#chArrow)" />

      {/* SMIL Manifest */}
      <rect x="390" y="80" width="120" height="75" rx="6" fill="#e8f4fd" stroke="#0071ce" />
      <text x="450" y="110" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0071ce">SMIL Manifest</text>
      <text x="450" y="128" textAnchor="middle" fontSize="9" fill="#0071ce">Channel Schedule</text>

      {/* Arrow */}
      <line x1="510" y1="117" x2="555" y2="117" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#chArrow)" />

      {/* Output channels */}
      <rect x="555" y="70" width="110" height="36" rx="4" fill="#e8f4fd" stroke="#0071ce" />
      <text x="610" y="93" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">HLS Channel</text>
      <rect x="555" y="118" width="110" height="36" rx="4" fill="#e8f4fd" stroke="#0071ce" />
      <text x="610" y="141" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">DASH Channel</text>

      {/* Arrow */}
      <line x1="665" y1="110" x2="710" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#chArrow)" />

      {/* AMD CDN */}
      <rect x="710" y="75" width="100" height="70" rx="8" fill="#0071ce" />
      <text x="760" y="106" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">AMD CDN</text>
      <text x="760" y="122" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.8)">Delivery</text>

      {/* Arrow */}
      <line x1="810" y1="110" x2="845" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#chArrow)" />

      {/* Viewers */}
      <rect x="845" y="75" width="90" height="70" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="890" y="105" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">Viewers</text>
      <text x="890" y="122" textAnchor="middle" fontSize="9" fill="#666">Multi-screen</text>
    </svg>
  )
}
