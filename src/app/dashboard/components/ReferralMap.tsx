'use client'

import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'

// Leaflet's default marker icons break when bundled — we use CircleMarker instead (no icon assets needed).

interface PartnerPoint {
  id: string | number
  name: string
  count: number
  type?: string
  latitude?: number
  longitude?: number
}

function AutoFit({ points }: { points: PartnerPoint[] }) {
  const map = useMap()
  useEffect(() => {
    const valid = points.filter(
      (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number',
    )
    if (valid.length === 0) return
    if (valid.length === 1) {
      map.setView([valid[0].latitude!, valid[0].longitude!], 12)
      return
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.latitude!, p.longitude!] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [points, map])
  return null
}

export function ReferralMap({ partners }: { partners: PartnerPoint[] }) {
  const mapRef = useRef<L.Map | null>(null)
  const valid = useMemo(
    () => partners.filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'),
    [partners],
  )
  const maxCount = Math.max(1, ...valid.map((p) => p.count))

  function radius(count: number) {
    // 8px min, up to 26px max based on relative volume
    return 8 + (count / maxCount) * 18
  }

  function typeColor(type?: string): string {
    switch (type) {
      case 'er':
        return '#ef4444'
      case 'urgent_care':
        return '#f59e0b'
      case 'primary_care':
        return '#3b82f6'
      case 'virtual':
        return '#10b981'
      case 'dental':
        return '#8b5cf6'
      case 'behavioral_health':
        return '#ec4899'
      case 'health_department':
        return '#14b8a6'
      default:
        return '#6b7280'
    }
  }

  if (valid.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
        No geocoded referral destinations yet.
      </div>
    )
  }

  return (
    <div className="h-[420px] overflow-hidden rounded-lg border border-gray-200">
      <MapContainer
        center={[36.8468, -76.2852]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        ref={(m) => {
          if (m) mapRef.current = m
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoFit points={valid} />
        {valid.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.latitude!, p.longitude!]}
            radius={radius(p.count)}
            pathOptions={{
              color: typeColor(p.type),
              fillColor: typeColor(p.type),
              fillOpacity: 0.55,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.name}</div>
                <div className="text-gray-600">
                  {p.count} referral{p.count === 1 ? '' : 's'} in period
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
