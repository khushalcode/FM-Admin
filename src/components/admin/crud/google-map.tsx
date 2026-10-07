'use client'

/**
 * Google Maps Embed wrapper using the project's API key.
 *
 * Uses the Embed API directions mode (no signed URL required for the
 * basic embed endpoint, but we include the key explicitly).
 */
import { useEffect, useState } from 'react'

const GOOGLE_MAPS_API_KEY = 'AIzaSyBz4h_RTdZxvCr4Tw7lkc5us6A9cCS_Gbc'

export function GoogleMapEmbed({
  origin, destination, waypoints, height = 400, showRoute = false,
}: {
  origin?: { lat: number; lng: number; label?: string }
  destination?: { lat: number; lng: number; label?: string }
  waypoints?: Array<{ lat: number; lng: number; label?: string }>
  height?: number
  showRoute?: boolean
}) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (showRoute && origin && destination) {
      const o = `${origin.lat},${origin.lng}`
      const d = `${destination.lat},${destination.lng}`
      const wps = (waypoints || []).map((w) => `${w.lat},${w.lng}`).join('|')
      const url = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}` +
        `&origin=${o}&destination=${d}${wps ? `&waypoints=${wps}` : ''}` +
        `&mode=driving`
      setSrc(url)
    } else if (origin) {
      const url = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}` +
        `&q=${origin.lat},${origin.lng}&zoom=14`
      setSrc(url)
    } else {
      const url = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}` +
        `&q=Bangalore,India&zoom=11`
      setSrc(url)
    }
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, showRoute, waypoints?.length])

  return (
    <iframe
      title="map"
      src={src}
      width="100%"
      height={height}
      style={{ border: 0, borderRadius: 12 }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  )
}

export { GOOGLE_MAPS_API_KEY }
