export default function JITPArchDiagram() {
  return (
    <svg viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <defs>
        <marker id="jitpArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#0071ce" />
        </marker>
      </defs>

      {/* Title */}
      <text x="500" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0071ce">VOD with Just-In-Time Packaging (JITP)</text>

      {/* Akamai Core Region box */}
      <rect x="20" y="35" width="640" height="145" rx="8" fill="#f9fafb" stroke="#0071ce" strokeDasharray="4" />
      <text x="340" y="52" textAnchor="middle" fontSize="9" fill="#0071ce">Akamai Core Region</text>

      {/* Watch Folder */}
      <rect x="40" y="70" width="100" height="80" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="90" y="100" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Watch Folder</text>
      <text x="90" y="118" textAnchor="middle" fontSize="8" fill="#888">Object Storage</text>

      {/* Arrow */}
      <line x1="140" y1="110" x2="170" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#jitpArrow)" />

      {/* VOD Transcoder */}
      <rect x="170" y="70" width="110" height="80" rx="6" fill="#e8f4fd" stroke="#0071ce" />
      <text x="225" y="105" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">VOD Transcoder</text>
      <text x="225" y="122" textAnchor="middle" fontSize="8" fill="#0071ce">LKE Cluster</text>

      {/* Arrow */}
      <line x1="280" y1="110" x2="310" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#jitpArrow)" />

      {/* MP4 Output */}
      <rect x="310" y="70" width="100" height="80" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="360" y="100" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">MP4 Output</text>
      <text x="360" y="118" textAnchor="middle" fontSize="8" fill="#888">Object Storage</text>

      {/* Arrow */}
      <line x1="410" y1="110" x2="440" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#jitpArrow)" />

      {/* JITP Packager */}
      <rect x="440" y="65" width="120" height="90" rx="6" fill="#e8f4fd" stroke="#0071ce" strokeWidth="2" />
      <text x="500" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0071ce">JITP</text>
      <text x="500" y="117" textAnchor="middle" fontSize="9" fill="#0071ce">Packager</text>
      <text x="500" y="135" textAnchor="middle" fontSize="8" fill="#0071ce">LKE Cluster</text>

      {/* Arrow to CDN */}
      <line x1="560" y1="110" x2="690" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#jitpArrow)" />

      {/* Akamai CDN */}
      <rect x="690" y="65" width="120" height="80" rx="8" fill="#0071ce" />
      <text x="750" y="98" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">AMD</text>
      <text x="750" y="116" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.8)">CDN Delivery</text>

      {/* Arrow to Clients */}
      <line x1="810" y1="105" x2="850" y2="105" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#jitpArrow)" />

      {/* Clients */}
      <rect x="850" y="55" width="110" height="100" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="905" y="80" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Clients</text>
      <text x="905" y="100" textAnchor="middle" fontSize="9" fill="#666">📺 Smart TV</text>
      <text x="905" y="116" textAnchor="middle" fontSize="9" fill="#666">📱 Mobile</text>
      <text x="905" y="132" textAnchor="middle" fontSize="9" fill="#666">🎮 Console</text>
      <text x="905" y="148" textAnchor="middle" fontSize="9" fill="#0071ce" fontWeight="500">AMP v2</text>
    </svg>
  )
}
