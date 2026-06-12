"use client"

import React, { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  position: { lat: number; lng: number }
  onChange: (pos: { lat: number; lng: number }) => void
}

function LocationMarker({ position, onChange }: MapPickerProps) {
  useMapEvents({
    click(e) {
      onChange(e.latlng)
    },
  })

  return position.lat !== 0 ? (
    <Marker position={position} />
  ) : null
}

export default function MapPicker({ position, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[200px] w-full bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground text-sm">Loading map...</div>
  }

  return (
    <div className="h-[200px] w-full rounded-md overflow-hidden border border-border relative z-0">
      <MapContainer 
        center={position.lat === 0 ? [-6.200000, 106.816666] : position} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onChange={onChange} />
      </MapContainer>
    </div>
  )
}
