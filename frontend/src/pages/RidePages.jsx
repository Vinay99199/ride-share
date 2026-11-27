import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { ratingsApi } from "../api/ratings";
import { ridesApi } from "../api/rides";
import ReviewCard from "../components/ReviewCard";
import ReviewForm from "../components/ReviewForm";
import LocationPicker from "../components/LocationPicker";
import { UserAvatar } from "../components/VisualAssets";
import {
  Button,
  EmptyState,
  Field,
  HistoryTabs,
  Notice,
  PageHeading,
  Panel,
  RideCard,
  SelectField,
  Spinner,
  Status,
  Stars,
  VehicleTypeSelector,
  formatDate,
  rideLocation,
} from "../components/UI";
import { useAuth, userId } from "../context/AuthContext";

const initialSearch = {
  pickupLng: "",
  pickupLat: "",
  pickupName: "",
  pickupAddress: "",
  dropLng: "",
  dropLat: "",
  dropName: "",
  dropAddress: "",
  departureDate: "",
  seatsRequired: "1",
  vehicleType: "",
  maxPrice: "",
  radiusKm: "5",
  sort: "departure",
};

const getLocalDateTimeMinimum = () => {
  const date = new Date(Date.now() + 60_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export const RideSearchPage = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => ({
    ...initialSearch,
    ...Object.fromEntries(
      Object.keys(initialSearch)
        .filter((key) => searchParams.has(key))
        .map((key) => [key, searchParams.get(key)])
    ),
  }));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const search = async (page = 1, overrides = {}) => {
    const values = { ...form, ...overrides };
    if (Boolean(values.pickupLng) !== Boolean(values.pickupLat)) {
      setError("Choose a complete pickup location or clear it.");
      return;
    }
    if (Boolean(values.dropLng) !== Boolean(values.dropLat)) {
      setError("Choose a complete destination or clear it.");
      return;
    }
    const coordinatePairs = [
      [values.pickupLng, values.pickupLat, "Pickup"],
      [values.dropLng, values.dropLat, "Destination"],
    ];
    for (const [longitude, latitude, label] of coordinatePairs) {
      if (!longitude || !latitude) continue;
      const longitudeValue = Number(longitude);
      const latitudeValue = Number(latitude);
      if (
        !Number.isFinite(longitudeValue) ||
        !Number.isFinite(latitudeValue) ||
        longitudeValue < -180 ||
        longitudeValue > 180 ||
        latitudeValue < -90 ||
        latitudeValue > 90
      ) {
        setError(`${label} location is invalid. Choose it again using place search or the map.`);
        return;
      }
    }
    if (
      values.pickupLng &&
      values.dropLng &&
      Number(values.pickupLng) === Number(values.dropLng) &&
      Number(values.pickupLat) === Number(values.dropLat)
    ) {
      setError("Pickup and destination must be different locations.");
      return;
    }
    if (!Number.isInteger(Number(values.seatsRequired)) || Number(values.seatsRequired) < 1) {
      setError("Enter a whole number of seats greater than zero.");
      return;
    }
    if (!Number.isFinite(Number(values.radiusKm)) || Number(values.radiusKm) <= 0 || Number(values.radiusKm) > 100) {
      setError("Search radius must be greater than zero and no more than 100 km.");
      return;
    }
    if (values.maxPrice && (!Number.isFinite(Number(values.maxPrice)) || Number(values.maxPrice) < 0)) {
      setError("Maximum price must be zero or greater.");
      return;
    }
    setLoading(true);
    setError("");
    const params = {
      page,
      limit: 8,
      seatsRequired: values.seatsRequired,
      radiusKm: values.radiusKm,
      sort: values.sort,
      ...(values.pickupLng ? { pickupLng: values.pickupLng, pickupLat: values.pickupLat } : {}),
      ...(values.dropLng ? { dropLng: values.dropLng, dropLat: values.dropLat } : {}),
      ...(values.departureDate
        ? {
            departureDate: values.departureDate,
            timezoneOffsetMinutes: new Date(`${values.departureDate}T12:00`).getTimezoneOffset(),
          }
        : {}),
      ...(values.vehicleType ? { vehicleType: values.vehicleType } : {}),
      ...(values.maxPrice !== "" ? { maxPrice: values.maxPrice } : {}),
    };
    try {
      setResult(await ridesApi.search(params));
    } catch (requestError) {
      setError(errorMessage(requestError));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search(1);
  }, []);

  const update = (key) => (event) =>
    setForm((current) => {
      const next = { ...current, [key]: event.target.value };
      if (next.sort === "distance" && (!next.pickupLng || !next.pickupLat)) {
        next.sort = "departure";
      }
      return next;
    });
  const setLocation = (prefix, location) => {
    setForm((current) => ({
      ...current,
      [`${prefix}Lng`]: location ? String(location.coordinates[0]) : "",
      [`${prefix}Lat`]: location ? String(location.coordinates[1]) : "",
      [`${prefix}Name`]: location?.name || "",
      [`${prefix}Address`]: location?.address || "",
      ...(prefix === "pickup" && !location && current.sort === "distance"
        ? { sort: "departure" }
        : {}),
    }));
  };
  const pickupPoint =
    form.pickupLng && form.pickupLat
      ? {
          coordinates: [Number(form.pickupLng), Number(form.pickupLat)],
          name: form.pickupName,
          address: form.pickupAddress,
        }
      : null;
  const dropPoint =
    form.dropLng && form.dropLat
      ? {
          coordinates: [Number(form.dropLng), Number(form.dropLat)],
          name: form.dropName,
          address: form.dropAddress,
        }
      : null;

  return (
    <div className="page">
      <PageHeading eyebrow="RIDE MATCHING" title="Find your next ride" description="Search a place or select it on the map, then compare rides with available seats." />
      <Panel className="search-panel">
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); search(1); }}>
          <div className="coordinate-fields">
          <div className="filter-group">
              <LocationPicker
                label="Pickup location"
                value={pickupPoint}
              onChange={(location) => setLocation("pickup", location)}
              />
            </div>
            <div className="filter-group">
              <LocationPicker
                label="Drop location"
                value={dropPoint}
              onChange={(location) => setLocation("drop", location)}
              />
            </div>
          </div>
          <div className="search-filters">
            <Field label="Departure date" type="date" value={form.departureDate} onChange={update("departureDate")} />
            <Field label="Seats needed" type="number" min="1" step="1" required value={form.seatsRequired} onChange={update("seatsRequired")} />
            <VehicleTypeSelector value={form.vehicleType} onChange={update("vehicleType")} />
            <Field label="Max price / seat" type="number" min="0" step="any" placeholder="No limit" value={form.maxPrice} onChange={update("maxPrice")} />
            <Field label="Search radius (km)" type="number" min="0.1" max="100" step="any" value={form.radiusKm} onChange={update("radiusKm")} />
            <SelectField label="Sort by" value={form.sort} onChange={update("sort")}>
              <option value="departure">Departure time</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              {pickupPoint && <option value="distance">Pickup distance</option>}
            </SelectField>
            <div className="search-actions">
              <Button type="submit" disabled={loading}>{loading ? "Searching..." : "Search rides"} <span>→</span></Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setForm(initialSearch);
                  setError("");
                  search(1, initialSearch);
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </form>
      </Panel>
      {error && <Notice>{error}</Notice>}
      <div className="results-heading">
        <div><h2>{result ? `${result.total} rides found` : "Upcoming rides"}</h2><p>Only future scheduled rides with enough available seats are shown.</p></div>
        {result && <Button type="button" variant="outline" disabled={loading} onClick={() => search(result.page)}>Refresh results</Button>}
      </div>
      {loading ? <Spinner label="Finding available rides..." /> : result?.rides?.length ? (
        <>
          <div className="ride-list">{result.rides.map((ride) => <RideCard key={ride._id} ride={ride} />)}</div>
          {result.totalPages > 1 && (
            <div className="pagination">
              <Button variant="outline" disabled={result.page <= 1} onClick={() => search(result.page - 1)}>← Previous</Button>
              <span>Page {result.page} of {result.totalPages}</span>
              <Button variant="outline" disabled={result.page >= result.totalPages} onClick={() => search(result.page + 1)}>Next →</Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="No rides match those filters" description="Try a different date, route, radius, or seat count." />
      )}
    </div>
  );
};

