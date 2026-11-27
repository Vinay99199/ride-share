import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { geocodingApi } from "../api/geocoding";
import { errorMessage } from "../api/client";
import MapTileLayer from "./MapTileLayer";
import { destinationIcon, driverIcon, pickupIcon } from "./mapIcons";
import "./leafletIcon.js";

const toLatLng = (point) => {
  const coordinates = point?.coordinates;
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    coordinates[0] < -180 ||
    coordinates[0] > 180 ||
    coordinates[1] < -90 ||
    coordinates[1] > 90
  ) {
    return null;
  }
  return [coordinates[1], coordinates[0]];
};

const MapViewport = ({ rideId, pickup, destination, location }) => {
  const map = useMap();
  const initializedForRide = useRef(null);
  const fittedLocation = useRef(false);

  useEffect(() => {
    const points = [pickup, destination, location].filter(Boolean);
    if (!points.length) return;

    if (initializedForRide.current !== String(rideId)) {
      initializedForRide.current = String(rideId);
      fittedLocation.current = Boolean(location);
      if (points.length > 1) {
        map.fitBounds(points, { padding: [36, 36], maxZoom: 14 });
      } else {
        map.setView(points[0], 15);
      }
      return;
    }

    if (location && !fittedLocation.current) {
      fittedLocation.current = true;
      if (points.length > 1) {
        map.fitBounds(points, { padding: [36, 36], maxZoom: 14 });
      } else {
        map.setView(location, 15);
      }
    }
  }, [
    map,
    rideId,
    pickup?.[0],
    pickup?.[1],
    destination?.[0],
    destination?.[1],
    location?.[0],
    location?.[1],
  ]);

  return null;
};

const LiveMap = ({ location, ride }) => {
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const latestLocation = useRef(location);
  const pickup = toLatLng(ride?.pickupLocation);
  const destination = toLatLng(ride?.dropLocation);
  const driverLocation =
    location &&
    Number.isFinite(location.latitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    Number.isFinite(location.longitude) &&
    location.longitude >= -180 &&
    location.longitude <= 180
      ? [location.latitude, location.longitude]
      : null;
  const mapPoints = [driverLocation, pickup, destination].filter(Boolean);

  useEffect(() => {
    latestLocation.current = location;
  }, [location]);

  useEffect(() => {
    if (!location?.rideId) {
      setAddress("");
      setAddressError("");
      return undefined;
    }

    let active = true;
    let lookupInProgress = false;
    const lookup = async () => {
      const current = latestLocation.current;
      if (!current || lookupInProgress) return;
      lookupInProgress = true;
      try {
        const place = await geocodingApi.reverse(
          current.longitude,
          current.latitude
        );
        if (active) {
          setAddress(place.address);
          setAddressError("");
        }
      } catch (error) {
        if (active) {
          setAddress("");
          setAddressError(errorMessage(error));
        }
      } finally {
        lookupInProgress = false;
      }
    };
    const timer = setTimeout(lookup, 1200);
    const interval = window.setInterval(lookup, 60_000);
    return () => {
      active = false;
      clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [location?.rideId]);

  useEffect(() => {
    setAddress("");
    setAddressError("");
  }, [ride?._id]);

  if (!mapPoints.length) {
    return (
      <div className="map-placeholder">
        <span className="pulse-dot" />
        <strong>Waiting for a valid ride location</strong>
        <span>Pickup and destination markers will appear with the ride details.</span>
      </div>
    );
  }

  const initialCenter = mapPoints[0];
  const pickupLabel =
    ride?.pickupAddress || ride?.pickupLocationName || "Pickup location";
  const destinationLabel =
    ride?.dropAddress || ride?.dropLocationName || "Destination";

  return (
    <div className="live-map">
      <MapContainer
        key={String(ride?._id || "tracking")}
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
        className="map-canvas"
      >
        <MapViewport
          rideId={ride?._id}
          pickup={pickup}
          destination={destination}
          location={driverLocation}
        />
        <MapTileLayer />
        {pickup && (
          <Marker position={pickup} icon={pickupIcon}>
            <Popup>Pickup: {pickupLabel}</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={destination} icon={destinationIcon}>
            <Popup>Destination: {destinationLabel}</Popup>
          </Marker>
        )}
        {driverLocation && (
          <Marker position={driverLocation} icon={driverIcon}>
            <Popup>Driver's live location</Popup>
          </Marker>
        )}
      </MapContainer>
      {driverLocation && (
        <div className="live-map-address" aria-live="polite">
          {address || addressError || "Driver location received"}
        </div>
      )}
    </div>
  );
};

export default LiveMap;
