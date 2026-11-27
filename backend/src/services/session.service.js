import { createHash } from "node:crypto";
import RevokedToken from "../models/RevokedToken.js";

export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const createSessionService = ({
  RevokedTokenModel = RevokedToken,
  now = () => new Date(),
} = {}) => ({
  isRevoked: async (token) => {
    const revoked = await RevokedTokenModel.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: now() },
    });
    return Boolean(revoked);
  },

  revoke: async (token, expiresAt) => {
    if (!(expiresAt instanceof Date) || expiresAt <= now()) {
      throw new Error("A future token expiry is required for revocation");
    }

    const tokenHash = hashToken(token);
    try {
      await RevokedTokenModel.updateOne(
        { tokenHash },
        { $setOnInsert: { tokenHash, expiresAt } },
        { upsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  },
});

const sessionService = createSessionService();

export default sessionService;
