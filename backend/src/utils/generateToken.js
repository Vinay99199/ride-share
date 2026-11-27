import jwt from "jsonwebtoken";

const generateToken = (userId, authVersion = 0) => {
  return jwt.sign(
    { id: userId, authVersion },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;