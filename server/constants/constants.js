const uuidv4Regex =
	"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[8|9|aA|bB][0-9a-f]{3}-[0-9a-f]{12}";

const pwdRegex =
	/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;

const regexForFilesName = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ \[\]\(\)\+]+$/;

const readNotificationNumber = 5;

export { uuidv4Regex, pwdRegex, regexForFilesName, readNotificationNumber };
