import { authentication } from "../../server/middlewares/auth_check.js";
import { CustomError } from "../../server/utils/custom_error.js";

describe("authentication middleware", () => {
	let req, res, next;

	beforeEach(() => {
		req = {
			session: {},
		};
		res = {};
		next = jest.fn();
	});
	test("should call next when user is authenticated", () => {
		// const req = { session: { user: "test" } };
		// const res = {};
		// const next = jest.fn();
		req.session.user = { id: 1 };

		authentication(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	test("should throw an unauthorized error when user is not authenticated", () => {
		// const req = { session: {} };
		// const res = {};
		// const next = jest.fn();
		req.session.user = undefined;

		expect(() => {
			authentication(req, res, next);
		}).toThrow();

		expect(next).not.toHaveBeenCalled();
	});
});
