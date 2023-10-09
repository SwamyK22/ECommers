import express from "express";
import { getMyProfile, logOut, login, signup, changePassword, updateProfile, updatePic, forgetPassword, resetPassword } from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/login", login)
router.post("/new", singleUpload, signup)
router.get("/me", isAuthenticated, getMyProfile)
router.get("/logout", isAuthenticated, logOut);


//Update Routes

router.put("/updateprofile", isAuthenticated, updateProfile)
router.put("/changepassword", isAuthenticated, changePassword)
router.put("/updatepic", isAuthenticated, singleUpload, updatePic);

//Forget Password & Reset Password

router.route("/forgetpassword").post(forgetPassword).put(resetPassword)


export default router;