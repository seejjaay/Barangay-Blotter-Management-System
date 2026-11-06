import { Sidebar } from "@/components/dashboard/sidebar"
import { PageHeader } from "@/components/dashboard/page-header"
import { HeroBanner } from "@/components/dashboard/hero-banner"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { ReportsLineChart } from "@/components/dashboard/reports-line-chart"
import { IncidentTypeBarChart } from "@/components/dashboard/incident-type-bar-chart"
import { HeatMapPlaceholder } from "@/components/dashboard/heat-map-placeholder"
import { RecentIncidentsTable } from "@/components/dashboard/recent-incidents-table"
import Link from "next/link"

// Month/year labels are computed per request instead of frozen at build time.
export const dynamic = "force-dynamic"

const monthYear = () =>
  new Date().toLocaleString("en-US", { month: "long", year: "numeric" })

function SectionHeader({ title, count, linkRef, linkText = "Tingnan Lahat" }: { title: string, count?: number, linkRef?: string, linkText?: string }) {
  return (
    <div className="flex items-end justify-between mb-5 mt-10 border-b border-border pb-3">
      <div>
        <h2 className="text-2xl font-black text-foreground font-sans tracking-wide">{title}</h2>
        {count !== undefined && (
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-[0.2em] mt-1.5 font-bold">
            {count} Naitala
          </p>
        )}
      </div>
      {linkRef && (
        <Link href={linkRef} className="text-[10px] font-black font-sans uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group bg-primary/5 px-3 py-1.5 rounded-full">
          {linkText}
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main content — offset for sidebar width */}
      <div className="flex flex-1 flex-col pl-60">
        {/* Sticky Top Header */}
        <PageHeader title="Dashboard Overview" subtitle={`Brgy. Banay-Banay 2nd — ${monthYear()}`} />

        {/* Scrollable main area */}
        <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8 space-y-8">
          {/* 0. Hero Banner */}
          <HeroBanner />

          {/* 1. KPI Cards */}
          <SectionHeader title="Pangkalahatang Buod" />
          <KpiCards />

          {/* 2. Charts Row */}
          <SectionHeader title="Pagsusuri ng Datos" linkRef="/reports" />
          <section
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            aria-label="Charts and analytics"
          >
            {/* Line chart — takes 2 of 3 cols */}
            <div className="lg:col-span-2 flex flex-col">
              <ReportsLineChart />
            </div>
            {/* Bar chart — takes 1 of 3 cols */}
            <div className="flex flex-col">
              <IncidentTypeBarChart />
            </div>
          </section>

          {/* 3. Bottom Row — Heat Map + Table */}
          <SectionHeader title="Kasalukuyang Kalagayan" linkRef="/incidents" count={128} />
          <section
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            aria-label="Map and incident records"
          >
            <HeatMapPlaceholder />
            <RecentIncidentsTable />
          </section>
        </main>
      </div>
    </div>
  )
}
