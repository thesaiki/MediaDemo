// ---------- Use-case library: planning presets (illustrative, replace with measured data) ----------
function base() {
  return {
    name: 'Untitled scenario', unit: 'task', useCase: null,
    workload: { users: 100, tasksPerDay: 10, activeDays: 22, callsPerTask: 1, inTok: 2000, outTok: 500, retryPct: 5, peakFactor: 2, activeHours: 10, mediaHours: 0 },
    routing: { linodeShare: 100 },
    serving: { profile: 'ada-8b', plan: 'ada-1m', prefillTps: 4000, decodeTps: 600, utilization: 0.6, minReplicas: 1, provisioning: 'always', hours: 730 },
    api: { inRate: 3, outRate: 15 },
    stages: [],
    platform: { lke: 'none', nbBasic: 0, nbPremium: 0, nbPremiumGB: 0, objGB: 0, blockGB: 0, db: 'none', dbNodes: 1, mgmt: 0 },
    network: { egressTB: 0.2 },
    custom: [],
    finance: { reservePct: 15, horizon: 36 }
  };
}
const merge = (a, b) => {
  const o = JSON.parse(JSON.stringify(a));
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && o[k] && typeof o[k] === 'object') o[k] = Object.assign(o[k], b[k]);
    else o[k] = b[k];
  }
  return o;
};
const fixed = (label, plan, count, hours = 730) => ({ label, plan, method: 'fixed', count, hours });
const live = (label, plan, concurrent, perInstance, unitLabel, hours = 730) => ({ label, plan, method: 'live', concurrent, perInstance, unitLabel, hours });
const batch = (label, plan, units, rate, unitLabel, util = 0.8) => ({ label, plan, method: 'batch', units, rate, unitLabel, util });
const BW8 = { profile: 'bw-8b', plan: 'bw-1', prefillTps: 20000, decodeTps: 3000 };
const BW30 = { profile: 'bw-30b', plan: 'bw-1', prefillTps: 10000, decodeTps: 1500 };
const BW70 = { profile: 'bw-70b', plan: 'bw-2', prefillTps: 8000, decodeTps: 900 };

