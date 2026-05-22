import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  type SignInOutput,
} from 'aws-amplify/auth';

export const authService = {
  /**
   * Returns the full SignInOutput so callers can inspect isSignedIn / nextStep.
   * Throws on invalid credentials.
   */
  signIn: (username: string, password: string): Promise<SignInOutput> =>
    signIn({ username, password }),

  signOut: () => signOut(),

  /**
   * In Amplify v6 the username IS the email — no need to pass email twice.
   */
  signUp: (email: string, password: string) =>
    signUp({ username: email, password, options: { userAttributes: { email } } }),

  confirmSignUp: (username: string, code: string) =>
    confirmSignUp({ username, confirmationCode: code }),

  getCurrentUser: () => getCurrentUser(),

  getToken: async (): Promise<string> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? '';
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
