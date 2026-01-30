import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  Shield,
  Layers,
  Gauge,
  Users,
  Calendar,
  FileText,
  Map,
  LineChart,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- 1. Interfaces & Type Definitions ---

// Define types for each data structure
interface FeatureItem {
  text: string;
}

interface RoleCardData {
  title: string;
  summary: string;
  items: string[];
}

interface CapabilityItem {
  title: string;
  description: string;
  icon: LucideIcon; // Use LucideIcon type for dynamic icons
}

interface StatItem {
  label: string;
  value: string;
}

interface WorkflowStep {
  title: string;
  desc: string;
}

// Define the configuration interface for LandingPage,
// incorporating all static data that will now be passed via props.
interface LandingPageConfig {
  header: {
    logoText: string;
    logoSubtitle: string;
    navLinks: { href: string; label: string }[];
    loginLinkHref: string;
    demoCtaHref: string;
    demoCtaText: string;
  };
  hero: {
    tagline: string;
    heading: string;
    description: string;
    features: FeatureItem[];
    primaryCtaHref: string;
    primaryCtaText: string;
    secondaryCtaHref: string;
    secondaryCtaText: string;
    dashboardPreview: {
      statusLabel: string;
      metrics: { label: string; value: string; status: string }[];
      upcomingDeparturesTitle: string;
      upcomingDeparturesPeriod: string;
      upcomingDepartures: { name: string; status: string }[];
      riskAlertsTitle: string;
      riskAlertsSummary: string;
      riskAlerts: { label: string; count: string }[];
      footerText: string;
      footerIcon: LucideIcon;
    };
  };
  stats: StatItem[];
  roles: {
    sectionTitle: string; // Renamed to avoid conflict with `title` inside cards
    sectionSubtitle: string;
    sectionDescription: string;
    cards: RoleCardData[];
  };
  capabilities: {
    tagline: string;
    heading: string;
    description: string;
    extraFeatureText: string;
    extraFeatureIcon: LucideIcon;
    items: CapabilityItem[];
  };
  workflow: {
    tagline: string;
    heading: string;
    description: string;
    steps: WorkflowStep[];
  };
  cta: {
    heading: string;
    description: string;
    demoLoginCtaHref: string;
    demoLoginCtaText: string;
    contactSalesCtaHref: string;
    contactSalesCtaText: string;
    extraInfo: {
      title: string;
      items: { label: string; status: string }[];
    };
  };
}

// Props for the main LandingPage component
interface LandingPageProps {
  config?: LandingPageConfig; // Make config optional for default values
  isWidget?: boolean; // New prop to indicate if it's rendered as a widget
}

// --- 2. Default Configuration (Externalized Data) ---

