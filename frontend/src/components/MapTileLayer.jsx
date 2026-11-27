import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { TileLayer } from "react-leaflet";
import { useTranslation } from "react-i18next";

const MAP_LAYERS = {
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles © Esri — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community",
  },
  street: {
    label: "Street Map",
    url:
      import.meta.env.VITE_MAP_TILE_URL ||
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

const MapTileLayer = () => {
  const { t } = useTranslation();
  const [layer, setLayer] = useState("satellite");
  const [tileStatus, setTileStatus] = useState("loading");
  const controlRef = useRef(null);
  const activeLayerRef = useRef(layer);
  const activeLayer = MAP_LAYERS[layer];
  activeLayerRef.current = layer;
  const eventHandlers = useMemo(
    () => ({
      loading: () => {
        if (activeLayerRef.current === layer) setTileStatus("loading");
      },
      load: () => {
        if (activeLayerRef.current === layer) setTileStatus("loaded");
      },
      tileerror: () => {
        if (activeLayerRef.current === layer) setTileStatus("error");
      },
    }),
    [layer]
  );

  useEffect(() => {
    if (!controlRef.current) return;
    L.DomEvent.disableClickPropagation(controlRef.current);
    L.DomEvent.disableScrollPropagation(controlRef.current);
  }, []);

  const changeLayer = (nextLayer) => {
    if (nextLayer === layer) return;
    setTileStatus("loading");
    setLayer(nextLayer);
  };

  return (
    <>
      <TileLayer
        key={layer}
        attribution={activeLayer.attribution}
        url={activeLayer.url}
        eventHandlers={eventHandlers}
      />
      <div className="leaflet-top leaflet-right map-layer-control-position">
        <div
          ref={controlRef}
          className="leaflet-control map-layer-control"
          role="group"
          aria-label={t("common.map.mapDisplayLayer")}
        >
          {Object.entries(MAP_LAYERS).map(([key, option]) => (
            <button
              key={key}
              type="button"
              aria-pressed={layer === key}
              onClick={() => changeLayer(key)}
            >
              {t(key === "satellite" ? "common.map.satellite" : "common.map.streetMap")}
            </button>
          ))}
        </div>
      </div>
      {tileStatus !== "loaded" && (
        <div className="leaflet-top leaflet-left map-tile-status-position">
          <div
            className={`map-tile-status${tileStatus === "error" ? " is-error" : ""}`}
            role={tileStatus === "error" ? "alert" : "status"}
          >
            {tileStatus === "error"
              ? t("common.map.mapTilesError")
              : t("common.map.loadingMap", {
                  layer: t(layer === "satellite" ? "common.map.satellite" : "common.map.streetMap").toLowerCase(),
                })}
          </div>
        </div>
      )}
    </>
  );
};

export default MapTileLayer;
