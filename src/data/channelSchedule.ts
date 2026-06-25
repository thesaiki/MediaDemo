export interface ChannelProgram {
  title: string
  type: 'live' | 'vod' | 'transition'
  duration: string
  detail: string
  color: string
  flex: number
}

export interface Channel {
  name: string
  programs: ChannelProgram[]
}

export const channels: Channel[] = [
  {
    name: 'News 24/7',
    programs: [
      { title: 'Morning Headlines', type: 'live', duration: '08:00-09:00', detail: 'LIVE', color: 'blue', flex: 1 },
      { title: 'Deep Dive: Tech Report', type: 'transition', duration: '09:00-11:00', detail: 'VOD → Live Transition', color: 'amber', flex: 2 },
      { title: 'Midday News', type: 'live', duration: '11:00-12:00', detail: 'LIVE', color: 'blue', flex: 1 },
    ],
  },
  {
    name: 'Sports HD',
    programs: [
      { title: 'Match Replay: Finals', type: 'vod', duration: '08:00-10:00', detail: 'VOD (HEVC 4K)', color: 'green', flex: 2 },
      { title: 'Pre-Game', type: 'vod', duration: '10:00-11:00', detail: 'VOD', color: 'pink', flex: 1 },
      { title: 'Live Match', type: 'live', duration: '11:00-13:00', detail: 'LIVE (LL-HLS)', color: 'blue', flex: 2 },
    ],
  },
  {
    name: 'Movies',
    programs: [
      { title: 'Feature Film: Tears of Steel', type: 'vod', duration: '08:00-12:00', detail: 'VOD (Per-Title Encoded, Multi-Audio)', color: 'purple', flex: 5 },
    ],
  },
]

export const smilExample = `<smil>
  <body>
    <seq>
      <video src="news-opener.mp4"
             clipBegin="00:00:00"
             clipEnd="00:05:00" />
      <ref src="live://feed-1"
           dur="01:00:00" />
      <video src="documentary.mp4" />
    </seq>
  </body>
</smil>`

export const channelFeatureTags = [
  'VOD-to-Live Stitching',
  'SMIL Playlists',
  'Just-In-Time Packaging',
  'Server-Side Ad Insertion',
  'Unified Origin',
  'Multi-DRM',
]
