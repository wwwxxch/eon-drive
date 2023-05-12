import { pool } from "./connection.js";
// ----------------------------------------------------------
const checkLinkByFilesId = async (files_id, user_id) => {
	try {
		const [row] = await pool.query(
			`
      SELECT share_token, is_public, type FROM files WHERE id = ? AND user_id = ?
    `,
			[files_id, user_id]
		);

		if (row.length !== 1) {
			throw new Error(`checkLinkByFilesId: row = ${row}`);
		}

		return row[0];
	} catch (e) {
		console.error("checkLinkByFilesId error: ", e);
		return null;
	}
};

const createPublicLink = async (files_id, share_token) => {
	try {
		const [row] = await pool.query(
			`
      UPDATE files SET share_token = ?, is_public = 1 WHERE id = ?
    `,
			[share_token, files_id]
		);

		return row;
	} catch (e) {
		console.error("createPublicLink error: ", e);
		return null;
	}
};

const createPrivateLink = async (files_id, share_token, time, user_list) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - createPrivateLink");
		await conn.query("START TRANSACTION");

		const [files] = await conn.query(
			`
      UPDATE files SET share_token = ?, is_public = 0 WHERE id = ?
    `,
			[share_token, files_id]
		);

		for (const user of user_list) {
			const [share_link_perm] = await conn.query(
				`
        INSERT INTO share_link_perm (files_id, has_access, created_at, is_read)
        VALUES (?, ?, ?, 0)
      `,
				[files_id, parseInt(user), time]
			);
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

const changeLinkToPublic = async (files_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - changeLinkToPublic");
		await conn.query("START TRANSACTION");

		const [files] = await conn.query(
			`
      UPDATE files SET is_public = 1 WHERE id = ?`,
			files_id
		);

		const [share_link_perm] = await conn.query(
			`
      DELETE FROM share_link_perm WHERE files_id = ?`,
			files_id
		);

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

const changeLinkToPrivate = async (files_id, time, user_list) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - changeLinkToPrivate");
		await conn.query("START TRANSACTION");

		const [files] = await conn.query(
			`
      UPDATE files SET is_public = 0 WHERE id = ?`,
			files_id
		);

		for (const user of user_list) {
			const [share_link_perm] = await conn.query(
				`
        INSERT INTO share_link_perm (files_id, has_access, created_at, is_read)
        VALUES (?, ?, ?, 0 )
      `,
				[files_id, user, time]
			);
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

const addUserToAccessList = async (files_id, time, user_list) => {
	// check if the user is already in the share_link_perm table
	// if yes - ignore
	// if no - add user
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - addUserToAccessList");
		await conn.query("START TRANSACTION");

		let [currentUser] = await conn.query(
			`
      SELECT has_access as user_id FROM share_link_perm WHERE files_id = ?
    `,
			files_id
		);
		currentUser = currentUser.map((item) => item.user_id);

		for (const user of user_list) {
			if (!currentUser.includes(user)) {
				const [share_link_perm] = await conn.query(
					`
          INSERT INTO 
            share_link_perm (files_id, has_access, created_at, is_read) 
            VALUES (?, ?, ?, 0)
        `,
					[files_id, user, time]
				);
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

const getAccessList = async (files_id) => {
	const [row] = await pool.query(
		`
    SELECT has_access FROM share_link_perm WHERE files_id = ?`,
		files_id
	);
	// const user_list = row.map((item) => item.has_access);
	return row.map((item) => item.has_access);
};

const getTargetByLink = async (share_token) => {
	const [row] = await pool.query(
		`
    SELECT id, name, type, is_public, user_id 
    FROM files WHERE share_token = ?
  `,
		share_token
	);
	if (row.length > 1) {
		console.error("getTargetByLink - duplicated share_token in files");
		return null;
	}
	return row[0];
};

const getLinksSharedWithYou = async (has_access) => {
	const [row] = await pool.query(
		`
    SELECT
      a.files_id,
      a.has_access,
      b.name as files_name, 
      c.name as owner, 
      CASE 
        WHEN b.type = "folder" THEN CONCAT ("view/fo/", b.share_token)
        ELSE CONCAT ("view/fi/", b.share_token) 
        END AS link 
    FROM share_link_perm AS a 
      INNER JOIN files AS b on a.files_id = b.id
      INNER JOIN user AS c on b.user_id = c.id
    WHERE a.has_access = ?
  `,
		has_access
	);
	return row;
};

const getLinksYouShared = async (user_id) => {
	const [row] = await pool.query(
		`
    SELECT 
      a.id as files_id,
      a.name as files_name,
      CASE 
        WHEN a.type = "folder" THEN CONCAT ("view/fo/", a.share_token)
        ELSE CONCAT ("view/fi/", a.share_token) END AS link,
      a.is_public,
      c.name as user_name,
      c.email as user_email
    FROM files AS a 
      LEFT JOIN share_link_perm AS b ON a.id = b.files_id 
      LEFT JOIN user AS c on b.has_access = c.id
    WHERE a.user_id = ? AND share_token IS NOT NULL
  `,
		user_id
	);
	return row;
};

const deleteLinkByFilesId = async (user_id, files_id, is_public) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - deleteLinkByFilesId");
		await conn.query("START TRANSACTION");

		const [files] = await conn.query(
			`
      UPDATE files SET share_token = null, is_public = 0 WHERE user_id = ? AND id = ? 
    `,
			[user_id, files_id]
		);

		if (is_public === 0) {
			const [share_link_perm] = await conn.query(
				`
        DELETE FROM share_link_perm WHERE files_id = ?
      `,
				[files_id]
			);
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

const getFilesShareStatus = async (user_id, files_id) => {
	const [row] = await pool.query(
		`
    SELECT a.type, a.share_token, a.is_public, c.name, c.email
    FROM files AS a 
    LEFT JOIN share_link_perm AS b ON a.id = b.files_id
    LEFT JOIN user AS c ON b.has_access = c.id
    WHERE a.user_id = ? AND a.id = ?
  `,
		[user_id, files_id]
	);

	return row;
};

const getLinksSharedNotice = async (has_access, is_read, offset = 5) => {
	try {
		const q_string = `
      SELECT
        a.id AS share_id,
        a.files_id,
        a.has_access,
        a.created_at,
        DATE_FORMAT(a.created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS time_shared,
        a.is_read,
        b.name as files_name,
        CASE 
          WHEN b.type = "folder" THEN CONCAT ("view/fo/", b.share_token)
          ELSE CONCAT ("view/fi/", b.share_token) 
          END AS link, 
        c.name as owner
      FROM share_link_perm AS a 
        INNER JOIN files AS b on a.files_id = b.id
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
	} catch (e) {
		console.error("getLinksSharedNotice: ", e);
		return [];
	}
};

const changeNoticeReadStatus = async (has_access, share_id) => {
	try {
		const [row] = await pool.query(
			`
      UPDATE share_link_perm SET is_read = 1 
      WHERE has_access = ? AND id = ?
    `,
			[has_access, share_id]
		);

		return row;
	} catch (e) {
		console.error("changeNoticeReadStatus: ", e);
		return null;
	}
};

export {
	checkLinkByFilesId,
	createPublicLink,
	createPrivateLink,
	changeLinkToPublic,
	changeLinkToPrivate,
	addUserToAccessList,
	getAccessList,
	getTargetByLink,
	getLinksSharedWithYou,
	getLinksYouShared,
	deleteLinkByFilesId,
	getFilesShareStatus,
	getLinksSharedNotice,
	changeNoticeReadStatus,
};
