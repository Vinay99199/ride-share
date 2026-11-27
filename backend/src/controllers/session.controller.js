import sessionService, { hashToken } from "../services/session.service.js";
import { disconnectTokenSockets } from "../realtime/tracking.socket.js";

export const createLogoutController = ({
  sessions = sessionService,
  disconnectSockets = disconnectTokenSockets,
  logger = console,
} = {}) => async (req, res) => {
  try {
    await sessions.revoke(req.authToken, req.authTokenExpiresAt);
    await disconnectSockets(hashToken(req.authToken));
    return res.status(200).json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to revoke this session",
    });
  }
};

const logoutUser = createLogoutController();

export default logoutUser;
