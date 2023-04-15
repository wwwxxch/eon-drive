import { pool } from "./connection.js";
// ==========================================
// const getDirId = async(folder_name, user_id, parent_id) => {
//   const q_string = `
//     SELECT id, is_delete
//     FROM 
//     (SELECT id, name, type, is_delete FROM ff WHERE name = ? AND type = "folder") AS a
//     INNER JOIN 
//     (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
//     ON a.id = b.ff_id 
//   `;
//   const [row] = await pool.query(q_string, [folder_name, user_id, parent_id]);
//   return row;
// };

const getFolderId = async(user_id, parent_id, folder_name) => {
  const [row] = await pool.query(`
    SELECT id, is_delete FROM ff 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "folder"
  `, [user_id, parent_id, folder_name]);
  return row;
};

// const getFileId = async(file_name, user_id, parent_id) => {
//   const q_string = `
//     SELECT id, is_delete
//     FROM 
//     (SELECT id, name, type, is_delete FROM ff WHERE name = ? AND type = "file") AS a
//     INNER JOIN 
//     (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
//     ON a.id = b.ff_id 
//   `;
//   const [row] = await pool.query(q_string, [file_name, user_id, parent_id]);
//   return row;
// };

const getFileId = async(user_id, parent_id, file_name) => {
  const [row] = await pool.query(`
    SELECT id, is_delete FROM ff 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "file"
  `, [user_id, parent_id, file_name]);
  return row;
};

// const getFileIdNoDel = async(file_name, user_id, parent_id) => {
//   const q_string = `
//     SELECT id
//     FROM 
//     (SELECT id, name, type FROM ff WHERE name = ? AND type = "file" AND is_delete = 0) AS a
//     INNER JOIN 
//     (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
//     ON a.id = b.ff_id 
//   `;
//   const [row] = await pool.query(q_string, [file_name, user_id, parent_id]);
//   return row;
// };

const getNoDelFileId = async(user_id, parent_id, file_name) => {
  const [row] = await pool.query(`
    SELECT id FROM ff 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "file" AND is_delete = 0
  `, [user_id, parent_id, file_name]);
  return row;
};

// const getFileIdIsDel = async(file_name, user_id, parent_id) => {
//   const q_string = `
//     SELECT id
//     FROM 
//     (SELECT id, name, type FROM ff WHERE name = ? AND type = "file" AND is_delete = 1) AS a
//     INNER JOIN 
//     (SELECT ff_id, parent_id FROM hier WHERE user_id = ? AND parent_id = ?) AS b 
//     ON a.id = b.ff_id 
//   `;
//   const [row] = await pool.query(q_string, [file_name, user_id, parent_id]);
//   return row;
// };

const getIsDelFileId = async(user_id, parent_id, file_name) => {
  const [row] = await pool.query(`
    SELECT id FROM ff 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "file" AND is_delete = 1
  `, [user_id, parent_id, file_name]);
  return row;
};

// const getOneLevelListByParentId = async(parent_id) => {
//   const q_string = `
//     SELECT id, name, type, updated_at 
//     FROM (SELECT ff_id, parent_id FROM hier WHERE parent_id = ?) AS a 
//     LEFT JOIN ff AS b
//     ON a.ff_id = b.id
//     WHERE is_delete = 0 AND up_status = "done"
//   `;
//   const [row] = await pool.query(q_string, parent_id);
//   return row;
// };

// const getOneLevelChildByParentId = async(parent_id) => {
//   const q_string = `
//     SELECT id, type 
//     FROM (SELECT ff_id, parent_id FROM hier WHERE parent_id = ?) AS a 
//     LEFT JOIN ff AS b
//     ON a.ff_id = b.id
//     WHERE is_delete = 0 AND up_status = "done"
//   `;
//   const [row] = await pool.query(q_string, parent_id);
//   return row;
// };

