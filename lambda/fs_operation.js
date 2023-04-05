const fs = require("fs");

const deleteLocal = async (path) => {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    await fs.promises.unlink(path);
    return (path + " has been deleted");
  } catch (err) {
    return (path + " is not exsited");
  }
};

module.exports = {
  deleteLocal
};