export const CreateRidePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickupLocation: null,
    dropLocation: null,
    departureTime: "",
    totalSeats: "1",
    pricePerSeat: "",
    vehicleType: "car",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const departureDate = new Date(form.departureTime);
    const pickupCoordinates = form.pickupLocation?.coordinates;
    const dropCoordinates = form.dropLocation?.coordinates;
    const seats = Number(form.totalSeats);
    const price = Number(form.pricePerSeat);
    if (
      Number.isNaN(departureDate.getTime()) ||
      departureDate.getTime() <= Date.now() ||
      ![pickupCoordinates, dropCoordinates].every(
        (coordinates) =>
          Array.isArray(coordinates) &&
          coordinates.length === 2 &&
          coordinates.every(Number.isFinite) &&
          coordinates[0] >= -180 &&
          coordinates[0] <= 180 &&
          coordinates[1] >= -90 &&
          coordinates[1] <= 90
      ) ||
      !Number.isInteger(seats) ||
      seats < 1 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Choose pickup and drop locations, a future departure time, valid seats, and a non-negative price.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        pickupLocation: {
          longitude: pickupCoordinates[0],
          latitude: pickupCoordinates[1],
          name: form.pickupLocation.name,
          address: form.pickupLocation.address,
        },
        dropLocation: {
          longitude: dropCoordinates[0],
          latitude: dropCoordinates[1],
          name: form.dropLocation.name,
          address: form.dropLocation.address,
        },
        departureTime: departureDate.toISOString(),
        totalSeats: seats,
        pricePerSeat: price,
        vehicleType: form.vehicleType,
      };
      const result = await ridesApi.create(body);
      navigate(`/rides/${result.ride._id}`, { state: { message: result.message } });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeading eyebrow="DRIVER TOOLS" title="Offer a ride" description="Choose pickup and drop places by searching or selecting them on the map. The backend verifies driver approval and vehicle eligibility." />
      <div className="content-grid create-ride-grid">
        <Panel title="Ride details">
          <form className="form-stack" onSubmit={submit}>
            {error && <Notice>{error}</Notice>}
            <LocationPicker
              label="Pickup location"
              required
              value={form.pickupLocation}
              onChange={(pickupLocation) => setForm((current) => ({ ...current, pickupLocation }))}
            />
            <LocationPicker
              label="Drop location"
              required
              value={form.dropLocation}
              onChange={(dropLocation) => setForm((current) => ({ ...current, dropLocation }))}
            />
            <Field label="Departure time" type="datetime-local" required min={getLocalDateTimeMinimum()} value={form.departureTime} onChange={update("departureTime")} />
            <div className="form-row">
              <Field label="Total seats" type="number" min="1" step="1" required value={form.totalSeats} onChange={update("totalSeats")} />
              <Field label="Price per seat" type="number" min="0" step="any" required value={form.pricePerSeat} onChange={update("pricePerSeat")} />
            </div>
            <SelectField label="Vehicle type" value={form.vehicleType} onChange={update("vehicleType")}>
              <option value="car">Car</option><option value="bike">Bike</option>
            </SelectField>
            <Button type="submit" disabled={busy}>{busy ? "Creating ride..." : "Publish ride"} <span>→</span></Button>
          </form>
        </Panel>
        <Panel title="Before publishing" className="ride-guidance">
          <div className="guidance-step"><span>01</span><div><b>Choose exact places</b><p>Search by name or address, or move the map pin. Coordinates are saved automatically.</p></div></div>
          <div className="guidance-step"><span>02</span><div><b>Choose an approved vehicle</b><p>The ride's vehicle type must match your approved driver application.</p></div></div>
          <div className="guidance-step"><span>03</span><div><b>Eligibility is enforced server-side</b><p>This page does not grant driver access; the protected API verifies approval.</p></div></div>
        </Panel>
      </div>
    </div>
  );
};

