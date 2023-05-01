import express from "express";

const router = express.Router();

import { loginRedirect } from "../../../../server/controller/user/user_auth_controller.js";

// =====================================================================================

router.get("/", loginRedirect, (req, res) => {
  return res.render("visitor/index");
});

router.get("/login", loginRedirect, (req, res) => {
  return res.render("visitor/login");
});

router.get("/register", loginRedirect, (req, res) => {
	return res.render("visitor/register");
});

router.get("/about", (req, res) => {
  return res.render("visitor/about");
});

router.get("/info", (req, res) => {
  return res.render("visitor/information");
});

export { router as page_visitor };
