import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Cookie settings differ for production vs development
  const isProduction = process.env.NODE_ENV === "production";
  
  // Set cookie (for same-origin requests)
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in MS
    httpOnly: true, // prevent XSS attacks
    sameSite: isProduction ? "none" : "lax", // "none" for cross-origin (production), "lax" for local
    secure: isProduction, // HTTPS required in production, HTTP OK in development
    // For LAN access, don't set domain (allows any hostname/IP)
  });

  return token;
};
// creatcode (name,role) => {
//   return jwt.sign({ name, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
// }
//user : Minh, role: admin, token : toiquadeptrai
//user : Minh , role : admin, token : toinguqua != toiquadeptrai
// jwt.code(MInh, admin, jwtsecret ) => toiquadeptrai
