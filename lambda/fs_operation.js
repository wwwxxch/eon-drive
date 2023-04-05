import fs from "fs";

const deleteLocal = async (path) => {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    await fs.promises.unlink(path);
    // console.log(path + " has been deleted");
    return (path + " has been deleted");
  } catch (err) {
    // console.log(path + " is not exsited");
    return (path + " is not exsited");
  }
}

export {
  deleteLocal
};