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

const getCurrentVersionByFileId = async(file_id) => {
  const [row] = await pool.query(`
    SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1
  `, file_id);
  if (row.length !== 1) {
    throw new Error("getCurrentVersionByFileId: sth wrong");
  }
  return row[0].ver;
};

const getVersionsByFileId = async(file_id) => {
  const [row] = await pool.query(`
    SELECT ver, size, updated_at AS operation_time, is_current, operation 
    FROM file_ver WHERE ff_id = ? 
    ORDER BY is_current DESC, updated_at DESC 
  `, file_id);

  return row;
};

const getDeleteRecordsByFileId = async(file_id) => {
  const [row] = await pool.query(`
    SELECT deleted_at AS operation_time, "delete" AS operation 
    FROM ff_delete WHERE ff_id = ?
  `, file_id);

  return row;
};

const getParentIdAndNameByFFId = async(ff_id) => {
  const [parent] = await pool.query(`
    SELECT b.parent_id, (SELECT name FROM ff WHERE id = b.parent_id) AS parent_name
    FROM ff AS a INNER JOIN hier AS b ON a.id = b.ff_id
    WHERE a.id = ?
  `, ff_id);

  if (parent.length !== 1) {
    return -1;
  }

  return { parent_id: parent[0].parent_id, parent_name: parent[0].parent_name};
};

const getTrashList = async(user_id) => {

  const [all] = await pool.query(`
    SELECT a.id, a.name, b.parent_id, a.updated_at AS deleted_at 
    FROM ff AS a LEFT JOIN hier AS b ON a.id = b.ff_id
    WHERE a.is_delete = 1 AND b.user_id = ?
  `, user_id);

  const [folder] = await pool.query(`
    SELECT a.id 
    FROM ff AS a LEFT JOIN hier AS b ON a.id = b.ff_id
    WHERE a.is_delete = 1 AND a.type = "folder" AND b.user_id = ?
  `, user_id);

  console.log("all: ", all);
  console.log("folder: ", folder);

  const folderIdList = folder.map(item => item.id);
  console.log("folderIdList: ", folderIdList);
  const trashList = [];
  for (let i = 0; i < all.length; i++) {
    if (!folderIdList.includes(all[i].parent_id)) {
      trashList.push(all[i]);
    }
  }
  // console.log("trashList: ", trashList);
  return trashList;
};

export {
  getDirId,
  getFileId,
  getFileIdNoDel,
  getOneLevelListByParentId,
  getOneLevelChildByParentId,
  getCurrentVersionByFileId,
  getVersionsByFileId,
  getDeleteRecordsByFileId,
  getParentIdAndNameByFFId,
  getTrashList
};
