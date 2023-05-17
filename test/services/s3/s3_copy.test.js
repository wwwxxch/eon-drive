import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { copyS3Obj } from "../../../server/services/s3/s3_copy.js";

describe("copyS3Obj", () => {
	// Mock the S3 client's `send()` method
	const mockS3Client = {
		send: jest.fn(),
	};

	afterEach(() => {
		// Clear the mock after each test
		jest.clearAllMocks();
	});

	it("should return true on successful copy", async () => {
		// Mock the `send()` method to return a successful response
		mockS3Client.send.mockResolvedValue({});

		// Call the function and expect it to return true
		const result = await copyS3Obj(mockS3Client, "my-bucket", "fromKey", "toKey");
		expect(result).toBe(true);

		// Expect that the `send()` method was called with the correct arguments
		expect(mockS3Client.send).toHaveBeenCalledWith(
			expect.objectContaining({
				constructor: CopyObjectCommand,
				input: {
					Bucket: "my-bucket",
					CopySource: "my-bucket/fromKey",
					Key: "toKey",
				},
			})
		);
	});

	it("should return false on error", async () => {
		// Mock the `send()` method to throw an error
		const mockError = new Error("mock error");
		mockS3Client.send.mockRejectedValue(mockError);

		// Call the function and expect it to return false
		const result = await copyS3Obj(mockS3Client, "my-bucket", "fromKey", "toKey");
		expect(result).toBe(false);

		// Expect that the `send()` method was called with the correct arguments
		expect(mockS3Client.send).toHaveBeenCalledWith(
			expect.objectContaining({
				constructor: CopyObjectCommand,
				input: {
					Bucket: "my-bucket",
					CopySource: "my-bucket/fromKey",
					Key: "toKey",
				},
			})
		);
	});
});
