import fs from "fs";
//==============================================================================
const wrapAsync = (fn) => {
  // reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
  // Make sure to `.catch()` any errors and pass them along to the `next()`
  // middleware in the chain, in this case the error handler.
  return function (req, res, next) {
    fn(req, res, next).catch((err) => {
      console.log("wrapAsync");
      console.error(err);
      next(err);
    });
  };
};

function preventXSS(input) {
  if (!input) {
    return "";
  }
  const htmlEscape = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;"
  };
  const re = new RegExp(Object.keys(htmlEscape).join("|"), "gi");
  return input.replace(re, (matched) => { return htmlEscape[matched]; });
}

const deleteLocal = async (localPath) => {
  try {
    await fs.promises.access(localPath, fs.constants.F_OK);
    await fs.promises.unlink(localPath);
    console.log(localPath + " has been deleted");
  } catch (err) {
    console.log(localPath + " is not exsited");
  }
};

export {
  wrapAsync,
  deleteLocal,
  preventXSS
};
