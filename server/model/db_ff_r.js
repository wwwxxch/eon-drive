import { pool } from "./connection.js";
// ==========================================
const getDirId = async(folder_name, user_id, parent_id) => {
  const q_string = `
    SELECT id, is_delete
    FROM 
    (SELECT id, name, type, is_delete FROM ff WHERE name = ? AND type = "folder") AS a
    INNER JOIN 
    (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
    ON a.id = b.ff_id 
  `;
  const [row] = await pool.query(q_string, [folder_name, user_id, parent_id]);
  return row;
};

const getFileId = async(file_name, user_id, parent_id) => {
  const q_string = `
    SELECT id, is_delete
    FROM 
    (SELECT id, name, type, is_delete FROM ff WHERE name = ? AND type = "file") AS a
    INNER JOIN 
    (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
    ON a.id = b.ff_id 
  `;
  const [row] = await pool.query(q_string, [file_name, user_id, parent_id]);
  return row;
};

const getFileIdNoDel = async(file_name, user_id, parent_id) => {
  const q_string = `
    SELECT id
    FROM 
    (SELECT id, name, type FROM ff WHERE name = ? AND type = "file" AND is_delete = 0) AS a
    INNER JOIN 
    (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
    ON a.id = b.ff_id 
  `;
  const [row] = await pool.query(q_string, [file_name, user_id, parent_id]);
  return row;
};

const getOneLevelListByParentId = async(parent_id) => {
  const q_string = `
    SELECT id, name, type, updated_at 
    FROM (SELECT ff_id, parent_id FROM hier WHERE parent_id = ?) AS a 
    LEFT JOIN ff AS b
    ON a.ff_id = b.id
    WHERE is_delete = 0 AND up_status = "done"
  `;
  const [row] = await pool.query(q_string, parent_id);
  return row;
};

const getOneLevelChildByParentId = async(parent_id) => {
  const q_string = `
    SELECT id, type 
    FROM (SELECT ff_id, parent_id FROM hier WHERE parent_id = ?) AS a 
    LEFT JOIN ff AS b
    ON a.ff_id = b.id
    WHERE is_delete = 0 AND up_status = "done"
  `;
  const [row] = await pool.query(q_string, parent_id);
  return row;
};


export {
  getDirId,
  getFileId,
  getFileIdNoDel,
  getOneLevelListByParentId,
  getOneLevelChildByParentId
};