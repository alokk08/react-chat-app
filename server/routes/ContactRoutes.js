import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { getAllContacts, getContactsForDMList, searchContacts } from "../controllers/ContactController.js";

const contactsRouter = Router();

contactsRouter.post("/search", verifyToken, searchContacts);
contactsRouter.get("/get-contacts-for-dm", verifyToken, getContactsForDMList);
contactsRouter.get("/get-all-contacts", verifyToken, getAllContacts);

export default contactsRouter;