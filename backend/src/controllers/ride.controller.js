import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import LiveLocation from "../models/LiveLocation.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import notificationService from "../services/notification.service.js";
import { canCancelRide } from "../services/bookingPolicy.service.js";
import { stopTrackingRoom } from "../realtime/tracking.socket.js";

const publicDriverFields = "name rating ratingCount";
const EARTH_RADIUS_KM = 6378.1;

const isValidPoint = (point) =>
  point &&
  typeof point === "object" &&
  point.type === "Point" &&
  Array.isArray(point.coordinates) &&
  point.coordinates.length === 2 &&
  Number.isFinite(point.coordinates[0]) &&
  Number.isFinite(point.coordinates[1]) &&
  point.coordinates[0] >= -180 &&
  point.coordinates[0] <= 180 &&
  point.coordinates[1] >= -90 &&
  point.coordinates[1] <= 90;

const normalizeRideLocation = (location) => {
  if (!location || typeof location !== "object" || Array.isArray(location)) {
    return null;
  }

  let point;
  let name = "";
  let address = "";
  if (location.type === "Point" && Array.isArray(location.coordinates)) {
    point = { type: "Point", coordinates: location.coordinates };
    name = location.name ?? "";
    address = location.address ?? "";
  } else {
    const { longitude, latitude } = location;
    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number"
    ) {
      return null;
    }
    point = {
      type: "Point",
      coordinates: [longitude, latitude],
    };
    name = location.name ?? "";
    address = location.address ?? "";
  }

  if (
    !isValidPoint(point) ||
    typeof name !== "string" ||
    name.trim().length > 200 ||
    typeof address !== "string" ||
    address.trim().length > 500
  ) {
    return null;
  }

  return {
    point,
    name: name.trim(),
    address: address.trim(),
  };
};

const getCoordinateFilter = (query, prefix) => {
  const longitude = query[`${prefix}Lng`];
  const latitude = query[`${prefix}Lat`];

  if (longitude === undefined && latitude === undefined) {
    return { error: null, coordinates: null };
  }

  if (longitude === undefined || latitude === undefined) {
    return { error: `${prefix}Lng and ${prefix}Lat must be provided together` };
  }

  if (
    typeof longitude !== "string" ||
    typeof latitude !== "string" ||
    !longitude.trim() ||
    !latitude.trim()
  ) {
    return { error: `${prefix} coordinates are invalid` };
  }

  const coordinates = [Number(longitude), Number(latitude)];
  if (
    !coordinates.every(Number.isFinite) ||
    coordinates[0] < -180 ||
    coordinates[0] > 180 ||
    coordinates[1] < -90 ||
    coordinates[1] > 90
  ) {
    return { error: `${prefix} coordinates are invalid` };
  }

  return { error: null, coordinates };
};

const isValidDateOnly = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const parseOptionalNumber = (value, name) => {
  if (value === undefined) {
    return { error: null, value: undefined };
  }

  if (
    typeof value !== "string" ||
    !value.trim() ||
    !Number.isFinite(Number(value))
  ) {
    return { error: `${name} must be a valid number` };
  }

  return { error: null, value: Number(value) };
};

const validateSearchCoordinates = (query, prefix) => {
  const longitude = query[`${prefix}Lng`];
  const latitude = query[`${prefix}Lat`];

  if (longitude === undefined && latitude === undefined) {
    return { error: null, coordinates: null };
  }

  if (longitude === undefined || latitude === undefined) {
    return {
      error: `${prefix}Lng and ${prefix}Lat must be provided together`,
    };
  }

  const parsedLongitude = parseOptionalNumber(longitude, `${prefix}Lng`);
  const parsedLatitude = parseOptionalNumber(latitude, `${prefix}Lat`);
  if (parsedLongitude.error || parsedLatitude.error) {
    return { error: parsedLongitude.error || parsedLatitude.error };
  }

  if (
    parsedLongitude.value < -180 ||
    parsedLongitude.value > 180 ||
    parsedLatitude.value < -90 ||
    parsedLatitude.value > 90
  ) {
    return { error: `${prefix} coordinates are outside valid ranges` };
  }

  return {
    error: null,
    coordinates: [parsedLongitude.value, parsedLatitude.value],
  };
};

