import got, { Got } from "got";
import {
  DuplicateBucketNameException,
  UnauthorizedException,
  UsageCapExceededException,
} from "./errors";

interface AuthorizationComponents {
  keyId: string;
  applicationKey: string;
}

interface AuthorizationResponse {
  accountId: string;
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  s3ApiUrl: string;
  recommendedPartSize: number;
  absoluteMinimumPartSize: number;
  allowed: {
    capabilities: [string];
    bucketId?: string | null;
    bucketName?: string | null;
    namePrefix?: string | null;
  };
}

interface Bucket {}

type Capability =
  | "listKeys"
  | "writeKeys"
  | "deleteKeys"
  | "listBuckets"
  | "writeBuckets"
  | "deleteBuckets"
  | "listFiles"
  | "readFiles"
  | "shareFiles"
  | "writeFiles"
  | "deleteFiles";

interface CreateKeyRequest {
  keyName: string;
  capabilities: [Capability];
  validDurationInSeconds?: number;
  bucketId?: string;
  namePrefix?: string;
}

export class B2 {
  private authorization: string;
  private accountId: string;
  private authorizationToken: string;
  private apiUrl: string;
  private downloadUrl: string;
  private s3ApiUrl: string;
  private recommendedPartSize: number;
  private absoluteMinimumPartSize: number;
  private allowed: {
    capabilities: [string];
    bucketId?: string | null;
    bucketName?: string | null;
    namePrefix?: string | null;
  };
  instance: Got;

  constructor(authorization: AuthorizationComponents) {
    const { keyId, applicationKey } = authorization;
    const encoded = Buffer.from(`${keyId}:${applicationKey}`).toString(
      "base64"
    );

    this.authorization = `Basic ${encoded}`;
  }

  async authorize(): Promise<void> {
    try {
      const response: AuthorizationResponse = await got(
        `https://api.backblazeb2.com/b2api/v2/b2_authorize_account`,
        {
          headers: {
            Authorization: this.authorization,
          },
        }
      ).json();

      const {
        accountId,
        authorizationToken,
        apiUrl,
        downloadUrl,
        s3ApiUrl,
        allowed,
        absoluteMinimumPartSize,
        recommendedPartSize,
      } = response;

      this.accountId = accountId;
      this.authorizationToken = authorizationToken;
      this.apiUrl = apiUrl;
      this.downloadUrl = downloadUrl;
      this.s3ApiUrl = s3ApiUrl;
      this.allowed = allowed;
      this.absoluteMinimumPartSize = absoluteMinimumPartSize;
      this.recommendedPartSize = recommendedPartSize;

      this.instance = got.extend({
        prefixUrl: `${this.apiUrl}/b2api/v2`,
        headers: {
          Authorization: this.authorizationToken,
        },
      });
    } catch (err) {
      const statusCode = err.response?.statusCode;
      switch (statusCode) {
        case 401:
          throw UnauthorizedException;
        case 403:
          throw UsageCapExceededException;
        default:
          throw err;
      }
    }
  }

  async createKey(
    request: CreateKeyRequest
  ): Promise<{ applicationKey: string; keyId: string }> {
    try {
      const {
        keyName,
        bucketId,
        capabilities,
        namePrefix,
        validDurationInSeconds,
      } = request;

      const body: any = {
        accountId: this.accountId,
        keyName,
        capabilities,
      };

      if (bucketId) {
        body.bucketId = bucketId;
      }

      if (validDurationInSeconds) {
        body.validDurationInSeconds = validDurationInSeconds;
      }

      if (namePrefix) {
        body.namePrefix = namePrefix;
      }

      const response: any = await this.instance
        .post("b2_create_key", {
          json: body,
        })
        .json();

      const { applicationKey, applicationKeyId } = response;

      return {
        keyId: applicationKeyId,
        applicationKey,
      };
    } catch (err) {
      const statusCode = err.response?.statusCode;
      switch (statusCode) {
        case 401:
          throw UnauthorizedException;
        default:
          throw err;
      }
    }
  }

  async deleteKey(keyId: string): Promise<void> {
    try {
      const response: any = await this.instance
        .post("b2_delete_key", {
          json: {
            applicationKeyId: keyId,
          },
        })
        .json();
    } catch (err) {
      const statusCode = err.response?.statusCode;
      switch (statusCode) {
        case 401:
          throw UnauthorizedException;
        default:
          throw err;
      }
    }
  }

  async createBucket(bucketName: string): Promise<string> {
    const corsRules = [
      {
        allowedHeaders: ["*"],
        allowedOperations: [
          "b2_download_file_by_id",
          "b2_upload_file",
          "b2_download_file_by_name",
        ],
        allowedOrigins: ["*"],
        corsRuleName: "uploadFromBrowser",
        exposeHeaders: ["authorization", "x-bz-file-name", "x-bz-content-sha1"],
        maxAgeSeconds: 3600,
      },
    ];

    const body = {
      bucketName,
      corsRules,
      bucketType: "allPrivate",
      accountId: this.accountId,
    };

    try {
      const response: any = await this.instance
        .post("b2_create_bucket", {
          json: body,
        })
        .json();

      const { bucketId } = response;

      return bucketId;
    } catch (err) {
      const statusCode = err.response?.statusCode;
      switch (statusCode) {
        case 400:
          throw DuplicateBucketNameException;
        case 401:
          throw UnauthorizedException;
        default:
          throw err;
      }
    }
  }

  async getUploadUrl(
    bucketId: string
  ): Promise<{ uploadUrl: string; authorizationToken: string }> {
    try {
      const response: any = await this.instance
        .post("b2_get_upload_url", {
          json: { bucketId },
        })
        .json();

      const { uploadUrl, authorizationToken } = response;
      return { uploadUrl, authorizationToken };
    } catch (err) {
      const statusCode = err.response?.statusCode;
      switch (statusCode) {
        case 401:
          throw UnauthorizedException;
        default:
          throw err;
      }
    }
  }

  async listFileNames({
    bucketId,
    prefix,
    delimiter = "/",
  }: {
    bucketId: string;
    prefix: string;
    delimiter: string;
  }): Promise<[object]> {
    try {
      const response: any = await this.instance
        .post("b2_list_file_names", {
          json: { bucketId, prefix, delimiter },
        })
        .json();

      const { files } = response;
      return files;
    } catch (err) {
      const statusCode = err.response?.statusCode;
      switch (statusCode) {
        case 401:
          throw UnauthorizedException;
        default:
          throw err;
      }
    }
  }
}
