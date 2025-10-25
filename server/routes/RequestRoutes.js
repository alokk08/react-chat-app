import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { getRequests, acceptRequest, declineRequest } from "../controllers/RequestController.js";

const requestRouter = Router();

requestRouter.get("/get-requests", verifyToken, getRequests);
requestRouter.post("/accept/:id", verifyToken, acceptRequest);
requestRouter.post("/decline/:id", verifyToken, declineRequest);

export default requestRouter;
