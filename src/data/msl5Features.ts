export interface FeatureRow {
  feature: string
  msl4: string
  msl5: string
  roadmap?: string
}

export const featureParityData: FeatureRow[] = [
  { feature: 'First-Mile Reports', msl4: '✓', msl5: '✓' },
  { feature: 'Live DVR Window (w/o archive)', msl4: '30 mins', msl5: '12 hours' },
  { feature: 'Self-Healing Network', msl4: '✓', msl5: '✓' },
  { feature: 'End-to-End TLS Support', msl4: '✓', msl5: '✓' },
  { feature: 'DVR and Unlimited Archive', msl4: '✓', msl5: '✓' },
  { feature: 'Max Advanced Archive Length', msl4: '31 days', msl5: '62 days' },
  { feature: 'HLS/DASH/CMAF/LL-DASH', msl4: '✓', msl5: '✓' },
  { feature: 'Advanced Event Creation & Management', msl4: 'Alpha', msl5: '✓' },
  { feature: 'Merged Playlist Creation', msl4: 'Manual', msl5: 'Automatic', roadmap: 'Automatic' },
]

export const newFeaturesData: FeatureRow[] = [
  { feature: 'Stream Provisioning Time', msl4: '~3 hours', msl5: '~5 sec' },
  { feature: 'LL-HLS Support', msl4: '', msl5: '✓' },
  { feature: 'Access to Ingest Logs', msl4: '', msl5: '✓' },
  { feature: 'Logs Export', msl4: '', msl5: '✓' },
  { feature: 'Event Monitoring', msl4: '', msl5: '✓' },
  { feature: 'Origin Capacity Reservation', msl4: '', msl5: '✓' },
  { feature: 'Frame Accurate Clipping', msl4: '', msl5: '✓' },
  { feature: 'Manifest Filtering', msl4: '', msl5: '✓' },
  { feature: 'nPVR/cDVR', msl4: '', msl5: '', roadmap: '✓' },
  { feature: 'OTT Transcoding', msl4: '', msl5: '', roadmap: '✓' },
  { feature: 'Dynamic Ad Insertion', msl4: '', msl5: '', roadmap: '✓' },
]
