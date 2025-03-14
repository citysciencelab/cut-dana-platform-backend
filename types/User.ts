export interface User {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  scope?: string;
  roles?: string[] | string;
}

export const userIsAdmin = (user: User) => user.roles?.includes("admin");
