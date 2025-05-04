export class AuthUser {
    readonly isEmailVerified: boolean;
  
    constructor(isEmailVerified: boolean) {
      this.isEmailVerified = isEmailVerified;
    }
  
    static fromFirebase(user: import("firebase/auth").User): AuthUser {
      return new AuthUser(user.emailVerified);
    }
  }
  