export const createRideSearchController = ({
  RideModel = Ride,
  UserModel = User,
  logger = console,
  now = () => new Date(),
} = {}) => async (req, res) => {
  try {
    const pickup = validateSearchCoordinates(req.query, "pickup");
    const drop = validateSearchCoordinates(req.query, "drop");
    if (pickup.error || drop.error) {
      return res.status(400).json({
        success: false,
        message: pickup.error || drop.error,
      });
    }

    const parsedRadius = parseOptionalNumber(req.query.radiusKm, "radiusKm");
    if (parsedRadius.error) {
      return res.status(400).json({
        success: false,
        message: parsedRadius.error,
      });
    }
    const radiusKm = parsedRadius.value ?? 5;
    if (radiusKm <= 0 || radiusKm > 100) {
      return res.status(400).json({
        success: false,
        message: "radiusKm must be greater than 0 and no more than 100",
      });
    }

    const parsedSeats = parseOptionalNumber(
      req.query.seatsRequired,
      "seatsRequired"
    );
    if (parsedSeats.error) {
      return res.status(400).json({
        success: false,
        message: parsedSeats.error,
      });
    }
    const seatsRequired = parsedSeats.value ?? 1;
    if (!Number.isInteger(seatsRequired) || seatsRequired < 1) {
      return res.status(400).json({
        success: false,
        message: "seatsRequired must be a positive integer",
      });
    }

    const parsedMaxPrice = parseOptionalNumber(req.query.maxPrice, "maxPrice");
    if (parsedMaxPrice.error || parsedMaxPrice.value < 0) {
      return res.status(400).json({
        success: false,
        message: parsedMaxPrice.error || "maxPrice must be non-negative",
      });
    }

    if (
      req.query.vehicleType !== undefined &&
      !["car", "bike"].includes(req.query.vehicleType)
    ) {
      return res.status(400).json({
        success: false,
        message: "vehicleType must be car or bike",
      });
    }

    const sort = req.query.sort ?? (pickup.coordinates ? "distance" : "departure");
    if (!["distance", "departure", "price_asc", "price_desc"].includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "sort must be distance, departure, price_asc, or price_desc",
      });
    }
    if (sort === "distance" && !pickup.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Distance sorting requires pickup coordinates",
      });
    }

    const parsedPage = parseOptionalNumber(req.query.page, "page");
    const parsedLimit = parseOptionalNumber(req.query.limit, "limit");
    if (
      parsedPage.error ||
      parsedLimit.error ||
      (parsedPage.value !== undefined &&
        (!Number.isInteger(parsedPage.value) || parsedPage.value < 1)) ||
      (parsedLimit.value !== undefined &&
        (!Number.isInteger(parsedLimit.value) ||
          parsedLimit.value < 1 ||
          parsedLimit.value > 100))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "page must be a positive integer and limit must be an integer from 1 to 100",
      });
    }

    let dateStart;
    let dateEnd;
    const parsedTimezoneOffset = parseOptionalNumber(
      req.query.timezoneOffsetMinutes,
      "timezoneOffsetMinutes"
    );
    if (
      parsedTimezoneOffset.error ||
      (parsedTimezoneOffset.value !== undefined &&
        (!Number.isInteger(parsedTimezoneOffset.value) ||
          parsedTimezoneOffset.value < -840 ||
          parsedTimezoneOffset.value > 720))
    ) {
      return res.status(400).json({
        success: false,
        message: "timezoneOffsetMinutes must be an integer from -840 to 720",
      });
    }
    if (req.query.departureDate !== undefined) {
      if (!isValidDateOnly(req.query.departureDate)) {
        return res.status(400).json({
          success: false,
          message: "departureDate must be a valid date in YYYY-MM-DD format",
        });
      }

      dateStart = new Date(
        new Date(`${req.query.departureDate}T00:00:00.000Z`).getTime() +
          (parsedTimezoneOffset.value ?? 0) * 60_000
      );
      dateEnd = new Date(dateStart);
      dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);
    }

    const page = parsedPage.value ?? 1;
    const limit = parsedLimit.value ?? 20;
    const skip = (page - 1) * limit;
    const currentTime = now();
    const filter = {
      status: "scheduled",
      startedAt: null,
      availableSeats: { $gte: seatsRequired },
      departureTime: { $gt: currentTime },
      driver: { $ne: req.user._id },
    };

    if (dateStart) {
      filter.departureTime = {
        $gt: new Date(Math.max(dateStart.getTime(), currentTime.getTime())),
        $lt: dateEnd,
      };
    }
    if (req.query.vehicleType !== undefined) {
      filter.vehicleType = req.query.vehicleType;
    }
    if (parsedMaxPrice.value !== undefined) {
      filter.pricePerSeat = { $lte: parsedMaxPrice.value };
    }
    const dropLocationFilter = drop.coordinates
      ? {
        $geoWithin: {
          $centerSphere: [drop.coordinates, radiusKm / EARTH_RADIUS_KM],
        },
      }
      : undefined;

    let rides;
    let total;
    if (pickup.coordinates) {
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: pickup.coordinates },
            key: "pickupLocation",
            distanceField: "pickupDistanceMeters",
            maxDistance: radiusKm * 1000,
            spherical: true,
            query: filter,
          },
        },
        ...(dropLocationFilter
          ? [{ $match: { dropLocation: dropLocationFilter } }]
          : []),
        {
          $facet: {
            metadata: [{ $count: "total" }],
            rides: [
              {
                $sort: sort === "distance"
                  ? { pickupDistanceMeters: 1, _id: 1 }
                  : sort === "departure"
                    ? { departureTime: 1, _id: 1 }
                    : sort === "price_asc"
                      ? { pricePerSeat: 1, departureTime: 1, _id: 1 }
                      : { pricePerSeat: -1, departureTime: 1, _id: 1 },
              },
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: UserModel.collection.name,
                  localField: "driver",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1, rating: 1, ratingCount: 1 } }],
                  as: "driverProfile",
                },
              },
              {
                $unwind: {
                  path: "$driverProfile",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  driver: "$driverProfile",
                  pickupLocation: 1,
                  dropLocation: 1,
                  pickupLocationName: 1,
                  pickupAddress: 1,
                  dropLocationName: 1,
                  dropAddress: 1,
                  departureTime: 1,
                  totalSeats: 1,
                  availableSeats: 1,
                  pricePerSeat: 1,
                  vehicleType: 1,
                  status: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  pickupDistanceKm: {
                    $divide: ["$pickupDistanceMeters", 1000],
                  },
                },
              },
            ],
          },
        },
      ];

      const [result] = await RideModel.aggregate(pipeline);
      rides = result?.rides ?? [];
      total = result?.metadata[0]?.total ?? 0;
    } else {
      if (dropLocationFilter) {
        filter.dropLocation = dropLocationFilter;
      }

      [rides, total] = await Promise.all([
        RideModel.find(filter)
          .populate("driver", publicDriverFields)
          .sort(
            sort === "departure"
              ? { departureTime: 1, _id: 1 }
              : sort === "price_asc"
                ? { pricePerSeat: 1, departureTime: 1, _id: 1 }
                : { pricePerSeat: -1, departureTime: 1, _id: 1 }
          )
          .skip(skip)
          .limit(limit),
        RideModel.countDocuments(filter),
      ]);
    }

    return res.status(200).json({
      success: true,
      count: rides.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      sort,
      rides,
    });
  } catch (error) {
    logger.error("Search rides error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to search rides",
    });
  }
};

