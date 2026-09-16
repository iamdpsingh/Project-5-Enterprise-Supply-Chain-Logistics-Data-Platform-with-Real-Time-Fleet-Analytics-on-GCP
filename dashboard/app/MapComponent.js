"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to dynamically change map bounds when region changes
function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds([
        [bounds.latMin, bounds.lonMin],
        [bounds.latMax, bounds.lonMax]
      ], { animate: true, duration: 1.5 });
    }
  }, [bounds, map]);
  return null;
}

export default function MapComponent({ vehicles, regionBounds, selected, setSelected }) {
  // Create a custom pulsing div icon for vehicles
  const createIcon = (v, isSelected) => {
    const spd   = v.speed_kmh > 100;
    const fuel  = v.fuel_level_pct < 20;
    const eng   = v.engine_status === 'WARNING';
    const color = spd ? 'var(--red)' : (fuel || eng) ? 'var(--amber)' : 'var(--blue)';
    const size  = isSelected ? 14 : 9;
    const shadow= isSelected ? 20 : 8;
    const border= isSelected ? '2px solid white' : 'none';

    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `<div style="
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        background: ${color}; 
        box-shadow: 0 0 ${shadow}px ${color};
        border: ${border};
        transition: all 0.2s;
        animation: pulse-ring 2s ease infinite;
        color: ${color};
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <MapContainer 
      style={{ height: '100%', width: '100%', background: '#050505', borderRadius: '10px' }}
      zoomControl={true}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      {/* Dark Matter CartoDB Tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapBounds bounds={regionBounds} />

      {vehicles.map((v, i) => (
        <Marker 
          key={v.id || i} 
          position={[v.latitude, v.longitude]}
          icon={createIcon(v, selected?.id === v.id)}
          eventHandlers={{
            click: () => setSelected(selected?.id === v.id ? null : v)
          }}
        />
      ))}
    </MapContainer>
  );
}
