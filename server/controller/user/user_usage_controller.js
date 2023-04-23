const checkUsed = async (req, res, next) => {
  console.log("checkUsed");
  const allocated = req.session.user.allocated;
  const used = req.session.user.used;
  if (req.body.filesize + used > allocated) {
    return res.status(400).json({ msg: "insufficient space" });
  }
  next();
};

export { checkUsed };