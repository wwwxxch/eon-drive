import { pool } from "./connection.js";
// ----------------------------------------------------------
const chkLinkByTargetId = async (fileId) => {
  try {
    const [row] = await pool.query(`
      SELECT id, token FROM share_link WHERE file_id = ?
    `, fileId);
    // console.log("chkLink: ", row);
    return row;
  } catch (e) {
    console.error("(fn) chkLink error: ", e);
    return null;
  }
};

const createLink = async (fileId, token) => {
  try {
    const [row] = await pool.query(`
      INSERT INTO share_link (file_id, token) VALUES (?, ?)
    `, [fileId, token]);
    return row;
  } catch (e) {
    console.error("(fn) createLink error: ", e);
    return null;
  }
};

const chkTargetByLink = async (token) => {
  try {
    const [row] = await pool.query(`
      SELECT file_id AS target_id FROM share_link WHERE token = ?
    `, token);
    return row;
  } catch (e) {
    console.error("(fn) chkTargetByLink: ", e);
  }
};

export {
  chkLinkByTargetId,
  createLink,
  chkTargetByLink
};