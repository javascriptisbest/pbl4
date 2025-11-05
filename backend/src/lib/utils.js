import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Allow cross-origin in production
    secure: process.env.NODE_ENV !== "development", // Required for SameSite=none
  });

  return token;
};
// creatcode (name,role) => {
//   return jwt.sign({ name, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
// }
//user : Minh, role: admin, token : toiquadeptrai
//user : Minh , role : admin, token : toinguqua != toiquadeptrai
// jwt.code(MInh, admin, jwtsecret ) => toiquadeptrai