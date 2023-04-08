import dotenv from "dotenv";
dotenv.config();
const {	
  S3_MAIN_BUCKET_NAME,
  S3_DOWNLOAD_BUCKET_NAME
} = process.env;

import {
  chkmail, 
  createUser,
  chkpair, 
  getUser
} from "../../model/db_user.js";

import {
  s3clientGeneral
} from "../../service/s3/s3_client.js";

import {
  createS3Folder
} from "../../service/s3/s3_create.js";

// ====================================================================
const signUp = async (req, res) => {
  console.log("signUp");
  // console.log("signUp: ", req.body);

  const { name, email, password } = req.body;

  // check if the email has been registered
  const getmail = await chkmail(email);
  if (getmail) {
    return res.status(400).json({ error: "Your email has been registered." });
  }

  // create user in DB
  const createUserRes = await createUser(email, password, name);
  
  // save user info to session
  const user = {
      id: createUserRes.id,
      name: createUserRes.name,
      email: createUserRes.email,
      allocated: createUserRes.allocated,
      used: createUserRes.used
  };
  req.session.user = user;

  // create blank folder in S3
  const createMain = await createS3Folder(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${createUserRes.id}`);
  const createDownload = await createS3Folder(s3clientGeneral, S3_DOWNLOAD_BUCKET_NAME, `user_${createUserRes.id}`);
  console.log("signUp: createMain: ", createMain);
  console.log("signUp: createDownload: ", createDownload);

  if (createMain["$metadata"].httpStatusCode !== 200 || createDownload["$metadata"].httpStatusCode !== 200) {
    return res.status(500).json({ msg: "Something Wrong" });
  }

  return res.json({ data: { user } });
};

const signIn = async (req, res) => {
  console.log("signIn");
  // console.log("signIn: ", req.body);

  const { email, password } = req.body;

  // check if the email matches the password
  const getpair = await chkpair(email, password);
  if (!getpair) {
    return res.status(401).json({ error: "Your email and password do not match." });
  }

  // save user info to session
  const getUserRes = await getUser("email", email);
  const user = {
    id: getUserRes.id,
    name: getUserRes.name,
    email: getUserRes.email,
    allocated: getUserRes.allocated,
    used: getUserRes.used
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
