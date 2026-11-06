"use client"

import { useEffect, useRef, useState } from "react"
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import { MapPin } from "lucide-react"
import {
  runDBSCAN,
  type IncidentPoint,
  type HotspotCluster,
  type RiskLevel,
} from "@/lib/dbscan"
import { reverseGeocode } from "@/lib/geocode"

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const CENTER: [number, number] = [13.882, 121.107]
const DEFAULT_ZOOM = 15

const RISK_COLORS: Record<RiskLevel, string> = {
  high: "#ef4444",   // red-500
  medium: "#ea580c", // amber-600
  low: "#22c55e",    // green-500
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
}

/* ------------------------------------------------------------------ */
/* HELPER: Define the visual style of the clusters                   */
/* ------------------------------------------------------------------ */

function getClusterLabelHtml(cluster: HotspotCluster, isHovered: boolean) {
  // Use amber for medium, red for high, green for low risk
  const riskColor = RISK_COLORS[cluster.risk] || "#ea580c";
  const size = isHovered ? 40 : 32; // Make it grow on hover

  return `
    <div style="
      width: ${size}px; height: ${size}px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: ${riskColor};
      border: 3px solid white;
      color: white;
      font-weight: 700; font-size: 16px; font-family: sans-serif;
      box-shadow: 0 0 10px ${riskColor}77;
      transition: all 0.2s ease-out;
    ">
      ${cluster.count}
    </div>
  `;
}

// Sub-component to render the hotspots with hovering tooltips
function HotspotMarker({ cluster }: { cluster: HotspotCluster }) {
  const [hovered, setHovered] = useState(false)

  // Use Leaflet's divIcon to create a marker that uses our custom CSS/HTML
  const icon = L.divIcon({
    className: "hotspot-marker-icon", // removes default white square background
    iconSize: [32, 32],
    iconAnchor: [16, 16], // Anchor point is the center of the icon
    html: getClusterLabelHtml(cluster, hovered),
  });

  return (
    <Marker
      position={[cluster.centroidLat, cluster.centroidLng]}
      icon={icon}
      eventHandlers={{
        mouseover: () => setHovered(true),
        mouseout: () => setHovered(false),
      }}
    >
      <Tooltip direction="top" opacity={1} className="font-sans border-0 shadow-lg !p-0 bg-transparent">
        <div className="bg-popover text-popover-foreground rounded-lg p-3 w-48 shadow-md border border-border">
          <p className="text-xs font-semibold mb-2 border-b border-border pb-1">
            Cluster — <span className="uppercase text-muted-foreground">{cluster.risk} Risk</span>
          </p>
          <div className="space-y-1.5 mb-2">
            {cluster.breakdown.map((b) => (
              <div key={b.category} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{b.category}</span>
                <span className="font-medium">{b.count}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-1 flex justify-between text-xs font-semibold">
            <span>Total</span>
            <span>{cluster.count}</span>
          </div>
        </div>
      </Tooltip>
    </Marker>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-component: Fit bounds on data change                           */
/* ------------------------------------------------------------------ */

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap()
  const first = useRef(true)

  useEffect(() => {
    if (first.current && points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
      first.current = false
    }
  }, [points, map])

  return null
}

function ReverseGeocodedLabel({ lat, lng }: { lat: number, lng: number }) {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function resolve() {
      const res = await reverseGeocode(lat, lng)
      if (mounted) {
        setAddress(res)
        setLoading(false)
      }
    }
    resolve()
    return () => { mounted = false }
  }, [lat, lng])

  if (loading) return <span className="animate-pulse opacity-50">Resolving street...</span>
  return <span>{address || "Unknown Street"}</span>
}

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

export interface MapCanvasProps {
  severities: { high: boolean; medium: boolean; low: boolean }
  clusteringEnabled: boolean
  incidents?: IncidentPoint[]
  /** If true, render a compact non-interactive preview */
  preview?: boolean
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function MapCanvas({
  severities,
  clusteringEnabled,
  incidents = [],
  preview = false,
}: MapCanvasProps) {
  // Filter active severities
  const filtered = incidents.filter((i) => severities[i.severity])

  // Run DBSCAN
  const { clusters, noise } = clusteringEnabled
    ? runDBSCAN(filtered)
    : { clusters: [] as HotspotCluster[], noise: filtered }

  return (
    <div className="relative flex-1 h-full rounded-xl border border-border overflow-hidden">
      {/* Location Badge (full mode only) */}
      {!preview && (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-border">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground font-sans">
            Brgy. Banay-Banay 2nd
          </span>
          <span className="text-xs text-muted-foreground font-sans ml-1">
            Incident Zones
          </span>
        </div>
      )}

      {/* -------- Leaflet Map -------- */}
      <MapContainer
        center={CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={!preview}
        dragging={!preview}
        scrollWheelZoom={!preview}
        doubleClickZoom={!preview}
        touchZoom={!preview}
        attributionControl={true}
        className="h-full w-full"
        style={{ background: "var(--background)" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <FitBounds points={filtered} />

        {/* ---- DBSCAN: Clusters (Numbers only, no massive circles) ---- */}
        {clusteringEnabled && clusters.map((cluster) => (
          <HotspotMarker key={`marker-${cluster.id}`} cluster={cluster} />
        ))}

        {/* ---- Noise / individual markers ---- */}
        {(clusteringEnabled ? noise : filtered).map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={preview ? 4 : 6}
            pathOptions={{
              color: SEVERITY_COLORS[point.severity] || "#22c55e",
              fillColor: SEVERITY_COLORS[point.severity] || "#22c55e",
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            {/* TOOLTIP FOR INDIVIDUAL INCIDENTS (HOVER) */}
            {!preview && (
              <Tooltip direction="top" opacity={1} className="font-sans border-0 shadow-lg !p-0 bg-transparent">
                <div className="bg-popover text-popover-foreground rounded-lg border border-border p-3 w-40 shadow-md space-y-1">
                  <p className="text-xs font-semibold border-b border-border pb-1">ID: {point.id}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium bg-muted/40 p-1 rounded">
                    <ReverseGeocodedLabel lat={point.lat} lng={point.lng} />
                  </p>
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest mt-0.5">
                    {point.category}
                  </p>
                  <p className="text-xs capitalize">
                    Severity:{" "}
                    <span
                      style={{ color: SEVERITY_COLORS[point.severity] }}
                      className="font-medium"
                    >
                      {point.severity}
                    </span>
                  </p>
                </div>
              </Tooltip>
            )}
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Status Bar (full mode only) */}
      {!preview && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex items-center justify-between bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
            <span>
              Showing:{" "}
              <span className="font-medium text-foreground">
                {clusteringEnabled
                  ? `${clusters.length} cluster${clusters.length !== 1 ? "s" : ""}, ${noise.length} isolated`
                  : `${filtered.length} incidents`}
              </span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-sans">
            DBSCAN: {clusteringEnabled ? "On" : "Off"}
          </div>
        </div>
      )}
    </div>
  )
}
