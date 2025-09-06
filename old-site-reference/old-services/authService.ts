// Gmail authentication service
class AuthService {
  private readonly AUTH_KEY = 'admin_auth_token';
  private readonly ALLOWED_EMAILS = [
    'alexisgriswold@gmail.com', // Replace with actual admin email
    // Add more admin emails as needed
  ];

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.AUTH_KEY);
    if (!token) return false;

    try {
      const authData = JSON.parse(token);
      const now = new Date().getTime();
      
      // Check if token is expired (24 hours)
      if (now > authData.expiresAt) {
        this.logout();
        return false;
      }

      // Check if email is in allowed list
      return this.ALLOWED_EMAILS.includes(authData.email);
    } catch {
      this.logout();
      return false;
    }
  }

  // Get current user email
  getCurrentUser(): string | null {
    const token = localStorage.getItem(this.AUTH_KEY);
    if (!token) return null;

    try {
      const authData = JSON.parse(token);
      return authData.email;
    } catch {
      return null;
    }
  }

  // Login with Gmail
  async loginWithGmail(): Promise<boolean> {
    try {
      // For now, we'll use a simple prompt for email
      // In production, you'd integrate with Google OAuth
      const email = prompt('Please enter your Gmail address:');
      
      if (!email) return false;

      // Validate email format
      if (!this.isValidGmail(email)) {
        alert('Please enter a valid Gmail address.');
        return false;
      }

      // Check if email is allowed
      if (!this.ALLOWED_EMAILS.includes(email)) {
        alert('Access denied. This email is not authorized for admin access.');
        return false;
      }

      // Store authentication data
      const authData = {
        email,
        loginTime: new Date().getTime(),
        expiresAt: new Date().getTime() + (24 * 60 * 60 * 1000), // 24 hours
      };

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
  }

  // Validate Gmail format
  private isValidGmail(email: string): boolean {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  }

  // Check if current path requires authentication
  requiresAuth(path: string): boolean {
    return path.startsWith('/admin');
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 