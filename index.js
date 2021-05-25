"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.B2 = void 0;

var _got = _interopRequireDefault(require("got"));

var _errors = require("./errors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class B2 {
  constructor(authorization) {
    const {
      keyId,
      applicationKey
    } = authorization;
    const encoded = Buffer.from(`${keyId}:${applicationKey}`).toString("base64");
    this.authorization = `Basic ${encoded}`;
  }

  async authorize() {
    try {
      const response = await (0, _got.default)(`https://api.backblazeb2.com/b2api/v2/b2_authorize_account`, {
        headers: {
          Authorization: this.authorization
        }
      }).json();
      const {
        accountId,
        authorizationToken,
        apiUrl,
        downloadUrl,
        s3ApiUrl,
        allowed,
        absoluteMinimumPartSize,
        recommendedPartSize
      } = response;
      this.accountId = accountId;
      this.authorizationToken = authorizationToken;
      this.apiUrl = apiUrl;
      this.downloadUrl = downloadUrl;
      this.s3ApiUrl = s3ApiUrl;
      this.allowed = allowed;
      this.absoluteMinimumPartSize = absoluteMinimumPartSize;
      this.recommendedPartSize = recommendedPartSize;
      this.instance = _got.default.extend({
        prefixUrl: `${this.apiUrl}/b2api/v2`,
        headers: {
          Authorization: this.authorizationToken
        }
      });
    } catch (err) {
      var _err$response;

      const statusCode = (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.statusCode;

      switch (statusCode) {
        case 401:
          throw _errors.UnauthorizedException;

        case 403:
          throw _errors.UsageCapExceededException;

        default:
          throw err;
      }
    }
  }

  async createKey(request) {
    try {
      const {
        keyName,
        bucketId,
        capabilities,
        namePrefix,
        validDurationInSeconds
      } = request;
      const body = {
        accountId: this.accountId,
        keyName,
        capabilities
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

      const response = await this.instance.post("b2_create_key", {
        json: body
      }).json();
      const {
        applicationKey,
        applicationKeyId
      } = response;
      return {
        keyId: applicationKeyId,
        applicationKey
      };
    } catch (err) {
      var _err$response2;

      const statusCode = (_err$response2 = err.response) === null || _err$response2 === void 0 ? void 0 : _err$response2.statusCode;

      switch (statusCode) {
        case 401:
          throw _errors.UnauthorizedException;

        default:
          throw err;
      }
    }
  }

  async deleteKey(keyId) {
    try {
      const response = await this.instance.post("b2_delete_key", {
        json: {
          applicationKeyId: keyId
        }
      }).json();
    } catch (err) {
      var _err$response3;

      const statusCode = (_err$response3 = err.response) === null || _err$response3 === void 0 ? void 0 : _err$response3.statusCode;

      switch (statusCode) {
        case 401:
          throw _errors.UnauthorizedException;

        default:
          throw err;
      }
    }
  }

  async createBucket(bucketName) {
    const corsRules = [{
      allowedHeaders: ["*"],
      allowedOperations: ["b2_download_file_by_id", "b2_upload_file", "b2_download_file_by_name"],
      allowedOrigins: ["*"],
      corsRuleName: "uploadFromBrowser",
      exposeHeaders: ["authorization", "x-bz-file-name", "x-bz-content-sha1"],
      maxAgeSeconds: 3600
    }];
    const body = {
      bucketName,
      corsRules,
      bucketType: "allPrivate",
      accountId: this.accountId
    };

    try {
      const response = await this.instance.post("b2_create_bucket", {
        json: body
      }).json();
      const {
        bucketId
      } = response;
      return bucketId;
    } catch (err) {
      var _err$response4;

      const statusCode = (_err$response4 = err.response) === null || _err$response4 === void 0 ? void 0 : _err$response4.statusCode;

      switch (statusCode) {
        case 400:
          throw _errors.DuplicateBucketNameException;

        case 401:
          throw _errors.UnauthorizedException;

        default:
          throw err;
      }
    }
  }

  async getUploadUrl(bucketId) {
    try {
      const response = await this.instance.post("b2_get_upload_url", {
        json: {
          bucketId
        }
      }).json();
      const {
        uploadUrl,
        authorizationToken
      } = response;
      return {
        uploadUrl,
        authorizationToken
      };
    } catch (err) {
      var _err$response5;

      const statusCode = (_err$response5 = err.response) === null || _err$response5 === void 0 ? void 0 : _err$response5.statusCode;

      switch (statusCode) {
        case 401:
          throw _errors.UnauthorizedException;

        default:
          throw err;
      }
    }
  }

  async listFileNames({
    bucketId,
    prefix,
    delimiter = "/"
  }) {
    try {
      const response = await this.instance.post("b2_list_file_names", {
        json: {
          bucketId,
          prefix,
          delimiter
        }
      }).json();
      const {
        files
      } = response;
      return files;
    } catch (err) {
      var _err$response6;

      const statusCode = (_err$response6 = err.response) === null || _err$response6 === void 0 ? void 0 : _err$response6.statusCode;

      switch (statusCode) {
        case 401:
          throw _errors.UnauthorizedException;

        default:
          throw err;
      }
    }
  }

}

exports.B2 = B2;
