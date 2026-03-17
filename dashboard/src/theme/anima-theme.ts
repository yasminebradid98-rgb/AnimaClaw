/**
 * AnimaClaw Mission Control v1.7 - Brand Theme
 */

const animaTheme = {
  primary: process.env.ANIMA_BRAND_COLOR || '#6366f1',
  name: 'AnimaClaw Mission Control v1.7',
  footer: 'Built for Algeria Business Bay | riyad@ketami.net',
  logo: '/anima-logo.svg',
  hero: {
    headline: 'AI Agents That Actually Work',
    subheadline: 'Multi-provider, Multi-client, Multi-workflow',
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Deploy Agent',
  },
  tiers: {
    free: { label: 'Free', credits: 100, agents: 1, color: '#94a3b8' },
    pro: { label: 'Pro', credits: 5000, agents: -1, color: '#6366f1' },
    enterprise: { label: 'Enterprise', credits: -1, agents: -1, color: '#f59e0b' },
  },
} as const

export default animaTheme
