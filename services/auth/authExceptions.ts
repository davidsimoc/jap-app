export class UserNotLoggedInAuthException extends Error {
    constructor(message = "User is not logged in") {
      super(message);
      this.name = "UserNotLoggedInAuthException";
    }
  }
  
  export class EmailAlreadyInUseAuthException extends Error {
    constructor(message = "Email is already in use") {
      super(message);
      this.name = "EmailAlreadyInUseAuthException";
    }
  }
  
  export class WeakPasswordAuthException extends Error {
    constructor(message = "Weak password") {
      super(message);
      this.name = "WeakPasswordAuthException";
    }
  }
  
  export class InvalidEmailAuthException extends Error {
    constructor(message = "Invalid email") {
      super(message);
      this.name = "InvalidEmailAuthException";
    }
  }
  
  export class UserNotFoundAuthException extends Error {
    constructor(message = "User not found") {
      super(message);
      this.name = "UserNotFoundAuthException";
    }
  }
  
  export class WrongPasswordAuthException extends Error {
    constructor(message = "Wrong password") {
      super(message);
      this.name = "WrongPasswordAuthException";
    }
  }
  
  export class GenericAuthException extends Error {
    constructor(message = "Authentication error") {
      super(message);
      this.name = "GenericAuthException";
    }
  }
  