import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ridesApi } from "../api/rides";
import { errorMessage } from "../api/client";
import { emitTrackingEvent, trackingApi } from "../api/tracking";
import LiveMap from "../components/LiveMap";
import {
  Button,
  Notice,
  PageHeading,
  Panel,
  Spinner,
  formatDate,
  rideLocation,
} from "../components/UI";
import { useAuth, userId } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const isValidLocation = (location, rideId) => {
  if (
    !location ||
    String(location.rideId) !== String(rideId) ||
    typeof location.latitude !== "number" ||
    !Number.isFinite(location.latitude) ||
    location.latitude < -90 ||
    location.latitude > 90 ||
    typeof location.longitude !== "number" ||
    !Number.isFinite(location.longitude) ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    return false;
  }
  return typeof location.timestamp === "string" &&
    Number.isFinite(Date.parse(location.timestamp));
};

const gpsMessages = {
  idle: "GPS is not sharing",
  starting: "Starting GPS",
  sharing: "Sharing location",
  "permission-required": "GPS permission required",
  unavailable: "Location unavailable",
  stopped: "Location sharing stopped",
};

const TrackingPage = () => {
  const { rideId } = useParams();
  const { user } = useAuth();
  const { socket, connected, socketError } = useSocket();
  const [ride, setRide] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [now, setNow] = useState(Date.now());
  const watchId = useRef(null);
  const refreshTimer = useRef(null);
  const watchGeneration = useRef(0);
  const acceptedLocation = useRef(null);
  const lastPublishedAt = useRef(0);

  const isDriver = Boolean(
    ride?.driver &&
    String(ride.driver?._id || ride.driver) === userId(user)
  );
  const acceptLocation = useCallback(
    (incoming) => {
      if (!isValidLocation(incoming, rideId)) return false;
      const previous = acceptedLocation.current;
      if (
        previous &&
        String(previous.rideId) === String(rideId) &&
        Date.parse(previous.timestamp) > Date.parse(incoming.timestamp)
      ) {
        return false;
      }
      acceptedLocation.current = incoming;
      setLocation(incoming);
      setNow(Date.now());
      return true;
    },
    [rideId]
  );

  const stopWatching = useCallback(() => {
    watchGeneration.current += 1;
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (refreshTimer.current !== null) {
      window.clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const publishPosition = useCallback(
    async (position) => {
      const positionDate = new Date(position.timestamp);
      const timestamp = Number.isFinite(positionDate.getTime())
        ? positionDate.toISOString()
        : "";
      const current = {
        rideId: String(rideId),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp,
      };
      if (!isValidLocation(current, rideId)) {
        setGpsStatus("unavailable");
        setError("The device returned coordinates outside valid ranges.");
        return;
      }

      if (!acceptLocation(current)) return;
      if (!socket?.connected) {
        setGpsStatus("starting");
        return;
      }
      if (Date.now() - lastPublishedAt.current < 2200) return;

      lastPublishedAt.current = Date.now();
      try {
        await emitTrackingEvent(socket, "tracking:location:update", current);
        setGpsStatus("sharing");
        setError("");
      } catch (publishError) {
        setError(errorMessage(publishError));
      }
    },
    [acceptLocation, rideId, socket]
  );

  const handleGeolocationError = useCallback(
    (geoError) => {
      if (geoError.code === 1) {
        stopWatching();
        setGpsStatus("permission-required");
        setError("Allow location access in your browser settings to share your live position.");
      } else {
        setGpsStatus("unavailable");
        setError(
          geoError.code === 3
            ? "GPS did not respond in time. Keep this page open while the device tries again."
            : "Your device could not determine its location. Check that location services are enabled."
        );
      }
    },
    [stopWatching]
  );

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      setError("This browser does not support GPS location.");
      return;
    }
    stopWatching();
    setError("");
    setGpsStatus("starting");
    const generation = watchGeneration.current;
    const onPosition = (position) => {
      if (generation === watchGeneration.current) void publishPosition(position);
    };
    const onError = (geoError) => {
      if (generation === watchGeneration.current) handleGeolocationError(geoError);
    };
    const options = { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 };

    navigator.geolocation.getCurrentPosition(
      onPosition,
      onError,
      options
    );
    watchId.current = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      options
    );
    refreshTimer.current = window.setInterval(() => {
      if (generation !== watchGeneration.current) return;
      navigator.geolocation.getCurrentPosition(
        onPosition,
        onError,
        { ...options, maximumAge: 0 }
      );
    }, 5000);
  }, [handleGeolocationError, publishPosition, stopWatching]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setRide(null);
    setLocation(null);
    acceptedLocation.current = null;
    setGpsStatus("idle");
    ridesApi
      .get(rideId)
      .then((result) => {
        if (active) setRide(result);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [rideId]);

  useEffect(() => {
    if (!ride?._id || !ride.startedAt || !ride.trackingActive || !connected || !socket) {
      return undefined;
    }

    let active = true;
    const onLocation = (incoming) => {
      if (acceptLocation(incoming)) {
        setError("");
        if (isDriver) setGpsStatus("sharing");
      }
    };
    const onStopped = (payload = {}) => {
      if (String(payload.rideId) !== String(rideId)) return;
      setRide((current) =>
        current
          ? {
              ...current,
              trackingActive: false,
              ...(payload.reason === "ride_completed" ? { status: "completed" } : {}),
              ...(payload.reason === "ride_cancelled" ? { status: "cancelled" } : {}),
            }
          : current
      );
      setGpsStatus("stopped");
    };

    socket.on("tracking:location", onLocation);
    socket.on("tracking:stopped", onStopped);
    emitTrackingEvent(socket, "tracking:join", { rideId: String(rideId) })
      .then((result) => {
        if (active && result.location) onLocation(result.location);
      })
      .catch((joinError) => {
        if (active) setError(errorMessage(joinError));
      });

    return () => {
      active = false;
      socket.off("tracking:location", onLocation);
      socket.off("tracking:stopped", onStopped);
      if (socket.connected) socket.emit("tracking:leave", { rideId: String(rideId) });
    };
  }, [
    acceptLocation,
    connected,
    isDriver,
    ride?._id,
    ride?.startedAt,
    ride?.trackingActive,
    rideId,
    socket,
  ]);

  useEffect(() => {
    if (!isDriver || !ride?.startedAt || !ride.trackingActive) {
      stopWatching();
      if (gpsStatus === "sharing" || gpsStatus === "starting") {
        setGpsStatus(ride?.startedAt ? "stopped" : "idle");
      }
      return undefined;
    }
    startWatching();
    return stopWatching;
  }, [
    isDriver,
    ride?.startedAt,
    ride?.trackingActive,
    startWatching,
    stopWatching,
  ]);

  useEffect(() => {
    if (!ride?.startedAt || !ride.trackingActive) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const latest = await trackingApi.latest(rideId);
        if (active && latest) acceptLocation(latest);
      } catch (trackingError) {
        if (!active) return;
        if (trackingError.response?.status === 409) {
          setRide((current) =>
            current ? { ...current, trackingActive: false } : current
          );
          setGpsStatus("stopped");
        } else {
          setError(errorMessage(trackingError));
        }
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [acceptLocation, ride?.startedAt, ride?.trackingActive, rideId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDriver && ride?.trackingActive && !connected && gpsStatus === "sharing") {
      setGpsStatus("starting");
    }
  }, [connected, gpsStatus, isDriver, ride?.trackingActive]);

  useEffect(() => () => stopWatching(), [stopWatching]);

  const runDriverAction = async (action) => {
    setWorking(true);
    setError("");
    try {
      const result = await action();
      setRide((current) => ({ ...current, ...result.ride }));
      setGpsStatus(result.ride.trackingActive ? "starting" : "stopped");
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setWorking(false);
    }
  };

  const driverAction = (action, label) => (
    <Button
      type="button"
      disabled={working || (label === "Start ride" && !connected)}
      onClick={() => runDriverAction(action)}
    >
      {working ? "Updating..." : label}
    </Button>
  );

  if (loading || (ride && String(ride._id) !== String(rideId))) {
    return <div className="page"><Spinner label="Loading authorized ride details..." /></div>;
  }
  if (!ride) {
    return (
      <div className="page">
        <PageHeading eyebrow="LIVE TRACKING" title="Ride tracking" />
        <Notice>{error || "Ride not found."}</Notice>
        <Link className="text-link" to="/live-tracking">Back to your rides →</Link>
      </div>
    );
  }

  const parsedTimestamp = location ? Date.parse(location.timestamp) : NaN;
  const ageMs = Number.isFinite(parsedTimestamp) ? Math.max(0, now - parsedTimestamp) : Infinity;
  const stale = ageMs > 90_000;
  const freshness = !location
    ? "No driver position received yet"
    : stale
      ? `Last position ${Math.floor(ageMs / 1000)} seconds ago · stale`
      : `Updated ${Math.max(0, Math.floor(ageMs / 1000))} seconds ago`;
  const passengerStatus = ride.status === "completed"
    ? "Ride completed · live sharing ended"
    : ride.status === "cancelled"
      ? "Ride cancelled · live sharing ended"
      : !ride.startedAt
        ? "Ride tracking has not started yet"
        : !ride.trackingActive
          ? "Driver stopped location sharing"
          : !location
            ? "Waiting for the driver's first GPS position"
            : stale
              ? "Driver location is stale"
              : "Driver location is live";
  const driverStatus = gpsMessages[gpsStatus] || gpsMessages.idle;
  const statusDescription = isDriver
    ? gpsStatus === "sharing"
      ? "Your device is sending authorized GPS updates for this ride."
      : gpsStatus === "starting"
        ? connected
          ? "Waiting for your device to provide a GPS position."
          : "GPS can be acquired, but the live connection is reconnecting."
        : gpsStatus === "permission-required"
          ? "Enable location permission in your browser, then reload this ride."
          : gpsStatus === "unavailable"
            ? "Check device location services and keep this page open to retry."
            : ride.trackingActive
              ? "Tracking is active. GPS sharing will begin when location is available."
              : ride.status === "completed"
                ? "The ride has been completed; GPS sharing is no longer active."
                : ride.status === "cancelled"
                  ? "The ride was cancelled; GPS sharing is no longer active."
                : ride.startedAt
                  ? "Resume location sharing to publish GPS updates again."
                  : "Start the ride to begin GPS sharing."
    : !connected
      ? "Reconnecting to the live tracking service. Recent authorized positions may still be shown."
      : passengerStatus;
  const activeLocation = Boolean(
    location && !stale && ride.trackingActive && ride.status === "scheduled"
  );

  return (
    <div className="page">
      <PageHeading
        eyebrow={isDriver ? "DRIVER LIVE TRACKING" : "AUTHORIZED PASSENGER TRACKING"}
        title={`${rideLocation(ride, "pickup")} → ${rideLocation(ride, "drop")}`}
        description={`Departure ${formatDate(ride.departureTime)} · Ride ${String(ride._id).slice(-8)}`}
        action={<Link className="button button-outline" to={isDriver ? "/driver/live-tracking" : "/live-tracking"}>Back</Link>}
      />
      {error && <Notice>{error}</Notice>}
      {!connected && socketError && (
        <Notice type="warning">{`Socket disconnected: ${socketError}`}</Notice>
      )}

      <div className="content-grid tracking-grid">
        <Panel title="Ride map" className="tracking-map-panel">
          <LiveMap location={location} ride={ride} />
          <div className="location-meta">
            <span>{freshness}</span>
            <span>{connected ? "Socket connected" : "Socket disconnected"}</span>
          </div>
        </Panel>

        <Panel title="Tracking status">
          <div className="tracking-status">
            <span className={`tracking-pulse ${activeLocation ? "pulse-active" : ""}`} />
            <div>
              <strong>{isDriver ? driverStatus : passengerStatus}</strong>
              <p>{statusDescription}</p>
            </div>
          </div>
          <div className="tracking-controls">
            <p><strong>Pickup</strong><br />{rideLocation(ride, "pickup")}</p>
            <p><strong>Destination</strong><br />{rideLocation(ride, "drop")}</p>
            <p><strong>Departure</strong><br />{formatDate(ride.departureTime)}</p>
            {!isDriver && (
              <small className="tracking-guidance">
                Location access is limited to the ride's driver and passengers with a confirmed booking.
              </small>
            )}
          </div>

          {isDriver && ride.status === "scheduled" && (
            <div className="tracking-actions">
              {!ride.startedAt ? (
                driverAction(() => trackingApi.startRide(rideId), "Start ride")
              ) : ride.trackingActive ? (
                <>
                  {driverAction(() => trackingApi.stopSharing(rideId), "Stop sharing")}
                  {driverAction(() => trackingApi.completeRide(rideId), "Complete ride")}
                </>
              ) : (
                <>
                  {driverAction(() => trackingApi.resumeSharing(rideId), "Resume sharing")}
                  {driverAction(() => trackingApi.completeRide(rideId), "Complete ride")}
                </>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default TrackingPage;
