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
  if (!req.session.user) {
    return res.render("visitor/about");
  }
  return res.render("member/about");
});

router.get("/terms", (req, res) => {
  if (!req.session.user) {
    return res.render("visitor/terms");
  }
  return res.render("member/terms");
});

router.get("/privacy", (req, res) => {
  if (!req.session.user) {
    return res.render("visitor/privacy");
  }
  return res.render("member/privacy");
});

router.get("/contact", (req, res) => {
  if (!req.session.user) {
    return res.render("visitor/contact");
  }
  return res.render("member/contact");
});

export { router as page_visitor };
