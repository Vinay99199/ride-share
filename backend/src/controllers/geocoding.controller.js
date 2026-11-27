import geocodingService from "../services/geocoding.service.js";

const parseCoordinate = (value, minimum, maximum) => {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }
  const coordinate = Number(value);
  return coordinate >= minimum && coordinate <= maximum ? coordinate : null;
};

export const createGeocodingController = ({
  service = geocodingService,
  logger = console,
} = {}) => {
  const searchPlaces = async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 3 || query.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Search text must be between 3 and 120 characters",
      });
    }

    try {
      const places = await service.search(query);
      return res.status(200).json({ success: true, places });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      logger.error("Place search failed:", error.message);
      return res.status(503).json({
        success: false,
        message: "Place search is temporarily unavailable",
      });
    }
  };

  const reverseGeocode = async (req, res) => {
    const longitude = parseCoordinate(req.query.lon, -180, 180);
    const latitude = parseCoordinate(req.query.lat, -90, 90);
    if (longitude === null || latitude === null) {
      return res.status(400).json({
        success: false,
        message: "Valid longitude and latitude values are required",
      });
    }

    try {
      const place = await service.reverse(longitude, latitude);
      return res.status(200).json({ success: true, place });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      logger.error("Reverse geocoding failed:", error.message);
      return res.status(503).json({
        success: false,
        message: "Address lookup is temporarily unavailable",
      });
    }
  };

  return { reverseGeocode, searchPlaces };
};

const controller = createGeocodingController();
export const searchPlaces = controller.searchPlaces;
export const reverseGeocode = controller.reverseGeocode;
