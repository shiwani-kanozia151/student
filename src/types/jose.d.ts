declare module 'jose' {
  export class SignJWT {
    constructor(payload: Record<string, any>);
    setProtectedHeader(header: { alg: string }): this;
    setIssuedAt(): this;
    setExpirationTime(time: string): this;
    sign(secret: Uint8Array): Promise<string>;
  }
} 