import { pool } from "./connection.js";
// ----------------------------------------------------------
const checkLinkByFFId = async(ff_id) => {
  try {
    const [row] = await pool.query(`
      SELECT share_token, is_public FROM ff WHERE id = ?
    `, ff_id);

    if (row.length !== 1) {
      throw new Error (`checkLinkByFFId: row = ${row}`);
    }

    return row[0];
  } catch (e) {
    console.error("checkLinkByFFId error: ", e);
    return null;
  }
};

const createPublicLink = async(ff_id, share_token) => {
  try {
    const [row] = await pool.query(`
      UPDATE ff SET share_token = ?, is_public = 1 WHERE id = ?
    `, [share_token, ff_id]);
    
    return row;
  } catch (e) {
    console.error("createPublicLink error: ", e);
    return null;
  }
};

const createPrivateLink = async(ff_id, share_token, time, user_list) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - createPrivateLink");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(`
      UPDATE ff SET share_token = ?, is_public = 0 WHERE id = ?
    `, [share_token, ff_id]);
    
    for (const user of user_list) {
      const [share_link_perm] = await conn.query(`
        INSERT INTO share_link_perm (ff_id, has_access, created_at, is_read)
        VALUES (?, ?, ?, 0)
      `, [ff_id, parseInt(user), time]);
    }

    await conn.commit();
    console.log("COMMIT");
    return true;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return false;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const changeLinkToPublic = async(ff_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - changeLinkToPublic");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(`
      UPDATE ff SET is_public = 1 WHERE id = ?`, ff_id);
    
    const [share_link_perm] = await conn.query(`
      DELETE FROM share_link_perm WHERE ff_id = ?`, ff_id);

    await conn.commit();
    console.log("COMMIT");
    return true;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return false;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const changeLinkToPrivate = async(ff_id, time, user_list) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - changeLinkToPrivate");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(`
      UPDATE ff SET is_public = 0 WHERE id = ?`, ff_id);
    
    for (const user of user_list) {
      const [share_link_perm] = await conn.query(`
        INSERT INTO share_link_perm (ff_id, has_access, created_at, is_read)
        VALUES (?, ?, ?, 0 )
      `, [ff_id, user, time]);
    }

    await conn.commit();
    console.log("COMMIT");
    return true;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return false;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const addUserToAcessList = async(ff_id, time, user_list) => {
  // check if the user is already in the share_link_perm table
  // if yes - ignore
  // if no - add user
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - addUserToAcessList");
    await conn.query("START TRANSACTION");
    
    let [currentUser] = await conn.query(`
      SELECT has_access as user_id FROM share_link_perm WHERE ff_id = ?
    `, ff_id);
    currentUser = currentUser.map(item => item.user_id);
    
    for (const user of user_list) {
      if (!currentUser.includes(user)) {
        const [share_link_perm] = await conn.query(`
          INSERT INTO 
            share_link_perm (ff_id, has_access, created_at, is_read) 
            VALUES (?, ?, ?, 0)
        `, [ff_id, user, time]);
      }
    }

    await conn.commit();
    console.log("COMMIT");
    return true;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return false;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const getAccessList = async (ff_id) => {
  const [row] = await pool.query(`
    SELECT has_access FROM share_link_perm WHERE ff_id = ?`, ff_id);
  const user_list = row.map(item => item.has_access);
  return user_list;
};

const getTargetByLink = async (share_token) => {
  const [row] = await pool.query(`
    SELECT id, name, type, is_public, user_id 
    FROM ff WHERE share_token = ?
  `, share_token);
  if (row.length > 1) {
    console.error("getTargetByLink - duplicated share_token in ff");
    return null;
  }
  return row[0];
};

const getLinksSharedWithYou = async (has_access) => {
  const [row] = await pool.query(`
    SELECT
      a.ff_id,
      a.has_access,
      b.name as ff_name, 
      c.name as owner, 
      CASE 
        WHEN b.type = "folder" THEN CONCAT ("view/fo/", b.share_token)
        ELSE CONCAT ("view/fi/", b.share_token) 
        END AS link 
    FROM share_link_perm AS a 
      INNER JOIN ff AS b on a.ff_id = b.id
      INNER JOIN user AS c on b.user_id = c.id
    WHERE a.has_access = ?
  `, has_access);
  return row;
};

const getLinksYouShared = async (user_id) => {
  const [row] = await pool.query(`
    SELECT 
      a.id as ff_id,
      a.name as ff_name,
      CASE 
        WHEN a.type = "folder" THEN CONCAT ("view/fo/", a.share_token)
        ELSE CONCAT ("view/fi/", a.share_token) END AS link,
      a.is_public,
      c.name as user_name,
      c.email as user_email
    FROM ff AS a 
      LEFT JOIN share_link_perm AS b ON a.id = b.ff_id 
      LEFT JOIN user AS c on b.has_access = c.id
    WHERE a.user_id = ? AND share_token IS NOT NULL
  `, user_id);
  return row;
};

const deleteLinkByFFId = async(user_id, ff_id, is_public) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - deleteLinkByFFid");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(`
      UPDATE ff SET share_token = null, is_public = 0 WHERE user_id = ? AND id = ? 
    `, [user_id, ff_id]);
    
    if (is_public === 1) {
      const [share_link_perm] = await conn.query(`
        DELETE FROM share_link_perm WHERE ff_id = ?
      `, [ff_id]);
    } 
    
    await conn.commit();
    console.log("COMMIT");
    return true;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return false;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const getFFShareStatus = async(user_id, ff_id) => {
  const [row] = await pool.query(`
    SELECT a.type, a.share_token, a.is_public, c.name, c.email
    FROM ff AS a 
    LEFT JOIN share_link_perm AS b ON a.id = b.ff_id
    LEFT JOIN user AS c ON b.has_access = c.id
    WHERE a.user_id = ? AND a.id = ?
  `, [user_id, ff_id]);

  return row;
};

const getLinksSharedNoti = async(has_access, is_read, offset = 5) => {
  console.log(offset);
  const q_string = `
    SELECT
      a.id AS share_id,
      a.ff_id,
      a.has_access,
      a.created_at,
      DATE_FORMAT(a.created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS time_shared,
      a.is_read,
      b.name as ff_name, 
      c.name as owner
    FROM share_link_perm AS a 
      INNER JOIN ff AS b on a.ff_id = b.id
      INNER JOIN user AS c on b.user_id = c.id
    WHERE a.has_access = ? AND a.is_read = ?
    ORDER BY time_shared DESC
  `;
  const condition = "LIMIT ?";

  let row;
  if (is_read === 0) {
    [row] = await pool.query(q_string, [has_access, is_read]);
  } else if (is_read === 1) {
    [row] = await pool.query(q_string + condition, [has_access, is_read, offset]);
  }
  return row;
};

const changeNotiRead = async(has_access, share_id) => {
  try {
    const [row] = await pool.query(`
      UPDATE share_link_perm SET is_read = 1 
      WHERE has_access = ? AND id = ?
    `, [has_access, share_id]);

    return row;
  } catch (e) {
    console.error("changeNotiRead: ", e);
    return null;
  }
  
};

export {
  checkLinkByFFId,
  createPublicLink,
  createPrivateLink,
  changeLinkToPublic,
  changeLinkToPrivate,
  addUserToAcessList,
  getAccessList,
  getTargetByLink,
  getLinksSharedWithYou,
  getLinksYouShared,
  deleteLinkByFFId,
  getFFShareStatus,
  getLinksSharedNoti,
  changeNotiRead
};