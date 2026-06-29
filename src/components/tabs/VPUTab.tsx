export default function VPUTab() {
  const cpuVmUrl = import.meta.env.VITE_VPU_CPU_VM_URL
  const vpuVmUrl = import.meta.env.VITE_VPU_VPU_VM_URL

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl py-8 px-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Video Processing Units (VPUs)</h1>
        <p className="mt-1 text-base text-white/80">Akamai Accelerated Compute — Powered by NETINT Quadra T1U</p>
        <p className="mt-2 text-sm text-white/60 max-w-2xl mx-auto">
          Offload compute-intensive video encoding and decoding from the CPU to dedicated hardware — reducing cost, power consumption, and latency.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Why VPUs?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Traditional CPU-based transcoding is expensive and inefficient at scale. VPUs are purpose-built silicon for video encoding and decoding — they deliver higher throughput at a fraction of the cost and power draw.
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center bg-emerald-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-700">30</div>
            <div className="text-xs text-gray-500 mt-1">Concurrent streams per VPU</div>
          </div>
          <div className="text-center bg-emerald-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-700">8K</div>
            <div className="text-xs text-gray-500 mt-1">AV1 HDR encoding</div>
          </div>
          <div className="text-center bg-emerald-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-700">$280</div>
            <div className="text-xs text-gray-500 mt-1">/month starting price</div>
          </div>
          <div className="text-center bg-emerald-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-700">$0.005</div>
            <div className="text-xs text-gray-500 mt-1">/GB egress</div>
          </div>
        </div>
      </div>

      {/* CPU vs VPU Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-emerald-800 text-white px-5 py-3 font-semibold text-sm">
          CPU vs VPU Transcoding Comparison
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Metric</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">CPU (Software)</th>
                <th className="text-left px-4 py-2.5 font-semibold text-emerald-700">VPU (Hardware)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Concurrent 1080p Streams', cpu: '2-4 per 8 vCPU', vpu: 'Up to 30 per VPU' },
                { metric: 'Power Consumption', cpu: 'High (full CPU load)', vpu: '~10x lower' },
                { metric: 'Cost per Stream', cpu: '$$$', vpu: '$' },
                { metric: 'Codec Support', cpu: 'Any (software)', vpu: 'H.264, HEVC, AV1' },
                { metric: 'Max Resolution', cpu: 'Depends on cores', vpu: '8K HDR' },
                { metric: 'Latency', cpu: 'Variable under load', vpu: 'Consistent, hardware-paced' },
                { metric: 'FFmpeg Integration', cpu: 'Native', vpu: 'Native (libnetint)' },
                { metric: 'Scaling', cpu: 'Add more VMs', vpu: 'Add VPU instances' },
              ].map((row, i) => (
                <tr key={row.metric} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-medium text-gray-800">{row.metric}</td>
                  <td className="px-4 py-2 text-gray-600">{row.cpu}</td>
                  <td className="px-4 py-2 text-emerald-700 font-medium">{row.vpu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Instance Specifications</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Hardware — NETINT Quadra T1U</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>VPUs per instance</span><span className="font-medium text-gray-800">Up to 2</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>vCPU cores</span><span className="font-medium text-gray-800">8</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>Memory</span><span className="font-medium text-gray-800">16 GB</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>Storage</span><span className="font-medium text-gray-800">200 GB SSD</span></div>
              <div className="flex justify-between"><span>H.264 Profiles</span><span className="font-medium text-gray-800">Baseline, Main, High, High 10</span></div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Encoding Capabilities</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>H.264/AVC</span><span className="font-medium text-emerald-700">Encode + Decode</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>H.265/HEVC</span><span className="font-medium text-emerald-700">Encode + Decode</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>AV1</span><span className="font-medium text-emerald-700">Encode up to 8K HDR</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-1"><span>HDR</span><span className="font-medium text-emerald-700">Native support</span></div>
              <div className="flex justify-between"><span>FFmpeg</span><span className="font-medium text-emerald-700">Included, hardware-accelerated</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Use Cases</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
            <div className="text-2xl mb-2">📺</div>
            <h3 className="font-semibold text-gray-800 mb-2">VOD Transcoding</h3>
            <p className="text-xs text-gray-600">Bulk transcode video libraries into multi-codec ABR ladders. Process thousands of hours at a fraction of CPU cost.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
            <div className="text-2xl mb-2">🔴</div>
            <h3 className="font-semibold text-gray-800 mb-2">Live Streaming</h3>
            <p className="text-xs text-gray-600">Real-time transcoding of live events with consistent latency. Scale from single streams to hundreds of concurrent channels.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-800 mb-2">UGC Platforms</h3>
            <p className="text-xs text-gray-600">Process user-uploaded video at scale — thumbnail generation, format normalization, and quality optimization on ingest.</p>
          </div>
        </div>
      </div>

      {/* FFmpeg Example */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">FFmpeg with VPU Hardware Acceleration</h2>
        <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">
{`# CPU-based transcoding (software)
ffmpeg -i input.mp4 -c:v libx264 -preset medium -b:v 4M output_cpu.mp4

# VPU-accelerated transcoding (NETINT Quadra)
ffmpeg -i input.mp4 -c:v h264_ni_quadra -b:v 4M output_vpu.mp4

# VPU: Multi-bitrate ABR ladder in one pass
ffmpeg -i input.mp4 \\
  -c:v h264_ni_quadra -b:v 8M  -s 1920x1080 out_1080p.mp4 \\
  -c:v h264_ni_quadra -b:v 4M  -s 1280x720  out_720p.mp4 \\
  -c:v h264_ni_quadra -b:v 2M  -s 854x480   out_480p.mp4 \\
  -c:v h264_ni_quadra -b:v 1M  -s 640x360   out_360p.mp4

# VPU: AV1 encoding (8K HDR)
ffmpeg -i input_8k.mp4 -c:v av1_ni_quadra -b:v 20M output_av1.mp4`}
        </pre>
      </div>

      {/* Live Demo — CPU vs VPU */}
      <div className="bg-white rounded-lg border-2 border-emerald-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Live Demo — CPU vs VPU Transcoding</h2>
        <p className="text-sm text-gray-500 mb-5">
          Side-by-side comparison of video transcoding on CPU vs VPU. Watch the terminal output and resource utilization in real-time to see the performance difference.
        </p>

        {/* Placeholder: Demo Status */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-lg">&#9888;</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Demo Environment — Setup Required</p>
              <p className="text-xs text-amber-700 mt-1">
                Two Linode instances (one CPU-only, one with VPU) with Wetty web terminals need to be provisioned and configured. See the setup steps below.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Layout Preview */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-2 font-bold text-center text-sm">Transcoding on CPU</div>
            {cpuVmUrl ? (
              <iframe src={cpuVmUrl} className="w-full" style={{ height: '260px' }} title="CPU Transcoding Terminal" />
            ) : (
              <div className="bg-gray-900 flex items-center justify-center text-center" style={{ height: '260px' }}>
                <div className="px-6">
                  <p className="text-white/70 text-sm font-medium mb-1">CPU Transcoding Terminal</p>
                  <p className="text-white/40 text-[10px]">ffmpeg running libx264 software encoder</p>
                  <p className="text-white/30 text-[10px] mt-2">Pending: Wetty terminal on CPU instance</p>
                </div>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-2 font-bold text-center text-sm">CPU Resource Utilization</div>
            {cpuVmUrl ? (
              <iframe src={cpuVmUrl} className="w-full" style={{ height: '260px' }} title="CPU Resource Monitor" />
            ) : (
              <div className="bg-gray-900 flex items-center justify-center text-center" style={{ height: '260px' }}>
                <div className="px-6">
                  <p className="text-white/70 text-sm font-medium mb-1">CPU Metrics</p>
                  <p className="text-white/40 text-[10px]">htop showing high CPU usage during transcode</p>
                  <p className="text-white/30 text-[10px] mt-2">Pending: Wetty terminal on CPU instance</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2 font-bold text-center text-sm">Transcoding on VPU</div>
            {vpuVmUrl ? (
              <iframe src={vpuVmUrl} className="w-full" style={{ height: '260px' }} title="VPU Transcoding Terminal" />
            ) : (
              <div className="bg-gray-900 flex items-center justify-center text-center" style={{ height: '260px' }}>
                <div className="px-6">
                  <p className="text-white/70 text-sm font-medium mb-1">VPU Transcoding Terminal</p>
                  <p className="text-white/40 text-[10px]">ffmpeg running h264_ni_quadra hardware encoder</p>
                  <p className="text-white/30 text-[10px] mt-2">Pending: Wetty terminal on VPU instance</p>
                </div>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2 font-bold text-center text-sm">VPU Resource Utilization</div>
            {vpuVmUrl ? (
              <iframe src={vpuVmUrl} className="w-full" style={{ height: '260px' }} title="VPU Resource Monitor" />
            ) : (
              <div className="bg-gray-900 flex items-center justify-center text-center" style={{ height: '260px' }}>
                <div className="px-6">
                  <p className="text-white/70 text-sm font-medium mb-1">VPU Metrics</p>
                  <p className="text-white/40 text-[10px]">htop + ni_rsrc_mon showing low CPU, VPU offload</p>
                  <p className="text-white/30 text-[10px] mt-2">Pending: Wetty terminal on VPU instance</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Demo Setup Steps</h2>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Provision Two Linode Instances</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2">One standard compute (CPU-only) and one Accelerated Compute (VPU) instance in the same region.</p>
              <pre className="bg-gray-900 rounded p-3 text-[10px] text-green-300 overflow-x-auto font-mono leading-relaxed">{`# CPU instance (standard compute)
linode-cli linodes create --type g6-standard-4 --region us-iad \\
  --image linode/ubuntu24.04 --label cpu-transcode --root_pass <password>

# VPU instance (accelerated compute)
linode-cli linodes create --type g1-accelerated-netint-1 --region us-iad \\
  --image linode/ubuntu24.04 --label vpu-transcode --root_pass <password>`}</pre>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Install FFmpeg on Both Instances</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2">Standard FFmpeg on CPU instance, NETINT-enabled FFmpeg on VPU instance.</p>
              <pre className="bg-gray-900 rounded p-3 text-[10px] text-green-300 overflow-x-auto font-mono leading-relaxed">{`# CPU instance — standard FFmpeg
apt-get update && apt-get install -y ffmpeg

# VPU instance — NETINT-enabled FFmpeg
# Follow NETINT Quadra SDK installation guide:
# 1. Install NETINT Quadra driver and firmware
# 2. Build FFmpeg with --enable-libnetint
# 3. Verify: ffmpeg -encoders | grep ni_quadra`}</pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Install Wetty (Web Terminal) on Both Instances</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2">Wetty provides browser-based SSH access for the live demo panels.</p>
              <pre className="bg-gray-900 rounded p-3 text-[10px] text-green-300 overflow-x-auto font-mono leading-relaxed">{`# On both instances
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g wetty

# Start Wetty (use tmux/systemd to keep it running)
wetty --port 3000 --host 0.0.0.0 --base /wetty`}</pre>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Upload a Test Video to Both Instances</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2">Use the same source file on both to ensure a fair comparison.</p>
              <pre className="bg-gray-900 rounded p-3 text-[10px] text-green-300 overflow-x-auto font-mono leading-relaxed">{`# Download a test file (Tears of Steel 4K)
wget -O /root/test_4k.mp4 \\
  "https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mkv"

# Or use your own content via SCP
scp source_4k.mp4 root@<instance-ip>:/root/test_4k.mp4`}</pre>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">5</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Prepare Demo Scripts</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2">Create scripts on each instance that start transcoding + resource monitoring when triggered.</p>
              <pre className="bg-gray-900 rounded p-3 text-[10px] text-green-300 overflow-x-auto font-mono leading-relaxed">{`# /root/run_demo.sh (CPU instance)
#!/bin/bash
tmux new-session -d -s demo
tmux send-keys -t demo "ffmpeg -i /root/test_4k.mp4 -c:v libx264 \\
  -preset medium -b:v 4M -f null /dev/null" Enter
tmux split-window -t demo
tmux send-keys -t demo "htop" Enter

# /root/run_demo.sh (VPU instance)
#!/bin/bash
tmux new-session -d -s demo
tmux send-keys -t demo "ffmpeg -i /root/test_4k.mp4 -c:v h264_ni_quadra \\
  -b:v 4M -f null /dev/null" Enter
tmux split-window -t demo
tmux send-keys -t demo "htop" Enter`}</pre>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">6</div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Configure Environment Variables &amp; Deploy</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2">Point the demo app at your Wetty endpoints and rebuild.</p>
              <pre className="bg-gray-900 rounded p-3 text-[10px] text-green-300 overflow-x-auto font-mono leading-relaxed">{`# .env
VITE_VPU_CPU_VM_URL=https://cpuvm.your-domain.com/wetty
VITE_VPU_VPU_VM_URL=https://vpuvm.your-domain.com/wetty

# Rebuild and deploy
npm run build
scp -r dist/* root@172.232.27.231:/var/www/mediademo/`}</pre>
            </div>
          </div>
        </div>

        <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs text-emerald-800">
            <strong>During the demo:</strong> SSH into each instance via Wetty in the browser, run the demo script, and viewers see the CPU instance maxing out at 90%+ CPU while the VPU instance stays below 10% CPU — the VPU handles the encoding workload in dedicated hardware.
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-lg p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Accelerated Compute</h3>
          <p className="text-sm text-white/70 mt-1">Full product details, instance types, and pricing</p>
        </div>
        <a
          href="https://www.akamai.com/products/accelerated-compute"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-emerald-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          Learn More →
        </a>
      </div>
    </div>
  )
}
