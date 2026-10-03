export const landingContent = {
  productName: 'Victor Job OS',
  tagline: 'Your job search, running like a system.',
  heroSupport:
    'Discover relevant developer opportunities, qualify them, prepare personalized outreach and applications, and keep the entire job search organized in one place.',
  heroCtaPrimary: 'Open Job OS',
  heroCtaSecondary: 'See how it works',
  problem:
    'The work is rarely just finding a job. It is everything that happens around the job.',
  workflowHeading: 'From opportunity to action.',
  workflow: [
    {
      step: '01',
      title: 'Discover',
      description: 'Find opportunities from supported job sources.',
    },
    {
      step: '02',
      title: 'Qualify',
      description: "Determine whether an opportunity is relevant to Victor's profile and preferences.",
    },
    {
      step: '03',
      title: 'Research',
      description: 'Collect useful company and opportunity context.',
    },
    {
      step: '04',
      title: 'Match',
      description: 'Identify relevant projects, experience, skills, and evidence.',
    },
    {
      step: '05',
      title: 'Prepare',
      description: 'Draft personalized outreach and application materials.',
    },
    {
      step: '06',
      title: 'Review',
      description: 'Victor reviews and approves consequential actions.',
    },
    {
      step: '07',
      title: 'Send / Apply',
      description: 'Execute approved outreach or application workflows.',
    },
    {
      step: '08',
      title: 'Track',
      description: 'Record the outcome and next action.',
    },
  ] as const,
  capabilities: [
    {
      title: 'Opportunity Intelligence',
      items: [
        'Opportunity discovery',
        'Job source aggregation',
        'Deduplication',
        'Qualification',
        'Fit analysis',
      ],
    },
    {
      title: 'Research',
      items: [
        'Company research',
        'Contact discovery',
        'Opportunity context',
        'Relevant project matching',
      ],
    },
    {
      title: 'Outreach',
      items: [
        'Personalized drafts',
        'Email review',
        'Approval workflow',
        'Sending',
        'Delivery tracking',
      ],
    },
    {
      title: 'Applications',
      items: [
        'Application preparation',
        'Resume context',
        'Cover letters',
        'Application questions',
        'Submission tracking',
      ],
    },
    {
      title: 'Operations',
      items: [
        'Activity timeline',
        'Follow-ups',
        'Analytics',
        'Automation monitoring',
        'Settings',
      ],
    },
  ] as const,
  automationHandles: [
    'Discovering opportunities',
    'Normalizing job data',
    'Deduplicating opportunities',
    'Qualification',
    'Research preparation',
    'Outreach drafting',
    'Application preparation',
    'Activity recording',
  ],
  humanControls: [
    'Approving outreach',
    'Approving applications',
    'Editing generated content',
    'Choosing whether to pursue an opportunity',
    'Confirming browser automation',
    'Changing preferences',
  ],
  profile: {
    title: 'Built around you',
    description:
      'The system works from a structured professional profile — skills, experience, projects, portfolio, technologies, preferred roles, locations, work preferences, and outreach style.',
    dimensions: [
      'Skills',
      'Experience',
      'Projects',
      'Portfolio',
      'Technologies',
      'Preferred roles',
      'Preferred locations',
      'Work preferences',
      'Outreach style',
    ],
  },
  technology: ['React', 'Firebase', 'Firestore', 'Node.js', 'Cloud Functions', 'shadcn/ui', 'Framer Motion'],
  finalCta: {
    heading: 'Turn your job search into an operating system.',
    support:
      'Discover opportunities, prepare better actions, and keep every application and conversation in one place.',
    cta: 'Open Victor Job OS',
  },
} as const