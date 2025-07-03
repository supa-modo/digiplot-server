import axios from "axios";
import crypto from "crypto";
import logger from "../config/logger";

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passKey: string;
  environment: "sandbox" | "production";
}

interface STKPushRequest {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface MpesaAccessTokenResponse {
  access_token: string;
  expires_in: string;
}

interface CallbackResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  phoneNumber?: string;
  resultDesc: string;
}

class MpesaService {
  private config: MpesaConfig;
  private baseUrl: string;
  private tokenUrl: string;
  private stkPushUrl: string;
  private accessToken: string = "";
  private tokenExpiry: number = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
    this.baseUrl =
      config.environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
    this.tokenUrl = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    this.stkPushUrl = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
  }

  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString("base64");

      const response = await axios.get<MpesaAccessTokenResponse>(
        this.tokenUrl,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.data.access_token) {
        throw new Error("No access token received from M-Pesa");
      }

      this.accessToken = response.data.access_token;
      // Token expires in 1 hour, we'll refresh 5 minutes before expiry
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;

      return this.accessToken;
    } catch (error) {
      logger.error("Error getting M-Pesa access token:", error);
      throw new Error("Failed to get M-Pesa access token");
    }
  }

  private generatePassword(timestamp: string): string {
    const password = Buffer.from(
      `${this.config.shortCode}${this.config.passKey}${timestamp}`
    ).toString("base64");
    return password;
  }

  public async initiateSTKPush(
    request: STKPushRequest
  ): Promise<STKPushResponse> {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, -3);
      const password = this.generatePassword(timestamp);

      const data = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(request.amount),
        PartyA: request.phoneNumber.replace("+", ""),
        PartyB: this.config.shortCode,
        PhoneNumber: request.phoneNumber.replace("+", ""),
        CallBackURL: `${process.env.API_BASE_URL}/api/payments/mpesa/callback`,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      };

      const response = await axios.post<STKPushResponse>(
        this.stkPushUrl,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error initiating STK push:", error);
      throw new Error("Failed to initiate M-Pesa payment");
    }
  }

  public processCallback(callbackData: any): CallbackResult {
    try {
      const {
        Body: { stkCallback },
      } = callbackData;
      const { ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      if (ResultCode !== 0) {
        return {
          success: false,
          resultDesc: ResultDesc,
        };
      }

      // Extract payment details from callback metadata
      const getMetadataValue = (name: string) => {
        const item = CallbackMetadata.Item.find((i: any) => i.Name === name);
        return item ? item.Value : null;
      };

      return {
        success: true,
        transactionId: getMetadataValue("MpesaReceiptNumber"),
        amount: getMetadataValue("Amount"),
        phoneNumber: getMetadataValue("PhoneNumber")?.toString(),
        resultDesc: ResultDesc,
      };
    } catch (error) {
      logger.error("Error processing M-Pesa callback:", error);
      return {
        success: false,
        resultDesc: "Error processing callback data",
      };
    }
  }

  public validateCallback(headers: any, body: string): boolean {
    try {
      if (!process.env.MPESA_WEBHOOK_SECRET) {
        logger.warn("M-Pesa webhook secret not configured");
        return true; // Allow in development
      }

      const providedSignature = headers["x-safaricom-signature"];
      if (!providedSignature) {
        return false;
      }

      const computedSignature = crypto
        .createHmac("sha256", process.env.MPESA_WEBHOOK_SECRET)
        .update(body)
        .digest("base64");

      return computedSignature === providedSignature;
    } catch (error) {
      logger.error("Error validating M-Pesa callback:", error);
      return false;
    }
  }
}

export default MpesaService;
