"use client";

import { useEffect, useState } from "react";
import { APILoader, Map, ScaleControl, ToolBarControl, Geolocation } from "@uiw/react-amap";

type Game = {
  id: string;
  venue: { name: string; address: string; lat: number; lng: number };
  ntrpMin: number;
  ntrpMax: number;
  startTime: string;
  sport: string;
  spotsLeft: number;
};

const SHANGHAI_CENTER: [number, number] = [121.47, 31.23];
const DEFAULT_ZOOM = 12;
const MY_LOCATION_ZOOM = 11; // ~10–12 km visible, ~5 km radius

function GameMarkers({
  AMap,
  map,
  games,
  onGameClick,
}: {
  AMap: { Marker: new (opts: { position: number[]; title?: string }) => { on: (e: string, fn: () => void) => void; setMap: (m: unknown) => void } };
  map: unknown;
  games: Game[];
  onGameClick: (gameId: string) => void;
}) {
  useEffect(() => {
    if (!AMap || !map) return;
    const markers = games.map((game) => {
      const marker = new AMap.Marker({
        position: [game.venue.lng, game.venue.lat],
        title: game.venue.name,
      });
      marker.on("click", () => onGameClick(game.id));
      marker.setMap(map);
      return marker;
    });
    return () => markers.forEach((m) => m.setMap(null));
  }, [AMap, map, games, onGameClick]);
  return null;
}

export function AmapMapView({
  games,
  onGameClick,
}: {
  games: Game[];
  onGameClick?: (gameId: string) => void;
}) {
  const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY;
  const [center, setCenter] = useState<[number, number]>(SHANGHAI_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const [lng, lat] = [pos.coords.longitude, pos.coords.latitude];
        setCenter([lng, lat]);
        setZoom(MY_LOCATION_ZOOM);
      },
      () => {}, // Keep Shanghai if denied or fails
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  if (!amapKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 py-16 text-center">
        <p className="text-amber-800">请配置高德地图 API Key</p>
        <p className="mt-2 text-sm text-amber-700">
          在 .env 中添加 NEXT_PUBLIC_AMAP_KEY，从{" "}
          <a
            href="https://lbs.amap.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            lbs.amap.com
          </a>{" "}
          获取
        </p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border border-slate-200">
      <APILoader version="2.0" akey={amapKey}>
        <Map center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
          <ScaleControl offset={[16, 30]} position="LB" />
          <ToolBarControl offset={[16, 10]} position="RB" />
          <Geolocation
            position="RB"
            offset={[16, 80]}
            zoomToAccuracy={false}
            showCircle
            borderRadius="5px"
          />
          {({ AMap, map }) =>
            AMap && map ? (
              <GameMarkers
                AMap={AMap}
                map={map}
                games={games}
                onGameClick={onGameClick ?? (() => undefined)}
              />
            ) : null
          }
        </Map>
      </APILoader>
    </div>
  );
}
