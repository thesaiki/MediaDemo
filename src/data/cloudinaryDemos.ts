export type DemoCategory =
  | 'Video'
  | 'AI & Agents'
  | 'Assets (DAM)'
  | 'Images'
  | 'Optimization'
  | 'Manipulation'
  | 'Players & Widgets'
  | 'Delivery'

export interface CloudinaryDemo {
  title: string
  description: string
  category: DemoCategory
  url: string
  /** Especially relevant to the Akamai media-delivery story */
  mediaRelevant?: boolean
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  'Video',
  'AI & Agents',
  'Assets (DAM)',
  'Images',
  'Optimization',
  'Manipulation',
  'Players & Widgets',
  'Delivery',
]

export const CLOUDINARY_DEMOS: CloudinaryDemo[] = [
  // ---- Video ----
  {
    title: 'Adaptive Bitrate Streaming',
    description: 'Content-aware encoding adjusts video quality in real time for smooth streaming.',
    category: 'Video',
    url: 'https://videoapi.cloudinary.com/video-demo/adaptive-bitrate',
    mediaRelevant: true,
  },
  {
    title: 'Dynamic Video Transcoding',
    description: 'Transcode videos to optimal formats based on device, browser, and network speed.',
    category: 'Video',
    url: 'https://videoapi.cloudinary.com/video-demo/video-optimization',
    mediaRelevant: true,
  },
  {
    title: 'AI Transcription and Chaptering',
    description: 'Auto-generate transcripts and chapters upon upload.',
    category: 'Video',
    url: 'https://cloudinary.com/demo/video-transcription-chapters',
    mediaRelevant: true,
  },
  {
    title: 'Video Smart Cropping',
    description: 'Crop and resize videos using AI to adapt for mobile and social formats.',
    category: 'Video',
    url: 'https://videoapi.cloudinary.com/video-demo/video-smart-cropping',
    mediaRelevant: true,
  },
  {
    title: 'Automatic Video Previews',
    description: 'Generate video previews with engaging scenes using deep learning.',
    category: 'Video',
    url: 'https://videoapi.cloudinary.com/video-demo/video-previews',
    mediaRelevant: true,
  },
  {
    title: 'Video Transformations',
    description: 'Enhance, edit, or personalize videos at scale.',
    category: 'Video',
    url: 'https://videoapi.cloudinary.com/video-demo/video-transformations',
    mediaRelevant: true,
  },
  {
    title: 'Video Moderation',
    description: 'Moderate videos to flag unsafe content across frames, noncompliant text or URLs, and metadata checks.',
    category: 'Video',
    url: 'https://cloudinary.com/demo/video-moderation',
  },
  {
    title: 'Image to Video',
    description: 'Transform your image library into video content with AI — and scale production without scaling costs.',
    category: 'Video',
    url: 'https://cloudinary.com/demo/image-to-video',
  },
  {
    title: 'Zoom & Pan',
    description: 'Bring static images to life with dynamic zoom and pan effects.',
    category: 'Video',
    url: 'https://videoapi.cloudinary.com/video-demo/zoom-and-pan',
  },

  // ---- AI & Agents ----
  {
    title: 'Moderation Agent',
    description: 'Automatically validate visual content for quality, authenticity, and compliance so nothing off-brand reaches your audience.',
    category: 'AI & Agents',
    url: 'https://cloudinary.com/demo/moderation',
  },
  {
    title: 'Workflow Agent',
    description: 'Turn plain-language intent into enterprise-grade image and video workflows.',
    category: 'AI & Agents',
    url: 'https://cloudinary.com/demo/workflow',
  },
  {
    title: 'Search Agent',
    description: 'Find the right, safe-to-use assets in seconds — without knowing your DAM schema — using natural language.',
    category: 'AI & Agents',
    url: 'https://cloudinary.com/demo/search',
  },
  {
    title: 'Taxonomy Agent',
    description: 'Build and maintain a taxonomy that matches your business, so assets stay findable, consistent, and safe to evolve.',
    category: 'AI & Agents',
    url: 'https://cloudinary.com/demo/taxonomy',
  },
  {
    title: 'Generative Upscale',
    description: 'Enhance image sizes with ease, growing them to virtually any size without artifacts or imperfections.',
    category: 'AI & Agents',
    url: 'https://cloudinary.com/demo/upscale',
  },
  {
    title: 'Gen Background Replace',
    description: 'Transform old product and hero shots by generating entirely new backgrounds at scale with GenAI.',
    category: 'AI & Agents',
    url: 'https://cloudinary.com/demo/generative-background-replace',
  },
  {
    title: 'Generative Fill',
    description: "Extend an image's proportions with AI outpainting.",
    category: 'AI & Agents',
    url: 'https://ai.cloudinary.com/demos/fill',
  },
  {
    title: 'Generative Restore',
    description: 'Remove noise and imperfections from an image.',
    category: 'AI & Agents',
    url: 'https://ai.cloudinary.com/demos/restore',
  },
  {
    title: 'Generative Captions',
    description: 'Image-to-text models provide contextual descriptions of an image.',
    category: 'AI & Agents',
    url: 'https://ai.cloudinary.com/demos/captions',
  },
  {
    title: 'Generative Recolor',
    description: 'Detect objects with natural language and change their color.',
    category: 'AI & Agents',
    url: 'https://ai.cloudinary.com/demos/recolor',
  },
  {
    title: 'Generative Replace',
    description: 'Detect and replace one object with another inside of an image.',
    category: 'AI & Agents',
    url: 'https://ai.cloudinary.com/demos/replace',
  },
  {
    title: 'Generative Remove',
    description: 'Detect and remove objects within images.',
    category: 'AI & Agents',
    url: 'https://ai.cloudinary.com/demos/remove',
  },

  // ---- Assets (DAM) ----
  {
    title: 'Advanced Search',
    description: 'Find and discover assets with visual search and other advanced search capabilities.',
    category: 'Assets (DAM)',
    url: 'https://cloudinary.com/demo/advanced-search',
  },
  {
    title: 'Upload Preset',
    description: 'Pre-define asset upload options to maintain uniformity and compliance.',
    category: 'Assets (DAM)',
    url: 'https://cloudinary.com/demo/upload-preset',
  },
  {
    title: 'Cloudinary Portals Front End',
    description: 'User experience engaging with portals for brand guidelines and content sharing.',
    category: 'Assets (DAM)',
    url: 'https://cloudinary.com/demo/creative-review-portals',
  },
  {
    title: 'Creative Review: Creation',
    description: 'Create creative review and approval flows.',
    category: 'Assets (DAM)',
    url: 'https://cloudinary.com/demo/creative-review-creation',
  },
  {
    title: 'Creative Review: Proofs',
    description: 'View and comment on creative proofs.',
    category: 'Assets (DAM)',
    url: 'https://cloudinary.com/demo/creative-review-proofs',
  },

  // ---- Images ----
  {
    title: 'Automatic Cropping for All Devices',
    description: 'Intelligently crop images based on content and device display dimensions.',
    category: 'Images',
    url: 'https://cloudinary.com/demo/c_auto',
  },

  // ---- Optimization ----
  {
    title: 'Multi-CDN',
    description: 'Dynamically switch between CDN providers to route traffic on the fastest-possible path.',
    category: 'Optimization',
    url: 'https://demo.cloudinary.com/multi-cdn',
    mediaRelevant: true,
  },
  {
    title: 'Content-Aware Image Encoding',
    description: 'Automatically adjust the encoding settings based on the image content and viewing context.',
    category: 'Optimization',
    url: 'https://demo.cloudinary.com/auto-quality',
  },
  {
    title: 'Low-Quality Image Placeholders',
    description: 'Dynamically generate and deliver low-quality placeholders while the high-quality image loads.',
    category: 'Optimization',
    url: 'https://demo.cloudinary.com/cloudydesk/lqip/',
  },
  {
    title: 'Responsive Breakpoints Generator',
    description: 'Optimal image breakpoints necessary for delivering a responsive experience.',
    category: 'Optimization',
    url: 'https://www.responsivebreakpoints.com/',
  },

  // ---- Manipulation ----
  {
    title: 'Image Manipulation',
    description: 'Dynamically create multiple image variants across multiple devices and channels.',
    category: 'Manipulation',
    url: 'https://demo.cloudinary.com/default',
  },
  {
    title: 'Content-Aware Image Cropping',
    description: 'Automatically crop images using AI-based content recognition to focus on important aspects.',
    category: 'Manipulation',
    url: 'https://demo.cloudinary.com/auto-gravity',
  },

  // ---- Players & Widgets ----
  {
    title: 'Media Library Widget',
    description: 'Explore embedding the Media Library in your app as a modal dialog or inline.',
    category: 'Players & Widgets',
    url: 'https://media-library-widget-demo.cloudinary.com/',
  },
  {
    title: 'Upload Widget',
    description: 'Embed a custom upload widget in your applications for a seamless upload experience.',
    category: 'Players & Widgets',
    url: 'https://demo.cloudinary.com/uw',
  },

  // ---- Delivery ----
  {
    title: 'Product Gallery',
    description: 'Engage users with an interactive product gallery, optimized for browsing on any screen.',
    category: 'Delivery',
    url: 'https://demo.cloudinary.com/product-gallery/',
    mediaRelevant: true,
  },
]

export const CATEGORY_COLORS: Record<DemoCategory, string> = {
  'Video': 'bg-blue-50 text-blue-700 border-blue-200',
  'AI & Agents': 'bg-purple-50 text-purple-700 border-purple-200',
  'Assets (DAM)': 'bg-amber-50 text-amber-700 border-amber-200',
  'Images': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Optimization': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Manipulation': 'bg-pink-50 text-pink-700 border-pink-200',
  'Players & Widgets': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Delivery': 'bg-orange-50 text-orange-700 border-orange-200',
}
