
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        username?: string;
        name?: string;
        scope?: string;
        roles?: string[] | string;
      }
    }
  }
}
