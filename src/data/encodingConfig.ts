export const encodingProfile = `{
  "name": "Live HEVC 4K",
  "encoderVersion": "STABLE",
  "cloudRegion": "AKAMAI_US_IAD",
  "infrastructure": {
    "type": "AKAMAI_CLOUD"
  }
}`

export const abrLadder = `[
  { "res": "3840x2160", "bitrate": 12000000 },
  { "res": "1920x1080", "bitrate": 4500000  },
  { "res": "1280x720",  "bitrate": 2400000  },
  { "res": "854x480",   "bitrate": 1200000  },
  { "res": "640x360",   "bitrate": 600000   }
]`

export const featureTags = [
  'Per-Title Encoding',
  'Multi-Codec (H.264 / HEVC / AV1)',
  'CMCD Support',
  'Live-to-VOD',
  'DRM Packaging',
  'Akamai Cloud Infrastructure',
]
