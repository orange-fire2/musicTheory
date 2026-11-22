import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/").post(createUser).get(getUsers);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

export default router;