// Default static data, now structured according to LandingPageConfig
const DEFAULT_LANDING_PAGE_CONFIG: LandingPageConfig = {
  header: {
    logoText: 'TM',
    logoSubtitle: 'TravelMaster',
    navLinks: [
      { href: '#roles', label: 'Roles' },
      { href: '#capabilities', label: 'Capabilities' },
      { href: '#workflow', label: 'Workflow' },
      { href: '#cta', label: 'Get Demo' },
    ],
    loginLinkHref: '/',
    demoCtaHref: '#cta',
    demoCtaText: 'Book a demo',
  },
  hero: {
    tagline: 'Built for group travel operators',
    heading: 'Run group travel like a control tower.',
    description: 'A vertical OS that connects quoting, execution, welfare enrollment, and traveler experience. Every team sees the right controls, at the right time.',
    features: [
      { text: 'Trip status control from inquiry to closeout' },
      { text: 'Role-based views for staff, HR, and travelers' },
      { text: 'Risk alerts for documents, payments, and deadlines' },
      { text: 'AI copilots for itinerary, costing, and legal guidance' },
    ],
    primaryCtaHref: '#cta',
    primaryCtaText: 'Request demo',
    secondaryCtaHref: '#workflow',
    secondaryCtaText: 'See workflow',
    dashboardPreview: {
      statusLabel: 'Operations Dashboard',
      metrics: [
        { label: 'Revenue', value: '92%', status: 'On track' },
        { label: 'Docs', value: '92%', status: 'On track' },
        { label: 'Payments', value: '92%', status: 'On track' },
      ],
      upcomingDeparturesTitle: 'Upcoming departures',
      upcomingDeparturesPeriod: 'Next 14 days',
      upcomingDepartures: [
        { name: 'Tokyo 5D', status: 'Ready' },
        { name: 'Bali 4D', status: 'Ready' },
        { name: 'Kenting 2D', status: 'Ready' },
      ],
      riskAlertsTitle: 'Risk alerts',
      riskAlertsSummary: '2 pending',
      riskAlerts: [
        { label: 'Passport expiry', count: '3 pax' },
        { label: 'Final payment', count: '2 orders' },
      ],
      footerText: '99.9% uptime • SOC-ready workflows',
      footerIcon: Gauge,
    },
  },
  stats: [
    { label: 'Time-to-quote', value: '-38%' },
    { label: 'On-time docs', value: '+52%' },
    { label: 'Payment delays', value: '-41%' },
    { label: 'Team alignment', value: '+68%' },
  ],
  roles: {
    sectionTitle: 'Role-based experiences',
    sectionSubtitle: 'Three roles, one unified workflow.',
    sectionDescription: 'Each persona sees the right tasks, without overwhelming screens or hidden risks.',
    cards: [
      {
        title: 'Agency Ops / Admin',
        summary: 'Profit, risk, and execution controls in one cockpit.',
        items: ['Margin and cost radar', 'Supplier and contract hub', 'Exception alerts'],
      },
      {
        title: 'HR / Welfare Committee',
        summary: 'Enrollment clarity, subsidy transparency, and comms at scale.',
        items: ['Registration pipeline', 'Subsidy policy engine', 'Bulk notifications'],
      },
      {
        title: 'Traveler / Employee',
        summary: 'Mobile-first signup, clear schedules, zero confusion.',
        items: ['One-tap registration', 'Personal trip timeline', 'Smart reminders'],
      },
    ],
  },
  capabilities: {
    tagline: 'Capabilities',
    heading: 'Built for complex group travel operations.',
    description: 'Every module is designed to reduce manual coordination and keep teams aligned.',
    extraFeatureText: 'AI copilots included',
    extraFeatureIcon: Zap,
    items: [
      {
        title: 'Operational Timeline',
        description: 'Every trip has a timeline with risk checkpoints.',
        icon: Calendar,
      },
      {
        title: 'Document Readiness',
        description: 'Track passport, visa, insurance, and required forms.',
        icon: FileText,
      },
      {
        title: 'Smart Navigation',
        description: 'Jump from alerts directly to the exact task.',
        icon: Map,
      },
      {
        title: 'Revenue Intelligence',
        description: 'KPI snapshots and margin variance analysis.',
        icon: LineChart,
      },
      {
        title: 'Secure Governance',
        description: 'Audit-ready logs and permission controls.',
        icon: Shield,
      },
      {
        title: 'Composable Widgets',
        description: 'Drag-and-drop dashboards for every role.',
        icon: Layers,
      },
    ],
  },
  workflow: {
    tagline: 'Workflow alignment',
    heading: 'Plan. Sell. Execute. Close.',
    description: 'A single timeline keeps sales, ops, HR, and travelers on the same track.',
    steps: [
      { title: 'Plan', desc: 'Build itinerary, costing, and supplier options.' },
      { title: 'Sell', desc: 'Quote fast, align margin, get approvals.' },
      { title: 'Execute', desc: 'Docs, payments, and on-trip service.' },
      { title: 'Close', desc: 'Settlement, reports, and retention.' },
    ],
  },
  cta: {
    heading: 'Ready to modernize your group travel stack?',
    description: 'See how role-based operations, AI guidance, and smart dashboards keep every tour on track.',
    demoLoginCtaHref: '/',
    demoLoginCtaText: 'Start with demo login',
    contactSalesCtaHref: 'mailto:hello@travelmaster.io',
    contactSalesCtaText: 'Contact sales',
    extraInfo: {
      title: 'Trusted by enterprise travel teams',
      items: [
        { label: 'Policy and compliance templates', status: 'Included' },
        { label: 'AI copilots for ops + legal', status: 'Included' },
        { label: 'Vercel-ready deployment', status: 'Ready' },
      ],
    },
  },
};

// --- 3. Sub-Components (Adhering to Single Responsibility) ---

// Reusable Button styles for consistency and Dashtail UI compliance
const PrimaryButton: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
  <a
    href={href}
    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-accent-700 ${className || ''}`}
  >
    {children}
  </a>
);

const SecondaryButton: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
  <a
    href={href}
    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-700 text-gray-100 hover:border-gray-600 transition-colors focus:ring-2 focus:ring-primary-300 ${className || ''}`}
  >
    {children}
  </a>
);

