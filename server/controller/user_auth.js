import dotenv from "dotenv";
dotenv.config();

const {	S3_BUCKET_NAME } = process.env;

import {
  chkmail, 
  chkpair, 
  getUser, 
  createUser
} from "../model/db_user.js";

import {
  createFolder
} from "../util/s3_create.js";

// ====================================================================
const signUp = async (req, res) => {
  console.log("signUp");
  // console.log("signUp: ", req.body);
  const { name, email, password } = req.body;
  const getmail = await chkmail(email);
  if (getmail) {
    return res.status(400).json({ error: "Your email has been registered." });
  }

  const result = await createUser(email, password, name);
  const user = {
      id: result.id,
      name: result.name,
      email: result.email,
      allocated: result.allocated,
      used: result.used
  };

  req.session.user = user;

  // create blank folder
  const createRes = await createFolder(S3_BUCKET_NAME, `user_${result.id}` );
  console.log("signUp: createRes: ", createRes);
  if (createRes["$metadata"].httpStatusCode !== 200) {
    return res.status(500).json({ msg: "Something Wrong" });
  }

  return res.json({ data: { user } });
};

const signIn = async (req, res) => {
  console.log("signIn");
  // console.log("signIn: ", req.body);
  const { email, password } = req.body;
  const getpair = await chkpair(email, password);
  if (!getpair) {
    return res.status(401).json({ error: "Your email and password do not match." });
  }

  const result = await getUser("email", email);
  const user = {
    id: result.id,
      name: result.name,
      email: result.email,
      allocated: result.allocated,
      used: result.used
  };

  req.session.user = user;
  
  return res.json({ data: { user } });
};

const logOut = async (req, res) => {
  console.log("logOut");
  req.session.destroy();
  return res.json({ msg: "logout" });
};

const showProfile = async (req, res) => {
  console.log("showProfile");
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ data: { user: req.session.user } });
};

const loginStatus = async (req, res) => {
  console.log("loginStatus");
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ msg: "Authorized" }); 
};

const authentication = async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export {
  signUp,
  signIn,
  logOut,
  showProfile,
  loginStatus,
  authentication
};
