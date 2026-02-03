import React from 'react';
import { ArrowLeft, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WidgetType } from '@/components/dashboard/widgetRegistry';
import DepartureBoardWidget from '@/components/dashboard/widgets/DepartureBoardWidget';
import PassportTrackerWidget from '@/components/dashboard/widgets/PassportTrackerWidget';
import JourneyTimelineWidget from '@/components/dashboard/widgets/JourneyTimelineWidget';
import WorldMapWidget from '@/components/dashboard/widgets/WorldMapWidget';
import RevenueCompassWidget from '@/components/dashboard/widgets/RevenueCompassWidget';
import TrvicLogo from '@/components/shared/TrvicLogo';
import { EmptyState } from '@/components/shared/EmptyStateIllustrations';

/**
 * Travel Widgets Showcase Page
 * Demonstrates all the new travel-themed widgets
 */
export default function TravelWidgetsShowcase() {
  const widgets = [
    {
      id: 'departure-board',
      name: 'Departure Board',
      description: 'Airport-style departure information display',
      component: DepartureBoardWidget,
    },
    {
      id: 'passport-tracker',
      name: 'Passport Tracker',
      description: 'Track passport expiry dates',
      component: PassportTrackerWidget,
    },
    {
      id: 'journey-timeline',
      name: 'Journey Timeline',
      description: 'Visual journey timeline',
      component: JourneyTimelineWidget,
    },
    {
      id: 'world-map',
      name: 'World Map',
      description: 'Interactive destination map',
      component: WorldMapWidget,
    },
    {
      id: 'revenue-compass',
      name: 'Revenue Compass',
      description: 'Circular revenue dashboard',
      component: RevenueCompassWidget,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div className="h-8 w-px bg-slate-200" />
              <TrvicLogo size="md" showTagline={true} />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h1 className="text-lg font-bold text-slate-800">Travel Widgets Showcase</h1>
                <p className="text-xs text-slate-600">Week 1: Visual Transformation</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-brand-sky to-brand-ocean rounded-full flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Introduction */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            🎨 TrvicERP Travel Theme Transformation
          </h2>
          <p className="text-slate-600 mb-4">
            Explore our new travel-themed dashboard widgets designed to bring a modern, 
            engaging visual experience to travel management. Each widget is crafted with 
            attention to detail and follows our travel design system.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-brand-ocean">5</div>
              <div className="text-xs text-slate-600 mt-1">New Widgets</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-travel-sunset">15</div>
              <div className="text-xs text-slate-600 mt-1">Color Tokens</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-travel-forest">6</div>
              <div className="text-xs text-slate-600 mt-1">Animations</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
              <div className="text-2xl font-bold text-travel-lavender">3</div>
              <div className="text-xs text-slate-600 mt-1">Brand Elements</div>
            </div>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {widgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div
                key={widget.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{widget.name}</h3>
                  <p className="text-sm text-slate-600">{widget.description}</p>
                </div>
                <div className="h-96 rounded-xl overflow-hidden">
                  <WidgetComponent
                    widget={{
                      id: widget.id,
                      type: widget.id as WidgetType,
                      title: widget.name,
                      config: {},
                      layout: { i: widget.id, x: 0, y: 0, w: 4, h: 4 },
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty States Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Empty State Illustrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-slate-200 rounded-xl p-4">
              <EmptyState type="customers" />
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <EmptyState type="sessions" />
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <EmptyState type="orders" />
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <EmptyState type="quotes" />
            </div>
          </div>
        </div>

        {/* Logo Variations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Logo Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-4 p-6 border border-slate-200 rounded-xl">
              <TrvicLogo size="sm" showTagline={false} />
              <span className="text-xs text-slate-600">Small</span>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 border border-slate-200 rounded-xl">
              <TrvicLogo size="md" showTagline={true} />
              <span className="text-xs text-slate-600">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 border border-slate-200 rounded-xl">
              <TrvicLogo size="lg" showTagline={true} />
              <span className="text-xs text-slate-600">Large</span>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 border border-slate-200 rounded-xl">
              <TrvicLogo size="xl" showTagline={true} />
              <span className="text-xs text-slate-600">Extra Large</span>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Travel Color Palette</h2>
          
          {/* Brand Colors */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Brand Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow-md" style={{ backgroundColor: '#60a5fa' }} />
                <div>
                  <div className="text-sm font-medium text-slate-800">Sky</div>
                  <div className="text-xs text-slate-500">#60a5fa</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow-md" style={{ backgroundColor: '#3b82f6' }} />
                <div>
                  <div className="text-sm font-medium text-slate-800">Ocean</div>
                  <div className="text-xs text-slate-500">#3b82f6</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow-md" style={{ backgroundColor: '#2563eb' }} />
                <div>
                  <div className="text-sm font-medium text-slate-800">Deep</div>
                  <div className="text-xs text-slate-500">#2563eb</div>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Auxiliary Colors */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Travel Auxiliary Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Sunrise', color: '#fb923c' },
                { name: 'Sunset', color: '#f97316' },
                { name: 'Sand', color: '#fbbf24' },
                { name: 'Forest', color: '#10b981' },
                { name: 'Coral', color: '#ef4444' },
                { name: 'Lavender', color: '#a855f7' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-md" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="text-xs font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-slate-600">
            TrvicERP Travel Theme Transformation - Week 1 Implementation
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Made with ❤️ for modern travel management
          </p>
        </div>
      </footer>
    </div>
  );
}