// const getOneLevelChildByParentIdDeleted = async(parent_id) => {
//   const q_string = `
//     SELECT id, name, type 
//     FROM (SELECT ff_id, parent_id FROM hier WHERE parent_id = ?) AS a 
//     LEFT JOIN ff AS b
//     ON a.ff_id = b.id
//     WHERE is_delete = 1 AND up_status = "done"
//   `;
//   const [row] = await pool.query(q_string, parent_id);
//   return row;
// };

const getOneLevelChildByParentId = async(parent_id, is_delete) => {
  const q_string = `
    SELECT id, name, type, updated_at
    FROM ff WHERE parent_id = ? AND is_delete = ? AND upd_status = "done" 
  `;
  const [row] = await pool.query(q_string, [parent_id, is_delete]);
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
    SELECT ver, size, is_current, updated_at AS operation_time, operation 
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

// const getParentIdAndNameByFFId = async(ff_id) => {
//   const [parent] = await pool.query(`
//     SELECT b.parent_id, (SELECT name FROM ff WHERE id = b.parent_id) AS parent_name
//     FROM ff AS a INNER JOIN hier AS b ON a.id = b.ff_id
//     WHERE a.id = ?
//   `, ff_id);

//   if (parent.length !== 1) {
//     return -1;
//   }

//   return { parent_id: parent[0].parent_id, parent_name: parent[0].parent_name};
// };

const getParentInfoByFFId = async(ff_id) => {
  const q_string = `
    SELECT a.parent_id, b.name AS parent_name
    FROM ff AS a INNER JOIN ff AS b ON a.parent_id = b.id
    WHERE a.id = ?
  `;
  const [parent] = await pool.query(q_string, ff_id);
  if (parent.length !== 1) {
    return -1;
  }
  return { parent_id: parent[0].parent_id, parent_name: parent[0].parent_name};
};

// const getTrashList = async(user_id) => {
//   const [all] = await pool.query(`
//     SELECT a.id, a.name, a.type, b.parent_id, a.updated_at AS deleted_at 
//     FROM ff AS a LEFT JOIN hier AS b ON a.id = b.ff_id
//     WHERE a.is_delete = 1 AND b.user_id = ?
//   `, user_id);

//   const [folder] = await pool.query(`
//     SELECT a.id 
//     FROM ff AS a LEFT JOIN hier AS b ON a.id = b.ff_id
//     WHERE a.is_delete = 1 AND a.type = "folder" AND b.user_id = ?
//   `, user_id);

//   // console.log("all: ", all);
//   // console.log("folder: ", folder);

//   const folderIdList = folder.map(item => item.id);
//   // console.log("folderIdList: ", folderIdList);
//   const trashList = [];
//   for (let i = 0; i < all.length; i++) {
//     if (!folderIdList.includes(all[i].parent_id)) {
//       trashList.push(all[i]);
//     }
//   }
//   // console.log("trashList: ", trashList);
//   return trashList;
// };

const getDeletedList = async(user_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - getDeletedList");
    await conn.query("START TRANSACTION");
    
    const [all] = await conn.query(`
      SELECT id, name, type, parent_id, updated_at AS deleted_at
      FROM ff WHERE is_delete = 1 AND user_id = ?
    `, user_id);
    
    const [folders] = await conn.query(`
      SELECT id 
      FROM ff WHERE is_delete = 1 AND user_id = ? AND type = "folder" 
    `, user_id);

    await conn.commit();
    console.log("COMMIT");

    // console.log("all: ", all);
    // console.log("folders: ", folders);

    // const folderIdList = folders.map(item => item.id);
    // const trashList = [];
    // all.forEach(item => {
    //   if (!folderIdList.includes(item.parent_id)) trashList.push(item);
    // });
    // console.log("trashList: ", trashList);

    return { all, folders };

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};



export {
  getFolderId,
  getFileId,
  // getFileIdNoDel,
  // getFileIdIsDel,
  // getOneLevelListByParentId,
  getNoDelFileId,
  getIsDelFileId,
  getOneLevelChildByParentId,
  // getOneLevelChildByParentIdDeleted,
  getCurrentVersionByFileId,
  getVersionsByFileId,
  getDeleteRecordsByFileId,
  getParentInfoByFFId,
  // getTrashList
  getDeletedList
};
