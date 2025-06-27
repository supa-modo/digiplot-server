import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { User } from "../models";

interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

class TwoFactorService {
  /**
   * Generate 2FA secret for a user
   */
  generateSecret(userEmail: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `DigiPlot Property Management (${userEmail})`,
      issuer: "DigiPlot Property Management",
      length: 32,
    });

    return {
      secret: secret.base32!,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  /**
   * Generate QR code image as base64
   */
  async generateQRCode(qrCodeUrl: string): Promise<string> {
    try {
      const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
      return qrCodeImage;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Verify 2FA token
   */
  verifyToken(secret: string, token: string, window: number = 2): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window, // Allow 2 time steps before/after current time
    });
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup codes
      codes.push(Math.random().toString().slice(2, 10));
    }
    return codes;
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(
    userId: string,
    token: string
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.twoFactorSecret) {
        throw new Error("2FA secret not found. Please setup 2FA first.");
      }

      // Verify the token
      if (!this.verifyToken(user.twoFactorSecret, token)) {
        return { success: false };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Enable 2FA
      user.twoFactorEnabled = true;
      await user.save();

      return { success: true, backupCodes };
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      throw error;
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, token: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.twoFactorSecret || !user.twoFactorEnabled) {
        throw new Error("2FA is not enabled for this user");
      }

      // Verify the token
      if (!this.verifyToken(user.twoFactorSecret, token)) {
        return false;
      }

      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      await user.save();

      return true;
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      throw error;
    }
  }

  /**
   * Setup 2FA for a user (generate secret and QR code)
   */
  async setup2FA(userId: string): Promise<TwoFactorSetupResponse> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Generate secret and QR code
      const { secret, qrCodeUrl } = this.generateSecret(user.email);
      const qrCodeImage = await this.generateQRCode(qrCodeUrl);

      // Save secret to user (but don't enable 2FA yet)
      user.twoFactorSecret = secret;
      await user.save();

      // Generate backup codes for later use
      const backupCodes = this.generateBackupCodes();

      return {
        secret,
        qrCodeUrl: qrCodeImage,
        backupCodes,
      };
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      throw error;
    }
  }

  /**
   * Verify 2FA during login
   */
  async verifyLogin2FA(userId: string, token: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return false;
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return true; // 2FA not enabled, skip verification
      }

      return this.verifyToken(user.twoFactorSecret, token);
    } catch (error) {
      console.error("Error verifying 2FA during login:", error);
      return false;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      return user?.twoFactorEnabled === true;
    } catch (error) {
      console.error("Error checking 2FA status:", error);
      return false;
    }
  }

  /**
   * Get 2FA status for a user
   */
  async get2FAStatus(
    userId: string
  ): Promise<{ enabled: boolean; hasSecret: boolean }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return { enabled: false, hasSecret: false };
      }

      return {
        enabled: user.twoFactorEnabled === true,
        hasSecret: !!user.twoFactorSecret,
      };
    } catch (error) {
      console.error("Error getting 2FA status:", error);
      return { enabled: false, hasSecret: false };
    }
  }
}

export default new TwoFactorService();