export const searchRides = createRideSearchController();

export const createRideController = ({
  RideModel = Ride,
  logger = console,
  now = () => Date.now(),
} = {}) => async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "A JSON object is required",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "driver") ||
      Object.prototype.hasOwnProperty.call(body, "driverId")
    ) {
      return res.status(400).json({
        success: false,
        message: "Driver identity is assigned from the authenticated user",
      });
    }

    const {
      pickupLocation,
      dropLocation,
      departureTime,
      totalSeats,
      pricePerSeat,
      vehicleType,
    } = body;

    if (
      pickupLocation === undefined ||
      dropLocation === undefined ||
      departureTime === undefined ||
      totalSeats === undefined ||
      pricePerSeat === undefined ||
      vehicleType === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Pickup, drop, departure time, total seats, price per seat, and vehicle type are required",
      });
    }

    const pickup = normalizeRideLocation(pickupLocation);
    const drop = normalizeRideLocation(dropLocation);
    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message:
          "Pickup and drop must contain valid longitude and latitude values or GeoJSON Points",
      });
    }

    const parsedDepartureTime = new Date(departureTime);
    if (
      typeof departureTime !== "string" ||
      Number.isNaN(parsedDepartureTime.getTime()) ||
      parsedDepartureTime.getTime() <= now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Departure time must be a valid future date and time",
      });
    }

    if (!Number.isInteger(totalSeats) || totalSeats < 1) {
      return res.status(400).json({
        success: false,
        message: "Total seats must be a positive integer",
      });
    }

    if (
      typeof pricePerSeat !== "number" ||
      !Number.isFinite(pricePerSeat) ||
      pricePerSeat < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price per seat must be a non-negative number",
      });
    }

    if (!["car", "bike"].includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type must be car or bike",
      });
    }

    if (vehicleType !== req.driverApplication.vehicleType) {
      return res.status(403).json({
        success: false,
        message: `Ride vehicle type must match your approved driver application (${req.driverApplication.vehicleType})`,
      });
    }

    const ride = await RideModel.create({
      driver: req.user._id,
      pickupLocation: pickup.point,
      dropLocation: drop.point,
      ...(pickup.name ? { pickupLocationName: pickup.name } : {}),
      ...(pickup.address ? { pickupAddress: pickup.address } : {}),
      ...(drop.name ? { dropLocationName: drop.name } : {}),
      ...(drop.address ? { dropAddress: drop.address } : {}),
      departureTime: parsedDepartureTime,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      vehicleType,
    });

    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    logger.error("Create ride error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create ride",
    });
  }
};

