import { featureParityData, newFeaturesData } from '../../data/msl5Features'
import type { FeatureRow } from '../../data/msl5Features'

function FeatureTable({ title, data, showRoadmap }: { title: string; data: FeatureRow[]; showRoadmap?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-akamai-dark text-white">
            <th className="text-left px-4 py-2.5 font-semibold">{title}</th>
            <th className="px-4 py-2.5 font-semibold text-center">MSL4</th>
            <th className="px-4 py-2.5 font-semibold text-center">MSL5</th>
            {showRoadmap && <th className="px-4 py-2.5 font-semibold text-center">Roadmap</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 text-gray-700">{row.feature}</td>
              <td className="px-4 py-2 text-center text-gray-600">{row.msl4 || '—'}</td>
              <td className="px-4 py-2 text-center font-medium text-akamai-blue">{row.msl5 || '—'}</td>
              {showRoadmap && <td className="px-4 py-2 text-center text-gray-500">{row.roadmap || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MSL5OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* MSL5 Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-dark text-white px-5 py-3 font-semibold">
            MSL5 — Powered by Harmonic
          </div>
          <div className="p-5 space-y-2.5 text-sm text-gray-700">
            <p>Powered by Harmonic, runs on Akamai Connected Cloud</p>
            <p>Feature parity with MSL4</p>
            <p>Pricing &amp; invoicing process unchanged</p>
            <p>Support &amp; operations unchanged</p>
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="text-akamai-blue font-medium italic">Seamless upgrade after blue-green testing</p>
            </div>
          </div>
        </div>

        {/* New Capabilities Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-akamai-blue text-white px-5 py-3 font-semibold">
            New Capabilities
          </div>
          <div className="p-5 space-y-2.5 text-sm text-gray-700">
            <p>End-to-end <strong>5-7 sec</strong> low-latency streaming</p>
            <p>Near real-time stream provisioning (<strong>~5 sec</strong> vs ~3 hours on MSL4)</p>
            <p>Up to <strong>12-hour</strong> configurable DVR window</p>
            <p>Easy event creation &amp; management</p>
            <p>Powerful dashboard &amp; logs management</p>
            <p className="text-gray-500 italic">OTT transcoding, Dynamic Ad Insertion (roadmap)</p>
          </div>
        </div>
      </div>

      {/* Feature Comparison Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <FeatureTable title="Feature Parity" data={featureParityData} showRoadmap />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <FeatureTable title="New Features" data={newFeaturesData} showRoadmap />
        </div>
      </div>
    </div>
  )
}
