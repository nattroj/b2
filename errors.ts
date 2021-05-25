export class UnauthorizedException extends Error {
  constructor() {
    super(
      "The applicationKeyId and/or the applicationKey are wrong or the auth token is expired."
    );
    this.name = "UnauthorizedException";
  }
}

export class UsageCapExceededException extends Error {
  constructor() {
    super("Usage cap exceeded.");
    this.name = "UsageCapExceededException";
  }
}

export class DuplicateBucketNameException extends Error {
  constructor() {
    super("Bucket name is already in use.");
    this.name = "DuplicateBucketNameException ";
  }
}
