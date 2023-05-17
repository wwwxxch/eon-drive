import { shareTokenGenerator } from "../../../server/services/share/token_gen.js";

/* 
  In your test file, you don't need to import and call dotenv.config() again 
  because the environment variables have already been loaded in the parent process. 
  Jest automatically loads the environment variables from the .env file before running the tests,
   so they are available in the process.env object during the tests.
*/

describe("shareTokenGenerator", () => {
	// it("should generate a token with the correct length", () => {
	// 	const token = shareTokenGenerator();
	// 	expect(token.length).toBe(parseInt(process.env.SHARE_TOKEN_LENGTH));
	// });

	it("should generate a token containing only base62 characters & with the correct length", () => {
		const token = shareTokenGenerator();
		const regex = new RegExp(`^[0-9A-Za-z]{${process.env.SHARE_TOKEN_LENGTH}}$`);
		expect(token).toMatch(regex);
	});
});
