import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;
    if(!tokenHeader) {
      return res.status(401).json({message: "No token provided"});
    }
    const token = tokenHeader?.split(' ')[1];
    if(!token){
      return res.status(401).json({message: "Unauthorized"});
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.id;
    req.role = decodedToken.role;
    next();
  } catch (error) {
    return res.status(401).json({message: "Token is not valid"});
  }
}

export default authMiddleware;