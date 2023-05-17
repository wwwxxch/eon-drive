import {
	deleteObject,
	deleteAllVersionsForOneObject,
} from "../../../server/services/s3/s3_delete.js";

import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const mockClient1 = {
	send: jest.fn(),
};

mockClient1.send.mockImplementation((command) => {
	if (command instanceof ListObjectsV2Command) {
		return {
			Contents: [{ Key: "test-key" }, { Key: "test-key-1" }, { Key: "test-key-2" }],
		};
	} else if (command instanceof DeleteObjectCommand) {
		return {
			DeleteMarker: true,
		};
	}
});

// deleteAllVersionsForOneObject
describe("deleteAllVersionsForOneObject", () => {
	test("1.should delete all object versions", async () => {
		const result = await deleteAllVersionsForOneObject(
			mockClient1,
			"test-bucket",
			"test-key"
		);

		expect(mockClient1.send).toHaveBeenCalledTimes(4);
		expect(mockClient1.send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
		expect(mockClient1.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
		expect(result).toBe(true);
	});

	test("2.should return false when delete all versions for one object fails", async () => {
		mockClient1.send.mockImplementationOnce(() => {
			throw new Error("deleteAllVersionsForOneObject - Failed to delete object");
		});

		const result = await deleteAllVersionsForOneObject(
			mockClient1,
			"test-bucket",
			"test-key"
		);

		expect(result).toBe(false);
	});
});

const mockClient2 = {
	send: jest.fn(),
};

mockClient2.send.mockImplementation((command) => {
	if (command instanceof ListObjectsV2Command) {
		return {
			Contents: [{ Key: "test-key" }, { Key: "test-key-1" }, { Key: "test-key-2" }],
		};
	} else if (command instanceof DeleteObjectCommand) {
		return {
			DeleteMarker: true,
		};
	}
});

// deleteObject
describe("deleteObject", () => {
	test("1.should delete object", async () => {
		const result = await deleteObject(mockClient2, "test-bucket", "keykeykey");

		expect(mockClient2.send).toHaveBeenCalledTimes(1);
		expect(mockClient2.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
		expect(result).toBe(true);
	});

	test("2.should return false when delete object fails", async () => {
		mockClient2.send.mockImplementationOnce(() => {
			throw new Error("deleteObject - Failed to delete object");
		});

		const result = await deleteObject(mockClient2, "test-bucket", "test-key");

		expect(result).toBe(false);
	});
});
