export default function LiveArchDiagram() {
  return (
    <svg viewBox="0 0 920 340" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <defs>
        <marker id="liveArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#0071ce" />
        </marker>
      </defs>

      {/* Title */}
      <text x="460" y="24" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0071ce">Live Streaming Reference Architecture</text>

      {/* --- Region 1 (Top Path) --- */}
      {/* Encoder Primary */}
      <rect x="10" y="60" width="110" height="65" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="65" y="85" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Encoder</text>
      <text x="65" y="100" textAnchor="middle" fontSize="8" fill="#888">(Primary)</text>

      {/* SRT Arrow */}
      <line x1="120" y1="92" x2="180" y2="92" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />
      <text x="150" y="85" textAnchor="middle" fontSize="8" fill="#0071ce">SRT</text>

      {/* Edge Gateway Region 1 */}
      <rect x="180" y="50" width="140" height="85" rx="6" fill="#f9fafb" stroke="#0099CC" strokeDasharray="4" />
      <text x="250" y="66" textAnchor="middle" fontSize="8" fill="#0099CC">Edge Region 1</text>
      <rect x="200" y="75" width="100" height="45" rx="4" fill="#f0f4f8" stroke="#ccc" />
      <text x="250" y="97" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Edge</text>
      <text x="250" y="112" textAnchor="middle" fontSize="8" fill="#888">Gateway</text>

      {/* SRT Arrow */}
      <line x1="320" y1="97" x2="380" y2="97" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />
      <text x="350" y="90" textAnchor="middle" fontSize="8" fill="#0071ce">SRT</text>

      {/* Akamai Core Region 1 */}
      <rect x="380" y="50" width="230" height="85" rx="6" fill="#f9fafb" stroke="#0071ce" strokeDasharray="4" />
      <text x="495" y="66" textAnchor="middle" fontSize="8" fill="#0071ce">Akamai Core Region 1</text>
      <rect x="400" y="75" width="90" height="45" rx="4" fill="#e8f4fd" stroke="#0071ce" />
      <text x="445" y="100" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">Transcoder</text>
      <rect x="505" y="75" width="90" height="45" rx="4" fill="#e8f4fd" stroke="#0071ce" />
      <text x="550" y="100" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">Packager</text>
      <text x="495" y="130" textAnchor="middle" fontSize="8" fill="#0071ce">LKE Cluster</text>
      <line x1="490" y1="97" x2="505" y2="97" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />

      {/* --- Region 2 (Bottom Path) --- */}
      {/* Encoder Failover */}
      <rect x="10" y="210" width="110" height="65" rx="6" fill="#f0f4f8" stroke="#ccc" />
      <text x="65" y="235" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Encoder</text>
      <text x="65" y="250" textAnchor="middle" fontSize="8" fill="#888">(Failover)</text>

      {/* SRT Arrow */}
      <line x1="120" y1="242" x2="180" y2="242" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />
      <text x="150" y="235" textAnchor="middle" fontSize="8" fill="#0071ce">SRT</text>

      {/* Edge Gateway Region 2 */}
      <rect x="180" y="200" width="140" height="85" rx="6" fill="#f9fafb" stroke="#0099CC" strokeDasharray="4" />
      <text x="250" y="216" textAnchor="middle" fontSize="8" fill="#0099CC">Edge Region 2</text>
      <rect x="200" y="225" width="100" height="45" rx="4" fill="#f0f4f8" stroke="#ccc" />
      <text x="250" y="247" textAnchor="middle" fontSize="10" fontWeight="600" fill="#333">Edge</text>
      <text x="250" y="262" textAnchor="middle" fontSize="8" fill="#888">Gateway</text>

      {/* SRT Arrow */}
      <line x1="320" y1="247" x2="380" y2="247" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />
      <text x="350" y="240" textAnchor="middle" fontSize="8" fill="#0071ce">SRT</text>

      {/* Akamai Core Region 2 */}
      <rect x="380" y="200" width="230" height="85" rx="6" fill="#f9fafb" stroke="#0071ce" strokeDasharray="4" />
      <text x="495" y="216" textAnchor="middle" fontSize="8" fill="#0071ce">Akamai Core Region 2</text>
      <rect x="400" y="225" width="90" height="45" rx="4" fill="#e8f4fd" stroke="#0071ce" />
      <text x="445" y="250" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">Transcoder</text>
      <rect x="505" y="225" width="90" height="45" rx="4" fill="#e8f4fd" stroke="#0071ce" />
      <text x="550" y="250" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0071ce">Packager</text>
      <text x="495" y="280" textAnchor="middle" fontSize="8" fill="#0071ce">LKE Cluster</text>
      <line x1="490" y1="247" x2="505" y2="247" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />

      {/* Cross-connect lines (failover paths) */}
      <line x1="120" y1="110" x2="180" y2="220" stroke="#ccc" strokeWidth="1" strokeDasharray="4" />
      <line x1="120" y1="225" x2="180" y2="105" stroke="#ccc" strokeWidth="1" strokeDasharray="4" />

      {/* Arrows from both regions to CDN */}
      <line x1="610" y1="97" x2="660" y2="165" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />
      <line x1="610" y1="247" x2="660" y2="180" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />

      {/* Akamai CDN / AMD */}
      <rect x="660" y="135" width="120" height="70" rx="8" fill="#0071ce" />
      <text x="720" y="165" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Akamai CDN</text>
      <text x="720" y="183" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)">AMD</text>

      {/* Arrow to Clients */}
      <line x1="780" y1="170" x2="820" y2="170" stroke="#0071ce" strokeWidth="1.5" markerEnd="url(#liveArrow)" />

      {/* Clients */}
      <rect x="820" y="110" width="90" height="120" rx="8" fill="#f0f4f8" stroke="#ccc" />
      <text x="865" y="132" textAnchor="middle" fontSize="11" fontWeight="600" fill="#333">Clients</text>
      <text x="865" y="155" textAnchor="middle" fontSize="10" fill="#666">📺 Smart TV</text>
      <text x="865" y="175" textAnchor="middle" fontSize="10" fill="#666">📱 Mobile</text>
      <text x="865" y="195" textAnchor="middle" fontSize="10" fill="#666">🎮 Console</text>
      <text x="865" y="220" textAnchor="middle" fontSize="9" fill="#0071ce" fontWeight="600">AMP v2</text>
    </svg>
  )
}