export const createRide = createRideController();

const myRideSorts = {
  departure_asc: { departureTime: 1, _id: 1 },
  departure_desc: { departureTime: -1, _id: -1 },
  created_asc: { createdAt: 1, _id: 1 },
  created_desc: { createdAt: -1, _id: -1 },
};

const isValidRideDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  isValidDateOnly(value);

export const createMyRidesController = ({
  RideModel = Ride,
  BookingModel = Booking,
  logger = console,
} = {}) => async (req, res) => {
  const allowedQuery = new Set([
    "page",
    "limit",
    "status",
    "departureFrom",
    "departureTo",
    "sort",
  ]);
  if (Object.keys(req.query ?? {}).some((key) => !allowedQuery.has(key))) {
    return res.status(400).json({
      success: false,
      message: "Unexpected ride filter",
    });
  }

  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const status = req.query.status ?? "all";
  const sort = req.query.sort ?? "departure_asc";
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !["all", "scheduled", "cancelled", "completed"].includes(status) ||
    !Object.hasOwn(myRideSorts, sort)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid page, limit, ride status, or sort order",
    });
  }

  let departureFrom;
  let departureTo;
  if (req.query.departureFrom !== undefined) {
    if (!isValidRideDate(req.query.departureFrom)) {
      return res.status(400).json({
        success: false,
        message: "departureFrom must be a date in YYYY-MM-DD format",
      });
    }
    departureFrom = new Date(`${req.query.departureFrom}T00:00:00.000Z`);
  }
  if (req.query.departureTo !== undefined) {
    if (!isValidRideDate(req.query.departureTo)) {
      return res.status(400).json({
        success: false,
        message: "departureTo must be a date in YYYY-MM-DD format",
      });
    }
    departureTo = new Date(`${req.query.departureTo}T00:00:00.000Z`);
    departureTo.setUTCDate(departureTo.getUTCDate() + 1);
  }
  if (departureFrom && departureTo && departureFrom >= departureTo) {
    return res.status(400).json({
      success: false,
      message: "departureFrom must not be after departureTo",
    });
  }

  try {
    const filter = { driver: req.user._id };
    if (status !== "all") filter.status = status;
    if (departureFrom || departureTo) {
      filter.departureTime = {};
      if (departureFrom) filter.departureTime.$gte = departureFrom;
      if (departureTo) filter.departureTime.$lt = departureTo;
    }

    const skip = (page - 1) * limit;
    const now = new Date();
    const [rides, total, summaryRows, activeRides] = await Promise.all([
      RideModel.find(filter)
        .populate("driver", publicDriverFields)
        .sort(myRideSorts[sort])
        .skip(skip)
        .limit(limit),
      RideModel.countDocuments(filter),
      RideModel.aggregate([
        { $match: { driver: req.user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            scheduled: {
              $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            active: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "scheduled"] },
                      { $ne: ["$startedAt", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            upcoming: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "scheduled"] },
                      { $eq: ["$startedAt", null] },
                      { $gt: ["$departureTime", now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $project: { _id: 0 } },
      ]),
      RideModel.find({
        driver: req.user._id,
        status: "scheduled",
        startedAt: { $ne: null },
      })
        .populate("driver", publicDriverFields)
        .sort({ startedAt: -1, _id: -1 })
        .limit(10),
    ]);

    const rideIds = rides.map((ride) => ride._id);
    const bookingSummaries = rideIds.length
      ? await BookingModel.aggregate([
          {
            $match: {
              ride: { $in: rideIds },
              status: { $in: ["pending", "confirmed"] },
              isActive: true,
            },
          },
          {
            $group: {
              _id: { ride: "$ride", status: "$status" },
              count: { $sum: 1 },
            },
          },
        ])
      : [];
    const summaryByRide = new Map();
    for (const summary of bookingSummaries) {
      const rideId = String(summary._id.ride);
      const current = summaryByRide.get(rideId) ?? {
        pending: 0,
        confirmed: 0,
        total: 0,
      };
      current[summary._id.status] = summary.count;
      current.total += summary.count;
      summaryByRide.set(rideId, current);
    }

    const items = rides.map((ride) => ({
      ...ride.toObject(),
      bookingSummary: summaryByRide.get(String(ride._id)) ?? {
        pending: 0,
        confirmed: 0,
        total: 0,
      },
    }));
    return res.status(200).json({
      success: true,
      count: rides.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: summaryRows[0] ?? {
        total: 0,
        scheduled: 0,
        cancelled: 0,
        completed: 0,
        active: 0,
        upcoming: 0,
      },
      activeRides,
      rides: items,
    });
  } catch (error) {
    logger.error("Fetch driver's rides error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch your rides",
    });
  }
};

