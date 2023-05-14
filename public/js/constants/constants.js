const CHUNK_SIZE = 10 * 1024 * 1024;
const API_VERSION = "1.0";
const CONFIRM_MAIL_EXPIRE_HOUR = 1;
const pwdRegex =
	/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;
export { CHUNK_SIZE, API_VERSION, CONFIRM_MAIL_EXPIRE_HOUR, pwdRegex };
