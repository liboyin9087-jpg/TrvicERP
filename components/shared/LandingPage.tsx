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

const FEATURE_LIST = [
  'Trip status control from inquiry to closeout',
  'Role-based views for staff, HR, and travelers',
  'Risk alerts for documents, payments, and deadlines',
  'AI copilots for itinerary, costing, and legal guidance',
];

const ROLE_CARDS = [
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
];

const CORE_CAPABILITIES = [
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
];

const STATS = [
  { label: 'Time-to-quote', value: '-38%' },
  { label: 'On-time docs', value: '+52%' },
  { label: 'Payment delays', value: '-41%' },
  { label: 'Team alignment', value: '+68%' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-900 text-white focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-accent flex items-center justify-center font-bold text-white focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              TM
            </div>
            <div>
              <div className="font-semibold text-lg">TravelMaster OS</div>
              <div className="text-sm text-slate-400">Group travel operations platform</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#roles" className="hover:text-white transition-colors">
              Roles
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#cta" className="hover:text-white transition-colors">
              Get Demo
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors"
            >
              Login
            </a>
            <a
              href="#cta"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
            >
              Book a demo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.22),_transparent_55%)] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
          <div className="max-w-6xl mx-auto px-6 py-20 relative">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm text-slate-100 border border-white/10 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Built for group travel operators
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mt-6">
                  Run group travel like a control tower.
                </h1>
                <p className="text-lg text-slate-300 mt-5 max-w-xl">
                  A vertical OS that connects quoting, execution, welfare enrollment, and traveler
                  experience. Every team sees the right controls, at the right time.
                </p>
                <div className="mt-6 grid gap-3 text-sm text-slate-200">
                  {FEATURE_LIST.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#cta"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                  >
                    Request demo
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#workflow"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-white hover:border-white/40 transition-colors"
                  >
                    See workflow
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 blur-3xl rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Operations Dashboard</span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
                      Live
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      {['Revenue', 'Docs', 'Payments'].map((label) => (
                        <div key={label} className="rounded-2xl bg-white/5 p-3 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                          <div className="text-sm text-slate-400">{label}</div>
                          <div className="text-lg font-semibold mt-2">92%</div>
                          <div className="text-[11px] text-accent mt-1">On track</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Upcoming departures</span>
                        <span>Next 14 days</span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        {['Tokyo 5D', 'Bali 4D', 'Kenting 2D'].map((trip) => (
                          <div key={trip} className="flex items-center justify-between">
                            <span>{trip}</span>
                            <span className="text-accent">Ready</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Risk alerts</span>
                        <span className="text-warning">2 pending</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Passport expiry</span>
                          <span className="text-warning">3 pax</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Final payment</span>
                          <span className="text-warning">2 orders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3 text-sm text-slate-400">
                    <Gauge className="w-4 h-4 text-accent" />
                    99.9% uptime • SOC-ready workflows
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-brand-900/80 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <div className="max-w-6xl mx-auto px-6 py-10 grid gap-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/5 p-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                <div className="text-2xl font-semibold">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="roles" className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm uppercase tracking-[0.2em] text-accent">
              Role-based experiences
            </div>
            <h2 className="text-3xl font-bold mt-4">Three roles, one unified workflow.</h2>
            <p className="text-slate-300 mt-4">
              Each persona sees the right tasks, without overwhelming screens or hidden risks.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ROLE_CARDS.map((role) => (
              <div key={role.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                <div className="flex items-center gap-2 text-accent text-sm">
                  <Users className="w-4 h-4" />
                  {role.title}
                </div>
                <h3 className="text-xl font-semibold mt-4">{role.summary}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="capabilities" className="bg-slate-900/40 border-y border-white/5 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-accent">
                  Capabilities
                </div>
                <h2 className="text-3xl font-bold mt-4">
                  Built for complex group travel operations.
                </h2>
                <p className="text-slate-300 mt-3 max-w-2xl">
                  Every module is designed to reduce manual coordination and keep teams aligned.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-300">
                <Zap className="w-4 h-4 text-accent" />
                AI copilots included
              </div>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {CORE_CAPABILITIES.map((capability) => {
                const Icon = capability.icon;
                return (
                  <div
                    key={capability.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="mt-4 font-semibold">{capability.title}</h3>
                    <p className="text-sm text-slate-300 mt-2">{capability.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm uppercase tracking-[0.2em] text-accent">
              Workflow alignment
            </div>
            <h2 className="text-3xl font-bold mt-4">Plan. Sell. Execute. Close.</h2>
            <p className="text-slate-300 mt-3">
              A single timeline keeps sales, ops, HR, and travelers on the same track.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { title: 'Plan', desc: 'Build itinerary, costing, and supplier options.' },
              { title: 'Sell', desc: 'Quote fast, align margin, get approvals.' },
              { title: 'Execute', desc: 'Docs, payments, and on-trip service.' },
              { title: 'Close', desc: 'Settlement, reports, and retention.' },
            ].map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <div className="text-sm text-accent">Step {index + 1}</div>
                <h3 className="text-lg font-semibold mt-2">{step.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="border-t border-white/5 bg-slate-950/80 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <div className="max-w-6xl mx-auto px-6 py-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <h2 className="text-3xl font-bold">Ready to modernize your group travel stack?</h2>
              <p className="text-slate-300 mt-4 max-w-xl">
                See how role-based operations, AI guidance, and smart dashboards keep every tour
                on track.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                >
                  Start with demo login
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="mailto:hello@travelmaster.io"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-white hover:border-white/40 transition-colors"
                >
                  Contact sales
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <div className="text-sm text-slate-300">Trusted by enterprise travel teams</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Policy and compliance templates</span>
                  <span className="text-accent">Included</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI copilots for ops + legal</span>
                  <span className="text-accent">Included</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vercel-ready deployment</span>
                  <span className="text-accent">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
