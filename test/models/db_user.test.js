import { pool } from "../../server/utils/db_connection.js";
import { checkMail } from "../../server/models/db_user.js";

jest.mock("../../server/utils/db_connection.js", () => {
	const mockPool = {
		query: jest.fn(),
	};
	return { pool: mockPool };
});

describe("checkMail", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test("should return null if email does not exist", async () => {
		pool.query.mockResolvedValueOnce([[]]);

		const result = await checkMail("notexist@example.com");

		expect(result).toBeUndefined();
	});

	test("should return email if email exists", async () => {
		pool.query.mockResolvedValueOnce([[{ email: "test@example.com" }]]);

		const result = await checkMail("test@example.com");

		// toStrictEqual is used for deep equality checking of objects and arrays
		expect(result).toStrictEqual({ email: "test@example.com" });
	});

	test("should handle query error", async () => {
		const mockError = new Error("query error");
		pool.query.mockRejectedValueOnce(mockError);

		const result = await checkMail("test@example.com");

		expect(result).toBeNull();
	});
});
