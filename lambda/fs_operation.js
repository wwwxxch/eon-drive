const fs = require("fs");

const deleteLocal = async (localPath) => {
  try {
    await fs.promises.access(localPath, fs.constants.F_OK);
    await fs.promises.unlink(localPath);
    return (localPath + " has been deleted");
  } catch (err) {
    return (localPath + " is not existed");
  }
};

module.exports = {
  deleteLocal
};