import { Injectable } from "@angular/core"
import  { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from "@angular/platform-browser"

@Injectable({
  providedIn: "root",
})
export class SecurityUtilsService {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html)
  }

  /**
   * Sanitize URLs to prevent XSS attacks
   */
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url)
  }

  /**
   * Sanitize resource URLs (like iframe sources)
   */
  sanitizeResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  /**
   * Encode HTML entities to prevent XSS
   */
  encodeHtml(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  /**
   * Validate if a string is a safe URL
   */
  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ["http:", "https:"].includes(parsedUrl.protocol)
    } catch (e) {
      return false
    }
  }

  /**
   * Generate a random secure token
   */
  generateSecureToken(length = 32): string {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }
}
