export interface FormatCard {
  name: string
  fullName: string
  description: string
  color: string
}

export const formats: FormatCard[] = [
  {
    name: 'HLS',
    fullName: 'HTTP Live Streaming',
    description: 'Developed by Apple. Segment-based protocol using .m3u8 manifests. Widest device compatibility across iOS, Android, Smart TVs, and web browsers. LL-HLS variant enables 5-7 second end-to-end latency with MSL5.',
    color: 'blue',
  },
  {
    name: 'DASH',
    fullName: 'Dynamic Adaptive Streaming over HTTP',
    description: 'MPEG international standard using .mpd manifests. Codec-agnostic — supports H.264, HEVC, AV1, and more. LL-DASH enables sub-3-second latency. Preferred for Android and web platforms.',
    color: 'purple',
  },
  {
    name: 'CMAF',
    fullName: 'Common Media Application Format',
    description: 'Unified fMP4 container format that works with both HLS and DASH. Reduces storage and encoding costs by eliminating duplicate segments. Chunked transfer encoding enables low-latency delivery.',
    color: 'green',
  },
]

export interface ComparisonRow {
  format: string
  latency: string
  deviceSupport: string
  drmSupport: string
  bestUseCase: string
}

export const comparisonData: ComparisonRow[] = [
  { format: 'HLS', latency: '6-30 sec', deviceSupport: 'Universal', drmSupport: 'FairPlay', bestUseCase: 'iOS / Apple ecosystem' },
  { format: 'LL-HLS', latency: '5-7 sec', deviceSupport: 'iOS 14+, modern browsers', drmSupport: 'FairPlay', bestUseCase: 'Low-latency live on Apple' },
  { format: 'DASH', latency: '6-30 sec', deviceSupport: 'Android, Web, Smart TVs', drmSupport: 'Widevine, PlayReady', bestUseCase: 'Multi-DRM, multi-codec' },
  { format: 'LL-DASH', latency: '< 3 sec', deviceSupport: 'Modern browsers, Android', drmSupport: 'Widevine, PlayReady', bestUseCase: 'Ultra-low-latency live' },
  { format: 'CMAF', latency: '3-7 sec', deviceSupport: 'Cross-platform', drmSupport: 'All (CBCS)', bestUseCase: 'Unified encoding pipeline' },
]

export interface CodecRow {
  codec: string
  standard: string
  compression: string
  quality: string
  adoption: string
}

export const codecData: CodecRow[] = [
  { codec: 'AVC / H.264', standard: 'ITU-T / ISO', compression: 'Baseline', quality: 'Good', adoption: 'Universal — all devices' },
  { codec: 'HEVC / H.265', standard: 'ITU-T / ISO', compression: '~50% better than H.264', quality: 'Excellent', adoption: 'Growing — 4K/HDR content' },
  { codec: 'AV1', standard: 'AOMedia', compression: '~30% better than HEVC', quality: 'Excellent', adoption: 'Emerging — web & mobile' },
]
