import { signIn, signOut, signUp, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export const authService = {
  signIn: (username: string, password: string) =>
    signIn({ username, password }),

  signOut: () => signOut(),

  signUp: (username: string, password: string, email: string) =>
    signUp({ username, password, options: { userAttributes: { email } } }),

  getCurrentUser: () => getCurrentUser(),

  getToken: async (): Promise<string> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || '';
    } catch {
      return '';
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },
};
