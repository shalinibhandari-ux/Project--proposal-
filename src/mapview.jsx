import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  addProtocol,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Protocol, PMTiles } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(workerUrl);

const PMTILES_URL = `${window.location.origin}/dehradun.pmtiles`;

class FullFileSource {
  constructor(url) {
    this.url = url;
    this.bufferPromise = null;
  }

  getKey() {
    return this.url;
  }

  async getBytes(offset, length) {
    if (!this.bufferPromise) {
      this.bufferPromise = fetch(this.url).then((response) => {
        if (!response.ok) {
          throw new Error("PMTiles fetch failed: " + response.status);
        }
        return response.arrayBuffer();
      });
    }
    const buffer = await this.bufferPromise;
    return { data: buffer.slice(offset, offset + length) };
  }
}

const protocol = new Protocol();
protocol.add(new PMTiles(new FullFileSource(PMTILES_URL)));
addProtocol("pmtiles", protocol.tile);

function MapView() {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      center: [78.0322, 30.3165],
      zoom: 12,
      style: {
        version: 8,
        glyphs:
          "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sprite:
          "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
        sources: {
          dehradun: {
            type: "vector",
            url: `pmtiles://${PMTILES_URL}`,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: layers("dehradun", namedFlavor("light"), {
          lang: "en",
        }),
      },
    });

    map.addControl(new NavigationControl(), "top-right");

    map.on("error", (event) => {
      console.error("Map error:", event.error);
    });

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        height: "350px",
        width: "100%",
        borderRadius: "12px",
        backgroundColor: "#e5e7eb",
      }}
    />
  );
}

export default MapView;