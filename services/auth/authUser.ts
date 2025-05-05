export class AuthUser {
    readonly isEmailVerified: boolean;
    readonly uid : string | null;
  
    constructor(isEmailVerified: boolean, uid: string | null) {
      this.isEmailVerified = isEmailVerified;
      this.uid = uid;
    }
  
    static fromFirebase(user: import("firebase/auth").User): AuthUser {
      return new AuthUser(user.emailVerified, user.uid);
    }
  }
  