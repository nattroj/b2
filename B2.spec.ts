import { B2 } from "./B2";
import { v4 as uuidv4 } from "uuid";
import got from "got";

describe("B2", () => {
  describe("authorize", () => {
    it("adds authorizationToken to instance", async () => {
      const b2 = new B2({
        applicationKey: process.env.APPLICATION_KEY,
        keyId: process.env.KEY_ID,
      });

      expect(b2.instance).toBe(undefined);

      await b2.authorize();

      expect(b2.instance).toBeTruthy();
    });
  });

  describe("createKey", () => {
    it("creates a key on b2", async () => {
      const b2 = new B2({
        applicationKey: process.env.APPLICATION_KEY,
        keyId: process.env.KEY_ID,
      });

      await b2.authorize();

      const key = await b2.createKey({
        keyName: "test",
        capabilities: ["readFiles"],
      });

      expect(key).toHaveProperty("keyId");
      expect(key).toHaveProperty("applicationKey");
    });
  });

  describe("deleteKey", () => {
    it("deletes a key on b2", async () => {
      const b2 = new B2({
        applicationKey: process.env.APPLICATION_KEY,
        keyId: process.env.KEY_ID,
      });

      await b2.authorize();
      const key = await b2.createKey({
        keyName: "test",
        capabilities: ["readFiles"],
      });

      await b2.deleteKey(key.keyId);
    });
  });

  describe("createBucket", () => {
    it("creates a bucket on b2", async () => {
      const b2 = new B2({
        applicationKey: process.env.APPLICATION_KEY,
        keyId: process.env.KEY_ID,
      });

      await b2.authorize();

      const bucketId = await b2.createBucket(`${uuidv4()}-test`);

      expect(typeof bucketId).toBe("string");
    });
  });

  describe("getUploadUrl", () => {
    it("retrieves an upload url", async () => {
      const b2 = new B2({
        applicationKey: process.env.APPLICATION_KEY,
        keyId: process.env.KEY_ID,
      });

      await b2.authorize();

      const bucketId = await b2.createBucket(`${uuidv4()}-test`);

      const { authorizationToken, uploadUrl } = await b2.getUploadUrl(bucketId);
      expect(authorizationToken).toBeTruthy();
      expect(uploadUrl).toBeTruthy();
    });
  });

  describe("listFileNames", () => {
    it("lists file names", async () => {
      const b2 = new B2({
        applicationKey: process.env.APPLICATION_KEY,
        keyId: process.env.KEY_ID,
      });

      await b2.authorize();

      const bucketId = await b2.createBucket(`${uuidv4()}-test`);
      const { authorizationToken, uploadUrl } = await b2.getUploadUrl(bucketId);

      got.post(uploadUrl, {
        headers: {
          Authorization: authorizationToken,
        },
      });
    });
  });
});
