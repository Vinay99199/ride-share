import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { geocodingApi } from "../api/geocoding";
import { errorMessage } from "../api/client";
import MapTileLayer from "./MapTileLayer";
import { selectedLocationIcon } from "./mapIcons";
import "./leafletIcon.js";

export const getCurrentLocation = (t = (key) => key) =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error(t("errors.location.unsupportedGeolocation")));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve([coords.longitude, coords.latitude]),
      (error) => {
        const message = error.code === 1
          ? t("errors.location.locationPermissionDenied")
          : error.code === 2
            ? t("errors.location.currentLocationUnavailable")
            : t("errors.location.locationTimeout");
        reject(new Error(message));
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  });

const Recenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center[0], center[1], map, zoom]);
  return null;
};

const MapSelection = ({ coordinates, onSelect }) => {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lng, event.latlng.lat]);
    },
  });
  if (!coordinates) return null;

  const position = [coordinates[1], coordinates[0]];
  return (
    <Marker
      position={position}
      icon={selectedLocationIcon}
      draggable
      eventHandlers={{
        dragend(event) {
          const point = event.target.getLatLng();
          onSelect([point.lng, point.lat]);
        },
      }}
    />
  );
};

const isValidLocation = (location) =>
  Array.isArray(location?.coordinates) &&
  location.coordinates.length === 2 &&
  Number.isFinite(location.coordinates[0]) &&
  Number.isFinite(location.coordinates[1]) &&
  location.coordinates[0] >= -180 &&
  location.coordinates[0] <= 180 &&
  location.coordinates[1] >= -90 &&
  location.coordinates[1] <= 90;

