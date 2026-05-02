import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({
      success: false,
      message: "NOT AUTHORIZED, LOGIN AGAIN!",
    });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    // Set userId on both req and req.body for backward compat
    req.userId = token_decode.id;
    req.body.userId = token_decode.id;
    next();
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: "Token expired or invalid. Please login again." });
  }
};

export default authUser;