export const getMyRides = createMyRidesController();

export const getAvailableRides = async (req, res) => {
  try {
    const pickup = getCoordinateFilter(req.query, "pickup");
    const destination = getCoordinateFilter(req.query, "destination");

    if (pickup.error || destination.error) {
      return res.status(400).json({
        success: false,
        message: pickup.error || destination.error,
      });
    }

    if (
      req.query.radiusKm !== undefined &&
      (typeof req.query.radiusKm !== "string" ||
        !req.query.radiusKm.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "radiusKm must be a number",
      });
    }

    const radiusKm =
      req.query.radiusKm === undefined ? 5 : Number(req.query.radiusKm);
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
      return res.status(400).json({
        success: false,
        message: "radiusKm must be greater than 0 and no more than 100",
      });
    }

    const filter = {
      status: "scheduled",
      startedAt: null,
      availableSeats: { $gt: 0 },
      departureTime: { $gt: new Date() },
    };

    if (pickup.coordinates) {
      filter.pickupLocation = {
        $geoWithin: {
          $centerSphere: [pickup.coordinates, radiusKm / EARTH_RADIUS_KM],
        },
      };
    }

    if (destination.coordinates) {
      filter.dropLocation = {
        $geoWithin: {
          $centerSphere: [
            destination.coordinates,
            radiusKm / EARTH_RADIUS_KM,
          ],
        },
      };
    }

    if (req.query.departureDate !== undefined) {
      if (!isValidDateOnly(req.query.departureDate)) {
        return res.status(400).json({
          success: false,
          message: "departureDate must be a valid date in YYYY-MM-DD format",
        });
      }

      const start = new Date(`${req.query.departureDate}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.departureTime = {
        $gte: new Date(Math.max(start.getTime(), Date.now())),
        $lt: end,
      };
    }

    const rides = await Ride.find(filter)
      .populate("driver", publicDriverFields)
      .sort({ departureTime: 1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Fetch available rides error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch available rides",
    });
  }
};

export const getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;
    if (!mongoose.isValidObjectId(rideId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(rideId).populate(
      "driver",
      publicDriverFields
    );
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    return res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error("Fetch ride details error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch ride details",
    });
  }
};

export const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    if (!mongoose.isValidObjectId(rideId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (!ride.driver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride's driver can cancel it",
      });
    }

    if (!canCancelRide(ride)) {
      return res.status(409).json({
        success: false,
        message: "Only rides that have not started can be cancelled",
      });
    }

    const cancelledRide = await Ride.findOneAndUpdate(
      {
        _id: ride._id,
        driver: req.user._id,
        status: "scheduled",
        startedAt: null,
      },
      { $set: { status: "cancelled", trackingActive: false } },
      { new: true, runValidators: true }
    ).populate("driver", publicDriverFields);

    if (!cancelledRide) {
      return res.status(409).json({
        success: false,
        message: "Ride status changed before it could be cancelled",
      });
    }

    await notificationService.notifyConfirmedRidePassengers(
      ride._id,
      "ride_cancelled",
      "Ride cancelled",
      "Your driver cancelled the ride."
    );
    await LiveLocation.deleteOne({ ride: ride._id });
    await stopTrackingRoom(ride._id, "ride_cancelled");

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride: cancelledRide,
    });
  } catch (error) {
    console.error("Cancel ride error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to cancel ride",
    });
  }
};