export const MyRidesPage = () => {
  const { pathname } = useLocation();
  const completedOnly = pathname === "/completed-rides";
  const trackingOnly = pathname === "/driver/live-tracking";
  const [rides, setRides] = useState([]);
  const [statusFilter, setStatusFilter] = useState("scheduled");
  const [departureFrom, setDepartureFrom] = useState("");
  const [departureTo, setDepartureTo] = useState("");
  const [sort, setSort] = useState("departure_asc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workingId, setWorkingId] = useState("");
  const status = completedOnly
    ? "completed"
    : trackingOnly
      ? "scheduled"
      : statusFilter;

  useEffect(() => {
    setPage(1);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = {
      page,
      limit: 10,
      status,
      sort,
      ...(departureFrom ? { departureFrom } : {}),
      ...(departureTo ? { departureTo } : {}),
    };
    ridesApi.mine(params)
      .then((result) => {
        if (!active) return;
        setRides(result.rides);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pathname, page, status, sort, departureFrom, departureTo]);

  const visibleRides = rides.filter((ride) => {
    if (completedOnly) return ride.status === "completed";
    if (trackingOnly) return !["completed", "cancelled"].includes(ride.status);
    return true;
  });
  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };
  const cancelRide = async (rideId) => {
    if (!window.confirm("Cancel this ride? Confirmed passengers will be notified.")) {
      return;
    }
    setWorkingId(rideId);
    setError("");
    setSuccess("");
    try {
      const result = await ridesApi.cancel(rideId);
      setRides((current) =>
        current.map((ride) =>
          ride._id === rideId ? result.ride : ride
        )
      );
      setSuccess(result.message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId("");
    }
  };
  const title = completedOnly
    ? "Completed rides"
    : trackingOnly
      ? "Live tracking"
      : "My rides";

  return (
    <div className="page">
      <PageHeading
        eyebrow="DRIVER TOOLS"
        title={title}
        description={trackingOnly
          ? "Select one of your active rides to start or manage authorized live location sharing."
          : completedOnly
            ? "Review completed rides and open their details."
            : "Your ride history is loaded from the authenticated backend account."}
        action={!completedOnly && <Link className="button button-primary" to="/rides/create">Offer a ride</Link>}
      />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      {!completedOnly && !trackingOnly && (
        <Panel className="ride-query-panel">
          <div className="ride-query-controls">
            <HistoryTabs
              value={statusFilter === "all" ? "" : statusFilter === "scheduled" ? "upcoming" : statusFilter}
              onChange={(value) => {
                setStatusFilter(value === "upcoming" ? "scheduled" : value);
                setPage(1);
              }}
              label="Driver ride history"
            />
            <Field label="Departure from" type="date" value={departureFrom} onChange={updateFilter(setDepartureFrom)} />
            <Field label="Departure through" type="date" value={departureTo} onChange={updateFilter(setDepartureTo)} />
            <SelectField label="Sort rides" value={sort} onChange={updateFilter(setSort)}>
              <option value="departure_asc">Departure: earliest</option>
              <option value="departure_desc">Departure: latest</option>
              <option value="created_desc">Created: newest</option>
              <option value="created_asc">Created: oldest</option>
            </SelectField>
          </div>
          <span className="field-note">{total} ride(s) in your account.</span>
        </Panel>
      )}
      {loading ? <Spinner /> : visibleRides.length ? (
        <div className="ride-list">
          {visibleRides.map((ride) => (
            <div className="driver-ride-card" key={ride._id}>
              <RideCard ride={ride} />
              <div className="driver-ride-actions">
                <Status value={ride.status} />
                <span className="muted">
                  Booking requests: {ride.bookingSummary?.pending || 0} pending · {ride.bookingSummary?.confirmed || 0} confirmed
                </span>
                <div className="inline-actions">
                  <Link className="button button-outline button-small" to={`/rides/${ride._id}`}>
                    Manage ride
                  </Link>
                  {ride.status === "scheduled" && (
                    <Link className="button button-outline button-small" to={`/rides/${ride._id}/tracking`}>
                      Tracking controls
                    </Link>
                  )}
                  {ride.status === "scheduled" && !ride.startedAt && (
                    <Button
                      type="button"
                      variant="danger"
                      className="button-small"
                      disabled={workingId === ride._id}
                      onClick={() => cancelRide(ride._id)}
                    >
                      {workingId === ride._id ? "Cancelling..." : "Cancel ride"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="pagination">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                ← Previous
              </Button>
              <span>Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Next →
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title={completedOnly ? "No completed rides yet" : trackingOnly ? "No active rides" : "No rides yet"}
          description={completedOnly ? "Completed rides will appear here." : trackingOnly ? "Create or start a scheduled ride to manage live tracking." : "Create a ride to offer seats to your community."}
          action={!completedOnly && <Link className="button button-outline" to="/rides/create">Create a ride</Link>}
        />
      )}
    </div>
  );
};

const idOf = (value) => String(value?._id || value?.id || value || "");

export const RideDetailsPage = () => {
  const { rideId } = useParams();
  const { user, driverApplication } = useAuth();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [existingBooking, setExistingBooking] = useState(null);
  const [existingBookingLoading, setExistingBookingLoading] = useState(true);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [bookingRatings, setBookingRatings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const currentUserId = userId(user);
  const isDriver = idOf(ride?.driver) === currentUserId;

  const loadRide = async () => {
    const result = await ridesApi.get(rideId);
    setRide(result);
    setSeats((value) => Math.min(value, result.availableSeats || 1));
    return result;
  };

  useEffect(() => {
    let active = true;
    ridesApi.get(rideId)
      .then((value) => { if (active) setRide(value); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rideId]);

  useEffect(() => {
    if (!ride || !isDriver) return;
    let active = true;
    Promise.all([bookingsApi.forRide(rideId), ratingsApi.mine()])
      .then(([items, submittedReviews]) => {
        if (!active) return;
        setBookings(items);
        setBookingRatings(submittedReviews);
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); });
    return () => { active = false; };
  }, [ride?._id, isDriver, rideId]);

  useEffect(() => {
    if (!ride || isDriver) return;
    let active = true;
    setExistingBookingLoading(true);
    bookingsApi
      .list({ search: rideId, status: "all", page: 1, limit: 10 })
      .then(({ bookings: passengerBookings }) => {
        if (!active) return;
        const currentBooking = passengerBookings.find(
          (booking) =>
            idOf(booking.ride) === rideId &&
            ["pending", "confirmed"].includes(booking.status)
        );
        setExistingBooking(currentBooking || null);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setExistingBookingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ride?._id, isDriver, rideId]);

  const requestBooking = async () => {
    setBookingLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await bookingsApi.create({ rideId, seatsBooked: Number(seats) });
      setSuccess(result.message);
      setBookingConfirmation(result.booking);
      setExistingBooking(result.booking);
      await loadRide();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBooking = async (bookingId, status) => {
    setError("");
    try {
      await bookingsApi.review(bookingId, status);
      await Promise.all([loadRide(), bookingsApi.forRide(rideId).then(setBookings)]);
      setSuccess(`Booking ${status}.`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const cancelOwnedRide = async () => {
    if (!window.confirm("Cancel this ride? Confirmed passengers will be notified.")) {
      return;
    }
    setCancelBusy(true);
    setError("");
    try {
      const result = await ridesApi.cancel(rideId);
      setRide(result.ride);
      setSuccess(result.message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setCancelBusy(false);
    }
  };

  const loadReviews = async () => {
    setError("");
    try {
      const result = await ratingsApi.forRide(rideId);
      setReviews(result.reviews);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const bookingTotal = Number(seats) * Number(ride?.pricePerSeat);
  const bookingEligible =
    (["user", "passenger"].includes(user?.role) ||
      (user?.role === "driver" && driverApplication?.status === "approved")) &&
    !isDriver &&
    ride?.status === "scheduled" &&
    !ride?.startedAt &&
    new Date(ride?.departureTime).getTime() > Date.now() &&
    ride?.availableSeats > 0;
  const activePassengerBooking =
    existingBooking &&
    ["pending", "confirmed"].includes(existingBooking.status);

  if (loading) return <div className="page"><Spinner label="Loading ride details..." /></div>;
  if (!ride) return <div className="page"><Notice>{error || "Ride not found."}</Notice><Link to="/rides" className="text-link">Back to search</Link></div>;

  return (
    <div className="page">
      <PageHeading eyebrow="RIDE DETAILS" title="Your route, shared." description="Ride information and actions are served by the AVONEX API." action={<Status value={ride.status} />} />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      {bookingConfirmation && (
        <Panel title="Booking request submitted" className="booking-confirmation">
          <p>Your booking is <Status value={bookingConfirmation.status} /> until the driver reviews it.</p>
          <p className="field-note">Booking ID · {bookingConfirmation._id}</p>
          <Link className="text-link" to="/bookings">View it in My Bookings →</Link>
        </Panel>
      )}
      <div className="content-grid ride-detail-grid">
        <div className="detail-main">
          <Panel className="route-panel">
            <div className="route-detail">
              <div className="route-points"><span className="route-dot" /><span className="route-line" /><span className="route-dot route-dot-end" /></div>
              <div className="route-labels route-labels-large">
                <div><span>PICKUP</span><strong>{rideLocation(ride, "pickup")}</strong></div>
                <div><span>DROP-OFF</span><strong>{rideLocation(ride, "drop")}</strong></div>
              </div>
            </div>
            <div className="detail-stat-row">
              <div><span>DEPARTURE</span><b>{formatDate(ride.departureTime)}</b></div>
              <div><span>SEATS AVAILABLE</span><b>{ride.availableSeats} / {ride.totalSeats}</b></div>
              <div><span>VEHICLE</span><b>{ride.vehicleType}</b></div>
              <div><span>PRICE / SEAT</span><b>{Number(ride.pricePerSeat).toFixed(2)}</b></div>
            </div>
          </Panel>

          {isDriver ? (
            <Panel title="Booking requests" action={<span className="muted">{bookings.length} total</span>}>
              {bookings.length ? <div className="booking-list">
                {bookings.map((booking) => (
                  <article className="booking-row" key={booking._id}>
                    <div className="booking-person"><UserAvatar name={booking.passenger?.name} /><div><b>{booking.passenger?.name || "Passenger"}</b><small>{booking.seatsBooked} seat(s) · {Number(booking.totalPrice).toFixed(2)}</small></div></div>
                    <Status value={booking.status} />
                    <Link className="text-link" to={`/support?bookingId=${encodeURIComponent(booking._id)}`}>
                      Report an issue →
                    </Link>
                    {booking.status === "pending" && <div className="inline-actions"><Button type="button" className="button-small" onClick={() => handleBooking(booking._id, "confirmed")}>Confirm</Button><Button type="button" variant="outline" className="button-small" onClick={() => handleBooking(booking._id, "rejected")}>Reject</Button></div>}
                    {ride.status === "scheduled" && !ride.startedAt && booking.status === "confirmed" && booking.isActive !== false && <Button type="button" variant="outline" className="button-small" onClick={async () => { if (!window.confirm("Cancel this confirmed passenger booking?")) return; try { await bookingsApi.cancelByDriver(booking._id); await loadRide(); setBookings(await bookingsApi.forRide(rideId)); } catch (e) { setError(errorMessage(e)); } }}>Cancel booking</Button>}
                    {ride.status === "completed" && booking.status === "confirmed" && (
                      bookingRatings.find((review) => idOf(review.booking) === idOf(booking._id))
                        ? <div className="review-existing"><ReviewCard review={bookingRatings.find((review) => idOf(review.booking) === idOf(booking._id))} /><Link className="text-link" to="/ratings">Manage review →</Link></div>
                        : <ReviewForm bookingId={booking._id} recipient={booking.passenger?.name} onSubmitted={(review) => setBookingRatings((current) => [...current, review])} />
                    )}
                  </article>
                ))}
              </div> : <EmptyState title="No bookings yet" description="New seat requests for this ride will appear here." />}
            </Panel>
          ) : (
            <Panel title="Request a seat">
              {existingBookingLoading ? (
                <Spinner label="Checking your existing booking..." />
              ) : activePassengerBooking ? (
                <div className="existing-booking">
                  <p>You already have an active booking request for this ride.</p>
                  <div><span>Booking status</span><Status value={existingBooking.status} /></div>
                  <div><span>Booking ID</span><strong>{existingBooking._id}</strong></div>
                  <Link className="text-link" to="/bookings">Open My Bookings →</Link>
                </div>
              ) : bookingEligible ? (
                <div className="booking-request">
                  <Field label="Seats" type="number" min="1" max={ride.availableSeats} step="1" value={seats} onChange={(event) => setSeats(event.target.value)} />
                  <div className="booking-price-breakdown">
                    <div><span>Price per seat</span><b>{Number(ride.pricePerSeat).toFixed(2)}</b></div>
                    <div><span>Seats selected</span><b>{Number(seats) || 0}</b></div>
                    <div className="booking-total"><span>Estimated total</span><strong>{Number.isFinite(bookingTotal) ? bookingTotal.toFixed(2) : "0.00"}</strong></div>
                  </div>
                  <Button
                    type="button"
                    disabled={
                      bookingLoading ||
                      !Number.isInteger(Number(seats)) ||
                      Number(seats) < 1 ||
                      Number(seats) > ride.availableSeats
                    }
                    onClick={requestBooking}
                  >
                    {bookingLoading ? "Requesting..." : "Request booking"}
                  </Button>
                  <small>The backend calculates the final price and verifies seat availability. Your request remains pending until the driver confirms it.</small>
                </div>
              ) : (
                <p className="muted">
                  {ride.driver?._id === currentUserId
                    ? "You cannot book your own ride."
                    : "This ride is not currently eligible for a new booking."}
                </p>
              )}
            </Panel>
          )}
        </div>

        <aside className="detail-aside">
          <Panel title="Your driver">
            <div className="driver-profile">
              <UserAvatar name={ride.driver?.name} size="large" />
              <div><strong>{ride.driver?.name || "Driver"}</strong><Stars value={ride.driver?.rating || 0} /></div>
            </div>
            <div className="aside-fact"><span>Rating</span><b>{Number(ride.driver?.rating || 0).toFixed(1)} / 5</b></div>
            <div className="aside-fact"><span>Reviews</span><b>{Number(ride.driver?.ratingCount || 0)}</b></div>
            {ride.driver?._id && (
              <Link className="text-link" to={`/drivers/${ride.driver._id}/reviews`}>
                Driver profile & reviews →
              </Link>
            )}
          </Panel>
          <Panel title="Ride actions">
            <div className="action-stack">
              <Button type="button" variant="outline" onClick={() => navigate(`/rides/${rideId}/tracking`)}>Open live tracking</Button>
              {isDriver && ride.status === "scheduled" && !ride.startedAt && <Button type="button" variant="danger" disabled={cancelBusy} onClick={cancelOwnedRide}>{cancelBusy ? "Cancelling..." : "Cancel ride"}</Button>}
            </div>
          </Panel>
          <Panel title="Ride reviews" action={<button className="text-button" type="button" onClick={loadReviews}>Load reviews</button>}>
            {reviews.length ? <div className="review-list">{reviews.map((review) => <ReviewCard key={review._id} review={review} />)}</div> : <p className="muted">Visible only to the driver and confirmed passengers.</p>}
          </Panel>
        </aside>
      </div>
    </div>
  );
};