const NavButton: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
  <a
    href={href}
    className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:text-gray-50 transition-colors focus:ring-2 focus:ring-primary-300 ${className || ''}`}
  >
    {children}
  </a>
);

// Header Component
const LandingPageHeader: React.FC<LandingPageConfig['header']> = ({
  logoText,
  logoSubtitle,
  navLinks,
  loginLinkHref,
  demoCtaHref,
  demoCtaText,
}) => (
  <header className="border-b border-gray-800">
    <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center font-bold text-white">
          {logoText}
        </div>
        <div>
          <div className="font-semibold text-lg text-gray-50">{logoSubtitle}</div>
          <div className="text-sm text-gray-400">Group travel operations platform</div>
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className="hover:text-gray-50 transition-colors focus:ring-2 focus:ring-primary-300">
            {link.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <NavButton href={loginLinkHref}>Login</NavButton>
        <PrimaryButton href={demoCtaHref} className="px-4 py-2 text-sm">
          {demoCtaText}
          <ArrowRight className="w-4 h-4" />
        </PrimaryButton>
      </div>
    </div>
  </header>
);

// Hero Section Component
const HeroSection: React.FC<LandingPageConfig['hero']> = ({
  tagline,
  heading,
  description,
  features,
  primaryCtaHref,
  primaryCtaText,
  secondaryCtaHref,
  secondaryCtaText,
  dashboardPreview,
}) => (
  <section className="relative overflow-hidden">
    {/* Using accent-500 RGB for consistency in arbitrary gradient value */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_55%)]" />
    <div className="max-w-6xl mx-auto px-6 py-20 relative">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/20 text-sm text-gray-100 border border-gray-700 focus:ring-2 focus:ring-primary-300">
            <Sparkles className="w-4 h-4 text-accent-500" />
            {tagline}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mt-6 text-gray-50">
            {heading}
          </h1>
          <p className="text-lg text-gray-300 mt-5 max-w-xl">
            {description}
          </p>
          <div className="mt-6 grid gap-3 text-sm text-gray-200">
            {features.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-accent-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton href={primaryCtaHref}>
              {primaryCtaText}
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
            <SecondaryButton href={secondaryCtaHref}>
              {secondaryCtaText}
            </SecondaryButton>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent-500/20 blur-3xl rounded-full" />
          <div className="rounded-3xl border border-gray-700 bg-gray-900/70 p-6 shadow-2xl">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{dashboardPreview.statusLabel}</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-500" />
                Live
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                {dashboardPreview.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-gray-800/5 p-3">
                    <div className="text-sm text-gray-400">{metric.label}</div>
                    <div className="text-lg font-semibold mt-2 text-gray-50">{metric.value}</div>
                    <div className="text-xs text-accent-500 mt-1">{metric.status}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-gray-800/5 p-4">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{dashboardPreview.upcomingDeparturesTitle}</span>
                  <span>{dashboardPreview.upcomingDeparturesPeriod}</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-gray-200">
                  {dashboardPreview.upcomingDepartures.map((trip) => (
                    <div key={trip.name} className="flex items-center justify-between">
                      <span>{trip.name}</span>
                      <span className="text-accent-500">{trip.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gray-800/5 p-4">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{dashboardPreview.riskAlertsTitle}</span>
                  <span className="text-warning-500">{dashboardPreview.riskAlertsSummary}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-200">
                  {dashboardPreview.riskAlerts.map((alert) => (
                    <div key={alert.label} className="flex items-center justify-between">
                      <span>{alert.label}</span>
                      <span className="text-warning-500">{alert.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 text-sm text-gray-400">
              <dashboardPreview.footerIcon className="w-4 h-4 text-accent-500" />
              {dashboardPreview.footerText}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Stats Section Component
const StatsSection: React.FC<{ stats: StatItem[] }> = ({ stats }) => (
  <section className="border-y border-gray-800 bg-primary-900/80">
    <div className="max-w-6xl mx-auto px-6 py-10 grid gap-6 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-gray-800/5 p-4">
          <div className="text-2xl font-semibold text-gray-50">{stat.value}</div>
          <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  </section>
);

// Roles Section Component
const RolesSection: React.FC<Omit<LandingPageConfig['roles'], 'cards'> & { cards: RoleCardData[] }> = ({ sectionTitle, sectionSubtitle, sectionDescription, cards }) => (
  <section id="roles" className="max-w-6xl mx-auto px-6 py-16">
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-sm uppercase tracking-[0.2em] text-accent-500">
        {sectionTitle}
      </div>
      <h2 className="text-3xl font-bold mt-4 text-gray-50">{sectionSubtitle}</h2>
      <p className="text-gray-300 mt-4">{sectionDescription}</p>
    </div>
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {cards.map((role) => (
        <div key={role.title} className="rounded-3xl border border-gray-700 bg-gray-800/5 p-6">
          <div className="flex items-center gap-2 text-accent-500 text-sm">
            <Users className="w-4 h-4" />
            {role.title}
          </div>
          <h3 className="text-xl font-semibold mt-4 text-gray-50">{role.summary}</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            {role.items.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

// Capabilities Section Component
const CapabilitiesSection: React.FC<LandingPageConfig['capabilities']> = ({
  tagline,
  heading,
  description,
  extraFeatureText,
  extraFeatureIcon: ExtraFeatureIcon,
  items,
}) => (
  <section id="capabilities" className="bg-gray-900/40 border-y border-gray-800">
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-accent-500">
            {tagline}
          </div>
          <h2 className="text-3xl font-bold mt-4 text-gray-50">
            {heading}
          </h2>
          <p className="text-gray-300 mt-3 max-w-2xl">
            {description}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-gray-300">
          <ExtraFeatureIcon className="w-4 h-4 text-accent-500" />
          {extraFeatureText}
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((capability) => {
          const Icon = capability.icon;
          return (
            <div
              key={capability.title}
              className="rounded-2xl border border-gray-700 bg-gray-950/60 p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-500/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent-500" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-50">{capability.title}</h3>
              <p className="text-sm text-gray-300 mt-2">{capability.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// Workflow Section Component
const WorkflowSection: React.FC<LandingPageConfig['workflow']> = ({ tagline, heading, description, steps }) => (
  <section id="workflow" className="max-w-6xl mx-auto px-6 py-16">
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-sm uppercase tracking-[0.2em] text-accent-500">
        {tagline}
      </div>
      <h2 className="text-3xl font-bold mt-4 text-gray-50">{heading}</h2>
      <p className="text-gray-300 mt-3">{description}</p>
    </div>
    <div className="mt-12 grid gap-6 md:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-2xl border border-gray-700 bg-gray-800/5 p-5">
          <div className="text-sm text-accent-500">Step {index + 1}</div>
          <h3 className="text-lg font-semibold mt-2 text-gray-50">{step.title}</h3>
          <p className="text-sm text-gray-300 mt-2">{step.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// CTA Section Component
const CtaSection: React.FC<LandingPageConfig['cta']> = ({
  heading,
  description,
  demoLoginCtaHref,
  demoLoginCtaText,
  contactSalesCtaHref,
  contactSalesCtaText,
  extraInfo,
}) => (
  <section id="cta" className="border-t border-gray-800 bg-gray-950/80">
    <div className="max-w-6xl mx-auto px-6 py-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
      <div>
        <h2 className="text-3xl font-bold text-gray-50">{heading}</h2>
        <p className="text-gray-300 mt-4 max-w-xl">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton
            href={demoLoginCtaHref}
            className="bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200 focus:ring-primary-300"
          >
            {demoLoginCtaText}
            <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
          <SecondaryButton href={contactSalesCtaHref}>
            {contactSalesCtaText}
          </SecondaryButton>
        </div>
      </div>
      <div className="rounded-3xl border border-gray-700 bg-gray-800/5 p-6">
        <div className="text-sm text-gray-300">{extraInfo.title}</div>
        <div className="mt-4 grid gap-3 text-sm text-gray-400">
          {extraInfo.items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span>{item.label}</span>
              <span className="text-accent-500">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);


// --- 4. Main LandingPage Component ---

export default function LandingPage({ config = DEFAULT_LANDING_PAGE_CONFIG, isWidget = false }: LandingPageProps) {
  const content = (
    <>
      <LandingPageHeader {...config.header} />
      <main>
        <HeroSection {...config.hero} />
        <StatsSection stats={config.stats} />
        <RolesSection {...config.roles} />
        <CapabilitiesSection {...config.capabilities} />
        <WorkflowSection {...config.workflow} />
        <CtaSection {...config.cta} />
      </main>
    </>
  );

  if (isWidget) {
    // Standard Card structure for a draggable Widget
    return (
      <div className="rounded-xl border border-gray-700 bg-primary-900 shadow-lg text-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-50">TravelMaster Landing Page</h2>
          <div className="drag-handle p-2 cursor-grab text-gray-400 hover:text-gray-50">
            {/* Standard drag handle icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-theme(spacing.16))] custom-scroll"> {/* Adjust max-height and add custom scroll for widget content */}
          {content}
        </div>
      </div>
    );
  }

  // Default full-page layout
  return (
    <div className="min-h-screen bg-primary-900 text-gray-100">
      {content}
    </div>
  );
}