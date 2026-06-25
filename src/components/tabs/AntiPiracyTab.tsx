export default function AntiPiracyTab() {
  const demoPortalUrl = import.meta.env.VITE_ANTIPIRACY_DEMO_URL

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold">MultiCDN Anti-Piracy (MCAP)</h1>
        <p className="mt-2 text-sm text-white/70 max-w-2xl mx-auto">
          Token auth secures the delivery path — MCAP adds the management and anti-piracy layer it was never designed to have, standardizing token handling across CDNs with true detection and revocation.
        </p>
      </div>

      {/* The Problem */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">The Problem Token Auth Can't Solve</h2>
        <p className="text-sm text-gray-600 mb-4">
          Token authentication is fast, inexpensive, and adds no playback overhead — but tokens can be shared, replayed, and redistributed. A token proves a request is authorized; it cannot prove the requester is the person it was issued to. In a multi-CDN world, that single weakness multiplies into a structural problem.
        </p>
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 font-semibold">
            $75 billion in annual piracy losses, growing 11% per year
            <span className="font-normal text-red-600 ml-1">(ScoreDetect, 2025)</span>
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Link Sharing</h4>
            <p className="text-xs text-gray-600">A legitimate subscriber shares or sells a tokenized link. The same token gets replayed across dozens of devices at once.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">URL Scraping</h4>
            <p className="text-xs text-gray-600">URLs scraped from network requests and redistributed to thousands of viewers within minutes during live events.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Cross-CDN Evasion</h4>
            <p className="text-xs text-gray-600">Pirates distribute traffic across multiple CDNs. Each sees a fraction — well below its anomaly threshold. No alert fires.</p>
          </div>
        </div>
      </div>

      {/* Why Standard Fixes Fail */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Why Standard Fixes Don't Fix It</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✕</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Short Token Lifetimes</h4>
              <p className="text-xs text-gray-600 mt-0.5">Shrinks the sharing window but interrupts long-form playback, breaks DVR rewind, and causes reconnection failures on mobile. Degrades the experience for paying subscribers.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✕</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">IP Binding</h4>
              <p className="text-xs text-gray-600 mt-0.5">Stops link sharing but mobile users change IPs constantly, and VPN users look like they're switching locations on every request. False access errors for legitimate viewers are immediate.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✕</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">CDN-Side Rate Limits</h4>
              <p className="text-xs text-gray-600 mt-0.5">Most exploitable of all. A pirate who understands your threshold distributes traffic across three CDNs. Each provider sees well below its own threshold. Abuse continues invisibly.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✕</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">No Revocation</h4>
              <p className="text-xs text-gray-600 mt-0.5">Once a token is issued, most CDN systems have no native way to cancel it. If a token leaks during a live event with a 6-hour TTL, that's 6 hours of exposure.</p>
            </div>
          </div>
        </div>
      </div>

      {/* The Multi-CDN Blind Spot */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">The Multi-CDN Blind Spot</h2>
        <p className="text-sm text-gray-600 mb-4">
          Every major CDN — Akamai, CloudFront, Fastly, Cloudflare — implements tokens differently. Each validates tokens in isolation. The signal only exists in aggregate, correlated across your entire estate.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Fragmented Token Paths</h4>
            <p className="text-xs text-gray-600">A single token can't work everywhere. Providers must issue CDN-specific tokens or build translation layers. Onboarding a new CDN means rebuilding the entire token path.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Invisible Aggregate Abuse</h4>
            <p className="text-xs text-gray-600">Abuse distributed across three providers is invisible to all three. Detection is only as good as the logs the slowest CDN delivers.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Mid-Session Failures</h4>
            <p className="text-xs text-gray-600">When traffic is routed between CDNs for performance or failover, a token valid on one CDN may fail on another — surfacing as a support escalation, not a piracy alert.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Policy Propagation</h4>
            <p className="text-xs text-gray-600">Custom integration code that every policy change must ripple through. Slow cross-vendor testing and per-CDN maintenance overhead.</p>
          </div>
        </div>
      </div>

      {/* MCAP Architecture */}
      <div className="bg-white rounded-lg border-2 border-red-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">MCAP Architecture</h2>
        <p className="text-sm text-gray-600 mb-4">
          MCAP moves token validation and abuse detection outside of any individual CDN and onto a globally synchronized platform. Every content request — regardless of which CDN receives it — is validated against a single source of truth.
        </p>

        {/* Architecture Diagram — Request Flow */}
        <div className="bg-white rounded-lg p-4 mb-5 overflow-x-auto">
          <img
            src="/mcap-request-flow.svg"
            alt="Multi-CDN AntiPiracy Request Flow — Client Devices → CDN Layer → Akamai Token Verification API → Global Traffic Manager → Regional nodes → Globally Synchronized Token State"
            className="w-full"
            style={{ minWidth: '700px' }}
          />
        </div>

        {/* Detection Signals */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-red-800 mb-1">Signal 1: Token Request Rate</h4>
            <p className="text-xs text-gray-700">Flags tokens generating an abnormally high number of requests within a configurable window — the signature of a credential replayed across many devices.</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-red-800 mb-1">Signal 2: Distinct User-ID Detection</h4>
            <p className="text-xs text-gray-700">Flags a single token that surfaces across many different user identities. A legitimate viewer may hold several tokens. A pirated token attracts many users. This signal is invisible to any per-CDN system.</p>
          </div>
        </div>

        {/* Enforcement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-gray-800 mb-2">Configurable Enforcement per CDN per Policy</h4>
          <div className="flex flex-wrap gap-2">
            {['Block session', 'Degrade to low bitrate', 'Redirect to sign-up', 'Inject targeted ads', 'Log-only mode'].map(action => (
              <span key={action} className="bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium">{action}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Enforcement is instant and global. The MCAP platform decides. The CDN executes. Adding a new CDN means configuring an adapter — not rebuilding your token path.</p>
        </div>
      </div>

      {/* Start with Visibility */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Start With Visibility</h2>
        <p className="text-sm text-gray-600 mb-4">
          The first question isn't <em>how do we enforce?</em> It's <em>what does our token abuse surface actually look like?</em> Most teams don't know — not because they haven't looked, but because the data has never existed in one place.
        </p>
        <div className="bg-akamai-light rounded-lg p-5">
          <h4 className="font-semibold text-sm text-akamai-blue mb-3">Visibility Engagement — 2 to 4 Weeks</h4>
          <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-700">
            <div className="flex gap-2 items-start">
              <span className="text-akamai-blue font-bold mt-0.5">✓</span>
              <span>Baseline of token usage patterns across your full CDN estate</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-akamai-blue font-bold mt-0.5">✓</span>
              <span>Active abuse identified before any enforcement is enabled</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-akamai-blue font-bold mt-0.5">✓</span>
              <span>Schema inventory per CDN</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-akamai-blue font-bold mt-0.5">✓</span>
              <span>Risk quantification for internal business case</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Akamai-led. Read access to CDN logs. No production changes, no enforcement.</p>
        </div>
      </div>

      {/* Demo Portal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">MCAP Demo Portal</h2>
        <p className="text-sm text-gray-500 mb-4">
          Interactive demonstration of MCAP — token validation across multi-CDN, abuse detection signals, and configurable enforcement workflows.
        </p>
        {demoPortalUrl ? (
          <iframe
            src={demoPortalUrl}
            className="w-full rounded-lg border border-gray-200"
            style={{ height: '600px' }}
            title="MCAP Demo Portal"
          />
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-center" style={{ height: '400px' }}>
            <div className="px-6">
              <div className="text-4xl mb-3">🛡️</div>
              <p className="text-gray-600 font-medium mb-1">MCAP Demo Portal</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Set <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">VITE_ANTIPIRACY_DEMO_URL</code> in your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">.env</code> file to embed the demo portal here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-red-700 to-akamai-dark rounded-lg p-6 text-white">
        <h3 className="font-bold text-lg mb-2">Ready to See Your Token Abuse Surface?</h3>
        <p className="text-sm text-white/80 max-w-3xl">
          Contact your Akamai account representative to request a visibility scoping call or a live demo. Thirty minutes. No cost. The first step toward knowing — rather than guessing — what your piracy exposure actually looks like.
        </p>
      </div>
    </div>
  )
}
