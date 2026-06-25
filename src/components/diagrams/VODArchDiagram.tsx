export default function VODArchDiagram() {
  return (
    <svg viewBox="0 0 900 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <defs>
        <marker id="vodArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#0071ce" />
        </marker>
      </defs>

      {/* Title */}
      <text x="450" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0071ce">VOD Reference Architecture</text>

      {/* Akamai Core Region box */}
      <rect x="30" y="35" width="530" height="145" rx="8" fill="#f9fafb" stroke="#0071ce" strokeDasharray="4" />
      <text x="295" y="52" textAnchor="middle" fontSize="9" fill="#0071ce">Akamai Core Region</text>

      {/* Watch Folder */}
      <rect x="50" y="70" width="110" height="80" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="105" y="100" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">Watch Folder</text>
      <text x="105" y="118" textAnchor="middle" fontSize="9" fill="#888">Object Storage</text>

      {/* Arrow */}
      <line x1="160" y1="110" x2="195" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#vodArrow)" />

      {/* VOD Transcoder */}
      <rect x="195" y="70" width="120" height="80" rx="6" fill="#e8f4fd" stroke="#0071ce" />
      <text x="255" y="105" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0071ce">VOD Transcoder</text>
      <text x="255" y="122" textAnchor="middle" fontSize="9" fill="#0071ce">LKE Cluster</text>

      {/* Arrow */}
      <line x1="315" y1="110" x2="350" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#vodArrow)" />

      {/* Packaged Output */}
      <rect x="350" y="70" width="110" height="80" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="405" y="100" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">Packaged</text>
      <text x="405" y="118" textAnchor="middle" fontSize="9" fill="#888">Object Storage</text>

      {/* Arrow to CDN */}
      <line x1="460" y1="110" x2="610" y2="110" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#vodArrow)" />

      {/* Akamai CDN */}
      <rect x="610" y="65" width="120" height="80" rx="8" fill="#0071ce" />
      <text x="670" y="98" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Akamai CDN</text>
      <text x="670" y="116" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">AMD</text>

      {/* Arrow to Clients */}
      <line x1="730" y1="105" x2="770" y2="105" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#vodArrow)" />

      {/* Clients */}
      <rect x="770" y="55" width="110" height="100" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="825" y="80" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">Clients</text>
      <text x="825" y="100" textAnchor="middle" fontSize="9" fill="#666">📺 Smart TV</text>
      <text x="825" y="116" textAnchor="middle" fontSize="9" fill="#666">📱 Mobile</text>
      <text x="825" y="132" textAnchor="middle" fontSize="9" fill="#666">🎮 Console</text>
      <text x="825" y="148" textAnchor="middle" fontSize="9" fill="#0071ce" fontWeight="500">AMP v2</text>
    </svg>
  )
}
