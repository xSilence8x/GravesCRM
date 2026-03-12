import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GraveData {
  id: number;
  clientId: number;
  cemeteryName: string;
  graveNumber: string;
  latitude: number;
  longitude: number;
  basePrice: number;
}

interface GraveMapProps {
  graves: GraveData[];
  center: [number, number];
  zoom: number;
  getClientName: (id: number) => number;
  cemeteryFilter: string;
}

export default function GraveMap({ graves, center, zoom, getClientName, cemeteryFilter }: GraveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous instance
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    graves.forEach((grave) => {
      const marker = L.marker([grave.latitude, grave.longitude]).addTo(map);
      marker.bindPopup(`
        <div style="font-size:13px;">
          <p style="font-weight:bold;margin:0 0 4px">${grave.cemeteryName}</p>
          <p style="margin:0 0 2px">Grave #${grave.graveNumber}</p>
          <p style="margin:0 0 2px;color:#666">${getClientName(grave.clientId)}</p>
          <p style="margin:0;font-weight:500">${grave.basePrice.toLocaleString()} CZK</p>
        </div>
      `);
    });

    // Small delay to fix tile rendering
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [graves, center, zoom, getClientName, cemeteryFilter]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}