const LocationPicker = ({
  label,
  value = null,
  onChange,
  required = false,
  initialQuery = "",
  compact = false,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchState, setSearchState] = useState("idle");
  const [addressState, setAddressState] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const requestSequence = useRef(0);
  const searchTimer = useRef(null);
  const translatedLabel = label === "Pickup location"
    ? t("common.map.pickupLocation")
    : label === "Drop-off location"
      ? t("common.map.dropOffLocation")
      : label === "Organization address"
        ? t("common.map.organizationAddress")
        : label;

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  useEffect(() => {
    setDraft(value);
    if (isValidLocation(value) && !value.address) {
      resolveCoordinates(value.coordinates);
    }
  }, [
    value?.coordinates?.[0],
    value?.coordinates?.[1],
    value?.name,
    value?.address,
  ]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const resolveCoordinates = async (coordinates) => {
    clearTimeout(searchTimer.current);
    const sequence = ++requestSequence.current;
    setDraft({ coordinates, name: "", address: "" });
    setResults([]);
    setSearchState("idle");
    setAddressState("loading");
    setLocationError("");
    try {
      const place = await geocodingApi.reverse(coordinates[0], coordinates[1]);
      if (sequence !== requestSequence.current) return;
      setDraft({ coordinates, name: place.name, address: place.address });
      setAddressState("resolved");
    } catch (requestError) {
      if (sequence !== requestSequence.current) return;
      setDraft({ coordinates, name: "", address: "" });
      setAddressState("unavailable");
      setLocationError(errorMessage(requestError));
    }
  };

  const searchPlaces = (event, requestedQuery = query) => {
    event?.preventDefault();
    clearTimeout(searchTimer.current);
    const searchText = requestedQuery.trim();
    if (searchText.length < 3) {
      ++requestSequence.current;
      setResults([]);
      setSearchState("empty");
      setLocationError(t("common.map.enterThreeCharacters"));
      return;
    }

    const sequence = ++requestSequence.current;
    setSearchState("loading");
    setResults([]);
    setLocationError("");
    searchTimer.current = setTimeout(async () => {
      try {
        const places = await geocodingApi.search(searchText);
        if (sequence !== requestSequence.current) return;
        setResults(places);
        setSearchState(places.length ? "results" : "empty");
        if (!places.length) setLocationError(t("common.map.noMatchingPlaces"));
      } catch (requestError) {
        if (sequence !== requestSequence.current) return;
        setSearchState("error");
        setLocationError(errorMessage(requestError));
      }
    }, 350);
  };

  const choosePlace = (place) => {
    clearTimeout(searchTimer.current);
    ++requestSequence.current;
    setDraft({
      coordinates: place.coordinates,
      name: place.name,
      address: place.address,
    });
    setAddressState("resolved");
    setResults([]);
    setQuery(place.name);
    setSearchState("idle");
    setLocationError("");
  };

  const useCurrentLocation = async () => {
    const sequence = ++requestSequence.current;
    setLocationError("");
    setLocationLoading(true);
    try {
      const coordinates = await getCurrentLocation(t);
      if (sequence === requestSequence.current) {
        await resolveCoordinates(coordinates);
      }
    } catch (error) {
      if (sequence === requestSequence.current) {
        setLocationError(error.message);
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const selectLocation = () => {
    if (!isValidLocation(draft)) return;
    onChange({
      coordinates: draft.coordinates,
      name: draft.name || "",
      address: draft.address || "",
    });
  };

  const clearLocation = () => {
    clearTimeout(searchTimer.current);
    ++requestSequence.current;
    setDraft(null);
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setAddressState("idle");
    setLocationError("");
    onChange(null);
  };

  const coordinates = isValidLocation(draft) ? draft.coordinates : null;
  const center = coordinates ? [coordinates[1], coordinates[0]] : [20, 0];

  return (
    <section className={`location-picker${compact ? " location-picker-compact" : ""}`}>
      <div className="location-picker-heading">
        <strong>{translatedLabel}{required ? " *" : ""}</strong>
        <button
          className="text-button"
          type="button"
          onClick={useCurrentLocation}
          disabled={locationLoading}
        >
          {locationLoading ? t("common.map.findingLocation") : t("common.map.useCurrentLocation")}
        </button>
      </div>

      <div className="location-search-form" role="search">
        <input
          aria-label={`${t("common.map.searchPlaces")}: ${translatedLabel}`}
          placeholder={t("common.map.searchPlacePlaceholder")}
          autoComplete="off"
          maxLength={120}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            clearTimeout(searchTimer.current);
            ++requestSequence.current;
            setQuery(nextQuery);
            setResults([]);
            setSearchState("idle");
            setLocationError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") searchPlaces(event);
          }}
        />
        <button className="button button-outline button-small" type="button" onClick={searchPlaces} disabled={searchState === "loading"}>
          {searchState === "loading" ? t("common.map.searchingPlaces") : t("common.map.searchPlaces")}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="location-search-results" aria-label={t("common.map.placeSuggestions")}>
          {results.map((place) => (
            <li key={place.placeId}>
              <button type="button" onClick={() => choosePlace(place)}>
                <strong>{place.name}</strong>
                <span>{place.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchState === "empty" && !locationError && (
        <p className="location-picker-hint" role="status">{t("common.map.noPlacesMatched")}</p>
      )}

      <div className="location-picker-map">
        <MapContainer center={center} zoom={coordinates ? 15 : 2} scrollWheelZoom>
          <Recenter center={center} zoom={coordinates ? 15 : 2} />
          <MapTileLayer />
          <MapSelection
            coordinates={coordinates}
            onSelect={(nextCoordinates) => {
              setQuery("");
              resolveCoordinates(nextCoordinates);
            }}
          />
        </MapContainer>
      </div>
      <p className="location-picker-hint">
        {t("common.map.providerNote")}
      </p>

      {coordinates && (
        <div className="location-picker-selected" aria-live="polite">
          <strong>
            {draft.name || (addressState === "loading" ? t("common.map.lookingUpMapPoint") : t("common.map.mapPoint"))}
          </strong>
          <span>
            {draft.address ||
              (addressState === "unavailable"
                ? t("common.map.addressLookupFailed")
                : t("common.map.moveMarkerResolveAddress"))}
          </span>
        </div>
      )}
      {locationError && <p className="location-picker-error" role="alert">{locationError}</p>}

      <div className="location-picker-confirm">
        {coordinates && (
          <button className="text-button" type="button" onClick={clearLocation}>
            {t("common.map.clearLocation")}
          </button>
        )}
        <button
          className="button button-primary"
          type="button"
          onClick={selectLocation}
          disabled={!coordinates || addressState !== "resolved" || !draft.address}
        >
          {t("common.map.confirmLocation")}
        </button>
      </div>
    </section>
  );
};

export default LocationPicker;