const USE_CASES = [
  // ---------------- AI workloads ----------------
  {
    id: 'support', group: 'AI', title: 'Customer support and service agents', unitMetric: 'cost per resolved case',
    summary: 'Multi-turn cases with retrieval, tool calls, retries and escalation. One task is one complete case.',
    drivers: ['Calls per case including failed attempts', 'Prompt growth from conversation history', 'Peak-hour concurrency sets GPU count'],
    blocks: ['RTX 4000 Ada for an 8B model behind vLLM', 'LKE app tier + NodeBalancer', 'Managed PostgreSQL for case state'],
    watch: 'Lower model spend is not a saving if weak answers create repeat contacts. Count retries once: they are already in calls per case.',
    idem: 'Tool actions (refunds, ticket updates): key = case_id + action + payload hash, stored in PostgreSQL with a unique index, kept 30 days; a duplicate returns the first result without re-running the tool.',
    s: () => merge(base(), {
      name: 'Support agents — 1,000 cases/day', unit: 'case',
      workload: { users: 1000, tasksPerDay: 1, activeDays: 30, callsPerTask: 6, inTok: 3000, outTok: 400, retryPct: 10, peakFactor: 2.5, activeHours: 12 },
      serving: { minReplicas: 2 },
      stages: [fixed('App and orchestration tier', 'g8-8x4', 2)],
      platform: { lke: 'ha', nbBasic: 1, objGB: 100, blockGB: 100, db: 'pg-g7-4', dbNodes: 2 },
      network: { egressTB: 0.5 },
      custom: [{ label: 'Implementation and integration', amount: 15000, kind: 'onetime' }]
    })
  },
  {
    id: 'rag', group: 'AI', title: 'Employee knowledge and RAG assistants', unitMetric: 'cost per grounded answer',
    summary: 'Questions answered from indexed company documents with pgvector retrieval and a generation call.',
    drivers: ['Retrieved-context tokens dominate input', 'Re-indexing volume when documents change', 'Vector store size and replicas'],
    blocks: ['RTX 4000 Ada x1 Large for generation', 'Batch embedding stage on RTX 4000 Ada', 'PostgreSQL + pgvector'],
    watch: 'Price initial indexing separately from monthly refreshes. Routing generation elsewhere does not shrink the vector store.',
    idem: 'Ingestion jobs: key = doc_id + content SHA-256, stored with the chunk rows, no expiry; an unchanged document is skipped instead of re-embedded.',
    s: () => merge(base(), {
      name: 'Knowledge assistant — 1,500 employees', unit: 'question',
      workload: { users: 1500, tasksPerDay: 8, activeDays: 22, callsPerTask: 1.2, inTok: 4000, outTok: 500, retryPct: 5, peakFactor: 2.5, activeHours: 9 },
      serving: { plan: 'ada-1l', minReplicas: 1 },
      stages: [batch('Embedding refresh', 'ada-1s', 50000, 20000, 'pages')],
      platform: { lke: 'ha', nbBasic: 1, objGB: 500, blockGB: 200, db: 'pg-g7-16', dbNodes: 2 },
      network: { egressTB: 0.3 }
    })
  },
  {
    id: 'docs', group: 'AI', title: 'Invoice, claims and document processing', unitMetric: 'cost per accepted document',
    summary: 'A machine queue: one task per document, OCR on CPU, extraction with an LLM, human handling for exceptions.',
    drivers: ['Pages per document', 'Extraction tokens per page', 'Exception rate needing a person'],
    blocks: ['G8 Dedicated OCR workers', 'Elastic RTX 4000 Ada extraction', 'Object Storage for originals and results'],
    watch: 'One document is not one page. Compare cost per accepted document and turnaround, not cost per call.',
    idem: 'Queue consumers: key = document_id + pipeline_version, stored in Valkey with a 7-day TTL; a redelivered message is acknowledged without re-extraction.',
    s: () => merge(base(), {
      name: 'Claims intake — 3,000 documents/day', unit: 'document',
      workload: { users: 1, tasksPerDay: 3000, activeDays: 30, callsPerTask: 2, inTok: 2500, outTok: 600, retryPct: 8, peakFactor: 1.5, activeHours: 16 },
      serving: { plan: 'ada-1m', provisioning: 'elastic', minReplicas: 0, utilization: 0.75 },
      stages: [batch('OCR workers', 'g8-16x8', 270000, 3000, 'pages')],
      platform: { objGB: 2000, db: 'vk-g7-4', dbNodes: 2 },
      network: { egressTB: 0.1 },
      custom: [{ label: 'Exception handling (human review)', amount: 2000, kind: 'recurring' }]
    })
  },
  {
    id: 'agents', group: 'AI', title: 'Multi-step agents and business automation', unitMetric: 'cost per completed workflow',
    summary: 'Planning, tool execution, validation and retries for workflows such as onboarding or reconciliation.',
    drivers: ['Calls per workflow including incomplete runs', 'Sandbox compute for tool execution', 'Share escalated to a frontier model'],
    blocks: ['30B-class model on RTX PRO 6000 Blackwell', 'G8 sandbox workers', 'Valkey for run state'],
    watch: 'Measure the whole call chain including difficult runs. Runtime limits and approvals live in the app; this planner does not enforce them.',
    idem: 'Agent actions: key = run_id + step_no + tool + args hash, stored in Valkey for 24 h; a replayed step returns the recorded result and never re-executes side effects.',
    s: () => merge(base(), {
      name: 'Back-office automation agents', unit: 'workflow',
      workload: { users: 200, tasksPerDay: 5, activeDays: 22, callsPerTask: 12, inTok: 6000, outTok: 800, retryPct: 15, peakFactor: 2, activeHours: 10 },
      routing: { linodeShare: 80 },
      serving: Object.assign({}, BW30, { minReplicas: 1 }),
      stages: [fixed('Tool sandbox workers', 'g8-8x4', 4)],
      platform: { lke: 'ha', nbBasic: 1, db: 'vk-g7-4', dbNodes: 2, objGB: 100 },
      network: { egressTB: 0.2 }
    })
  },
  {
    id: 'coding', group: 'AI', title: 'Coding assistants and code-review agents', unitMetric: 'cost per accepted change',
    summary: 'Repository-context prompts, review calls and test-and-repair loops for an engineering team.',
    drivers: ['Repository context per call (large input)', 'Review and repair loops', 'CI runners for tests'],
    blocks: ['70B-class model on Blackwell x2', 'G8 CI runners', 'External frontier model for hard tasks'],
    watch: 'Seat licences are custom lines, not tokens. Count billed reasoning output once.',
    idem: 'Review jobs: key = repo + commit SHA + reviewer profile, stored in PostgreSQL for 90 days; a re-triggered webhook returns the existing review.',
    s: () => merge(base(), {
      name: 'Code assistant — 150 engineers', unit: 'task',
      workload: { users: 150, tasksPerDay: 20, activeDays: 22, callsPerTask: 4, inTok: 12000, outTok: 1200, retryPct: 10, peakFactor: 2, activeHours: 9 },
      routing: { linodeShare: 70 },
      serving: Object.assign({}, BW70, { minReplicas: 1 }),
      stages: [fixed('CI test runners', 'g8-16x8', 3)],
      platform: { lke: 'ha', nbBasic: 1, blockGB: 500, db: 'pg-g7-4', dbNodes: 1 },
      network: { egressTB: 0.2 }
    })
  },
  {
    id: 'batch', group: 'AI', title: 'Batch classification and summarization', unitMetric: 'cost per accepted item',
    summary: 'Catalogue enrichment, tagging and backlog summarization with a completion window instead of live users.',
    drivers: ['Items per day', 'Short outputs mean prefill-heavy load', 'Elastic GPU hours instead of always-on'],
    blocks: ['Elastic RTX 4000 Ada pool', 'Object Storage for inputs and outputs'],
    watch: 'Batch work suits elastic GPUs. Hourly billing rounds up per instance, so pack jobs into full hours.',
    idem: 'Item jobs: key = item_id + prompt_version, stored next to the output object in Object Storage metadata, no expiry; reprocessing is skipped unless the prompt version changes.',
    s: () => merge(base(), {
      name: 'Catalogue enrichment — 20,000 items/day', unit: 'item',
      workload: { users: 1, tasksPerDay: 20000, activeDays: 30, callsPerTask: 1, inTok: 1200, outTok: 150, retryPct: 5, peakFactor: 1, activeHours: 24 },
      serving: { plan: 'ada-1s', provisioning: 'elastic', minReplicas: 0, utilization: 0.85 },
      platform: { objGB: 200 },
      network: { egressTB: 0.05 }
    })
  },
  {
    id: 'voice', group: 'AI', title: 'Voice assistants and contact-centre analytics', unitMetric: 'cost per analyzed call',
    summary: 'Call recordings transcribed on GPU, then summarized and scored by an LLM.',
    drivers: ['Audio hours per month', 'ASR speed (× real time) per GPU', 'Summary and QA calls per conversation'],
    blocks: ['Whisper-class ASR on RTX 4000 Ada', 'LLM summary on RTX 4000 Ada', 'Object Storage for recordings'],
    watch: 'The token engine does not price audio. ASR is sized as a pipeline stage in audio hours; keep the two separate to avoid double counting.',
    idem: 'Transcription jobs: key = recording_id + asr_model_version, stored in PostgreSQL, kept for the recording retention period; duplicates return the stored transcript.',
    s: () => merge(base(), {
      name: 'Contact-centre analytics — 4,000 calls/day', unit: 'call',
      workload: { users: 1, tasksPerDay: 4000, activeDays: 30, callsPerTask: 2, inTok: 2500, outTok: 400, retryPct: 5, peakFactor: 1.5, activeHours: 14, mediaHours: 12000 },
      serving: { provisioning: 'elastic', minReplicas: 1, utilization: 0.7 },
      stages: [batch('Speech-to-text (ASR)', 'ada-1m', 12000, 25, 'audio hours')],
      platform: { objGB: 3000, db: 'pg-g7-4', dbNodes: 1 },
      network: { egressTB: 0.1 }
    })
  },
  {
    id: 'vision', group: 'AI', title: 'Image analysis and visual inspection', unitMetric: 'cost per validated image',
    summary: 'Product images or inspection frames analyzed by a vision-language model.',
    drivers: ['Images per day', 'Image tokens per request', 'Retention of originals'],
    blocks: ['VLM on RTX PRO 6000 Blackwell', 'Object Storage for images'],
    watch: 'Image tokens depend on resolution and the model. Measure billable tokens on your own samples before trusting a preset.',
    idem: 'Inspection jobs: key = image SHA-256 + model version, stored in Valkey for 14 days; a re-uploaded identical image reuses the verdict.',
    s: () => merge(base(), {
      name: 'Visual inspection — 50,000 images/day', unit: 'image',
      workload: { users: 1, tasksPerDay: 50000, activeDays: 30, callsPerTask: 1, inTok: 1500, outTok: 100, retryPct: 3, peakFactor: 1.5, activeHours: 16 },
      serving: Object.assign({}, BW8, { minReplicas: 1, utilization: 0.7 }),
      platform: { objGB: 2000, db: 'vk-g7-4', dbNodes: 1 },
      network: { egressTB: 0.2 }
    })
  },
  {
    id: 'regional', group: 'AI', title: 'Regional assistants close to users', unitMetric: 'cost per region and per task',
    summary: 'One small inference cell per region on Akamai’s footprint, for latency or data residency.',
    drivers: ['Number of regions (minimum replicas)', 'Per-region peak, not global average', 'Load balancing per region'],
    blocks: ['RTX 4000 Ada per region', 'NodeBalancer per region', 'Global traffic steering in front'],
    watch: 'A minimum replica per region is a fixed cost even at low use. Compare against one central cell plus CDN acceleration.',
    idem: 'Cross-region failover: key = request_id from the client, stored in Valkey per region for 10 minutes; a retried request routed to another region is answered from cache when the first region already completed it.',
    s: () => merge(base(), {
      name: 'Assistants in 3 regions', unit: 'task',
      workload: { users: 3000, tasksPerDay: 4, activeDays: 30, callsPerTask: 1.5, inTok: 1500, outTok: 400, retryPct: 5, peakFactor: 3, activeHours: 14 },
      serving: { minReplicas: 3 },
      stages: [fixed('Regional app tier', 'g8-4x2', 3)],
      platform: { nbBasic: 3, objGB: 50, db: 'vk-g7-4', dbNodes: 1 },
      network: { egressTB: 0.5 }
    })
  },
  {
    id: 'eval', group: 'AI', title: 'Model evaluation and release assurance', unitMetric: 'cost per qualified release',
    summary: 'Test suites run against candidate models, with LLM judges and expert review before each release.',
    drivers: ['Test cases × candidates × repeats', 'Judge calls (often an external model)', 'Expert review time'],
    blocks: ['Elastic Blackwell for candidates', 'External judge share', 'Object Storage for traces'],
    watch: 'Separate initial model selection from recurring regression runs. The planner does not run evaluations or measure accuracy.',
    idem: 'Eval runs: key = suite_version + model_digest + seed, stored in PostgreSQL indefinitely; re-running the same key returns cached scores unless forced.',
    s: () => merge(base(), {
      name: 'Release evaluation — 4 releases/month', unit: 'test case',
      workload: { users: 1, tasksPerDay: 670, activeDays: 30, callsPerTask: 3, inTok: 2000, outTok: 500, retryPct: 0, peakFactor: 1, activeHours: 24 },
      routing: { linodeShare: 70 },
      serving: Object.assign({}, BW8, { provisioning: 'elastic', minReplicas: 0, utilization: 0.8 }),
      platform: { objGB: 500, db: 'pg-sh4', dbNodes: 1 },
      network: { egressTB: 0.05 },
      custom: [{ label: 'Expert review', amount: 3000, kind: 'recurring' }]
    })
  },

  // ---------------- Media AI workloads ----------------
  {
    id: 'm-live', group: 'Media', title: 'Live channels: VPU transcoding with AI captions', unitMetric: 'cost per channel-hour',
    summary: '24/7 linear channels transcoded to an ABR ladder on NETINT VPUs, with live speech-to-text captions on GPU.',
    drivers: ['Concurrent channels', 'Channels per VPU at your ladder', 'Live ASR streams per GPU', 'Origin egress to the CDN'],
    blocks: ['NETINT Quadra T1U Accelerated Linodes', 'RTX 4000 Ada for live ASR', 'G8 packagers/origin', 'Object Storage DVR window'],
    watch: 'A Quadra T1U is rated for 32× 1080p30; a full ladder per channel uses several 1080p30-equivalents, so 12 channels per VPU is a conservative start. Validate against your own ladder.',
    idem: 'Channel start/stop API: key = channel_id + desired_state + request nonce, stored in PostgreSQL for 24 h; a repeated start does not launch a second encoder.',
    s: () => merge(base(), {
      name: 'Live — 20 channels with captions', unit: 'channel-hour',
      workload: { users: 0, tasksPerDay: 0, activeDays: 30, callsPerTask: 0, mediaHours: 14600 },
      stages: [
        live('Live ABR transcoding', 'vpu-1s', 20, 12, 'channels'),
        live('Live ASR captions', 'ada-1m', 20, 8, 'audio streams'),
        fixed('Packager and origin', 'g8-8x4', 2)
      ],
      platform: { lke: 'ha', nbBasic: 1, objGB: 5000, db: 'pg-g7-4', dbNodes: 1 },
      network: { egressTB: 200 }
    })
  },
  {
    id: 'm-loc', group: 'Media', title: 'VOD captioning and subtitle translation', unitMetric: 'cost per content hour',
    summary: 'Library content transcribed on GPU, then subtitles translated into several languages by an LLM.',
    drivers: ['Content hours per month', 'Languages per title', 'Subtitle segments per hour'],
    blocks: ['Batch ASR on RTX 4000 Ada', 'Elastic LLM translation on Blackwell', 'Object Storage for masters and sidecars'],
    watch: 'Translation calls scale with languages × segments, not with hours alone. Human QC of subtitles is usually the largest custom line.',
    idem: 'Per-language jobs: key = asset_id + language + transcript SHA-256, stored in PostgreSQL, no expiry; a changed transcript produces a new key, an unchanged one is skipped.',
    s: () => merge(base(), {
      name: 'Localization — 3,000 content hours/month', unit: 'subtitle segment',
      workload: { users: 1, tasksPerDay: 30000, activeDays: 30, callsPerTask: 1, inTok: 600, outTok: 700, retryPct: 3, peakFactor: 1, activeHours: 24, mediaHours: 3000 },
      serving: Object.assign({}, BW8, { provisioning: 'elastic', minReplicas: 0, utilization: 0.8 }),
      stages: [batch('Speech-to-text (ASR)', 'ada-1m', 3000, 25, 'content hours')],
      platform: { objGB: 20000, db: 'pg-g7-4', dbNodes: 1 },
      network: { egressTB: 2 },
      custom: [{ label: 'Linguist QC (sampled)', amount: 4000, kind: 'recurring' }]
    })
  },
  {
    id: 'm-dub', group: 'Media', title: 'AI dubbing and voice localization', unitMetric: 'cost per dubbed hour',
    summary: 'ASR → translation → text-to-speech per language, then remux and transcode of the new audio tracks.',
    drivers: ['Dubbed hours = content hours × languages', 'TTS speed per GPU', 'Remux/transcode of outputs'],
    blocks: ['ASR and TTS on RTX 4000 Ada', 'LLM translation on Blackwell', 'VPU transcode of deliverables'],
    watch: 'Voice rights, consent and talent agreements sit outside infrastructure cost. Add them as custom lines.',
    idem: 'TTS segments: key = segment_id + voice_id + text SHA-256, stored in Object Storage metadata, no expiry; regenerating unchanged lines reuses the audio file.',
    s: () => merge(base(), {
      name: 'Dubbing — 500 hours into 3 languages', unit: 'translated segment',
      workload: { users: 1, tasksPerDay: 3000, activeDays: 30, callsPerTask: 1, inTok: 600, outTok: 700, retryPct: 5, peakFactor: 1, activeHours: 24, mediaHours: 1500 },
      serving: Object.assign({}, BW8, { provisioning: 'elastic', minReplicas: 0, utilization: 0.8 }),
      stages: [
        batch('Speech-to-text (ASR)', 'ada-1m', 500, 25, 'content hours'),
        batch('Text-to-speech voices', 'ada-1l', 1500, 6, 'dubbed hours'),
        batch('Transcode deliverables', 'vpu-1s', 1500, 16, 'content hours')
      ],
      platform: { objGB: 8000 },
      network: { egressTB: 3 },
      custom: [{ label: 'Voice talent licences and QC', amount: 6000, kind: 'recurring' }]
    })
  },
  {
    id: 'm-high', group: 'Media', title: 'Sports highlights and automated clipping', unitMetric: 'cost per event hour',
    summary: 'A vision-language model scores sampled frames for key moments; clips are cut and rendered on VPUs.',
    drivers: ['Event hours per month', 'Frame sampling rate', 'Clips rendered per event'],
    blocks: ['VLM on RTX PRO 6000 Blackwell', 'VPU clip rendering', 'Object Storage for clips'],
    watch: 'Frame rate is the biggest lever: 0.5 fps vs 2 fps is a 4× change in model calls. Sample adaptively around audio peaks.',
    idem: 'Clip renders: key = event_id + in/out timecodes + template version, stored in Valkey for 7 days; a duplicate request returns the existing clip URL.',
    s: () => merge(base(), {
      name: 'Highlights — 300 events × 3 h', unit: 'frame',
      workload: { users: 1, tasksPerDay: 54000, activeDays: 30, callsPerTask: 1, inTok: 900, outTok: 40, retryPct: 2, peakFactor: 3, activeHours: 10, mediaHours: 900 },
      serving: Object.assign({}, BW8, { provisioning: 'always', minReplicas: 1, utilization: 0.6 }),
      stages: [batch('Clip render and transcode', 'vpu-1s', 600, 16, 'content hours')],
      platform: { objGB: 3000, db: 'vk-g7-4', dbNodes: 1 },
      network: { egressTB: 20 }
    })
  },
  {
    id: 'm-ugc', group: 'Media', title: 'UGC moderation and metadata enrichment', unitMetric: 'cost per upload',
    summary: 'Every upload is transcoded, frame-sampled for policy checks, and tagged with searchable metadata.',
    drivers: ['Uploads per day and average length', 'Frames checked per upload', 'Transcode ladder per upload'],
    blocks: ['VPU transcode on upload', 'VLM moderation on Blackwell', 'Object Storage for renditions'],
    watch: 'Moderation false negatives carry risk beyond cost. Keep a human review line and sample its rate from your pilot.',
    idem: 'Upload pipeline: key = upload_id + stage, stored in PostgreSQL for 30 days; queue redelivery after a crash resumes at the first incomplete stage.',
    s: () => merge(base(), {
      name: 'UGC — 20,000 uploads/day', unit: 'upload',
      workload: { users: 1, tasksPerDay: 20000, activeDays: 30, callsPerTask: 37, inTok: 800, outTok: 60, retryPct: 3, peakFactor: 2, activeHours: 18, mediaHours: 30000 },
      serving: Object.assign({}, BW8, { minReplicas: 2, utilization: 0.65 }),
      stages: [batch('Upload transcode ladder', 'vpu-2s', 30000, 32, 'content hours')],
      platform: { lke: 'ha', nbBasic: 1, objGB: 30000, db: 'pg-g7-8', dbNodes: 2 },
      network: { egressTB: 150 },
      custom: [{ label: 'Human moderation escalations', amount: 8000, kind: 'recurring' }]
    })
  },
  {
    id: 'm-search', group: 'Media', title: 'Semantic video search', unitMetric: 'cost per search',
    summary: 'Shots are embedded into vectors stored in pgvector; viewers search the library in natural language.',
    drivers: ['New hours embedded per month', 'Vector store size for the full library', 'Search query volume'],
    blocks: ['Embedding stage on RTX 4000 Ada', 'PostgreSQL + pgvector', 'Small LLM for query rewriting'],
    watch: 'The library backlog is a one-time embedding job; price it separately from the monthly new-content run.',
    idem: 'Shot embeddings: key = asset_id + shot_index + embed_model_version, stored as a unique index on the vector table; re-ingest skips existing keys.',
    s: () => merge(base(), {
      name: 'Video search — 50,000-hour library', unit: 'search',
      workload: { users: 5000, tasksPerDay: 5, activeDays: 30, callsPerTask: 1, inTok: 300, outTok: 60, retryPct: 2, peakFactor: 3, activeHours: 14, mediaHours: 2000 },
      serving: { plan: 'ada-1s', minReplicas: 1 },
      stages: [batch('Shot embedding (new content)', 'ada-1s', 2000, 40, 'content hours')],
      platform: { lke: 'ha', nbBasic: 1, objGB: 1000, db: 'pg-g7-32', dbNodes: 2 },
      network: { egressTB: 0.5 },
      custom: [{ label: 'Backlog embedding (one-time)', amount: 1600, kind: 'onetime' }]
    })
  },
  {
    id: 'm-ssai', group: 'Media', title: 'SSAI ad-break detection and contextual targeting', unitMetric: 'cost per channel-hour',
    summary: 'Live channels classified every few seconds for ad-break suitability and context, feeding a manifest-manipulation SSAI tier.',
    drivers: ['Channels × classifications per hour', 'Session state for personalized manifests', 'Manifest tier sizing'],
    blocks: ['RTX 4000 Ada classifiers', 'G8 manifest manipulators', 'Valkey for session state'],
    watch: 'Manifest requests scale with viewers, not channels. Size the SSAI tier from concurrent sessions in your pilot.',
    idem: 'Ad decisions: key = session_id + break_id, stored in Valkey with a TTL equal to the break duration + 60 s; a retried manifest request gets the same pod instead of a new auction.',
    s: () => merge(base(), {
      name: 'SSAI — 50 live channels', unit: 'classification',
      workload: { users: 50, tasksPerDay: 8640, activeDays: 30, callsPerTask: 1, inTok: 600, outTok: 30, retryPct: 1, peakFactor: 1.2, activeHours: 24, mediaHours: 36500 },
      serving: { minReplicas: 1, utilization: 0.6 },
      stages: [fixed('Manifest manipulation tier', 'g8-16x8', 3)],
      platform: { lke: 'ha', nbPremium: 1, nbPremiumGB: 2000, db: 'vk-g7-8', dbNodes: 3 },
      network: { egressTB: 5 }
    })
  }
];

if (typeof module !== 'undefined') module.exports = { USE_CASES, base, merge };
