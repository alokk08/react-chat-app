import jwt from "jsonwebtoken";

export const verifyToken = (request, response, next) => {
    const token = request.cookies.jwt;
    if(!token) return response.status(401).json({message: "Your are not Authenticated"});
    jwt.verify(token, process.env.JWT_KEY, (error, payload) => {
        if(error) return response.status(403).json({message: "Invalid Token"});
        request.userId = payload.userId;
        next();
    });
}