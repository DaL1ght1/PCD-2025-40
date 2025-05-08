import { Injectable } from "@angular/core";
import CryptoJS from "crypto-js";

@Injectable({
  providedIn: "root",
})
export class SecureStorageService {
  private readonly encryptionKey = "YourEncryptionKey"; // Replace with a strong, secret key

  constructor() {}

  setItem(key: string, value: any): void {
    try {
      const valueToStore = typeof value === "object" ? JSON.stringify(value) : String(value);
      const encrypted = CryptoJS.AES.encrypt(valueToStore, this.encryptionKey).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      throw new Error(`Failed to store ${key}`);
    }
  }

  getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        return null;
      }
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        this.removeItem(key);
        return null;
      }
      return decrypted;
    } catch (error) {
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

}
