import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createS3Folder } from "../../../server/services/s3/s3_create.js";

describe("createS3Folder", () => {
	const mockS3Client = {
		send: jest.fn(),
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	const bucket = "test-bucket";
	const key = "test-folder";

	it("should return true on successful folder creation", async () => {
		mockS3Client.send.mockResolvedValue({});

		const result = await createS3Folder(mockS3Client, bucket, key);
		expect(result).toBe(true);

		expect(mockS3Client.send).toHaveBeenCalledWith(
			expect.objectContaining({
				constructor: PutObjectCommand,
				input: {
					Bucket: bucket,
					Key: `${key}/`,
					Body: "",
				},
			})
		);
	});

	it("should return false on error", async () => {
		const mockError = new Error("mock error");
		mockS3Client.send.mockRejectedValue(mockError);

		const result = await createS3Folder(mockS3Client, bucket, key);
		expect(result).toBe(false);

		expect(mockS3Client.send).toHaveBeenCalledWith(
			expect.objectContaining({
				constructor: PutObjectCommand,
				input: {
					Bucket: bucket,
					Key: `${key}/`,
					Body: "",
				},
			})
		);
	});
	// it("should call send() with expected arguments", async () => {
	// 	const bucket = "test-bucket";
	// 	const key = "test-folder";

	// 	await createS3Folder(mockS3Client, bucket, key);

	// 	expect(mockS3Client.send).toHaveBeenCalledWith(
	// 		expect.objectContaining({
	// 			constructor: PutObjectCommand,
	// 			input: {
	// 				Bucket: bucket,
	// 				Key: `${key}/`,
	// 				Body: "",
	// 			},
	// 		})
	// 	);
	// });
});
