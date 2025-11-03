import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  hasRequiredFields,
  isValidFullName,
} from "../lib/validation.js";

// Test validation functions
describe("Auth Validation", () => {
  describe("Email Format Validation", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.com",
        "user123@test.org",
        "a@b.c",
        "test_user@example-domain.com",
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email), `Failed for: ${email}`).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "invalid@",
        "@example.com",
        "invalid@domain",
        "invalid domain@example.com",
        "invalid@.com",
        "@",
        "",
        "test@",
        "test.com",
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email), `Should reject: ${email}`).toBe(false);
      });
    });
  });

  describe("Password Length Validation", () => {
    it("should reject passwords shorter than 6 characters", () => {
      const shortPasswords = ["", "1", "12", "123", "1234", "12345"];

      shortPasswords.forEach((password) => {
        expect(
          isValidPassword(password),
          `Failed for length: ${password.length}`
        ).toBe(false);
      });
    });

    it("should accept passwords with 6 or more characters", () => {
      const validPasswords = [
        "123456",
        "password",
        "verylongpassword123",
        "P@ssw0rd!",
      ];

      validPasswords.forEach((password) => {
        expect(isValidPassword(password), `Failed for: ${password}`).toBe(true);
      });
    });
  });

  describe("Required Fields Validation", () => {
    it("should accept data with all required fields", () => {
      const validDataSets = [
        {
          fullName: "Test User",
          email: "test@example.com",
          password: "password123",
        },
        {
          fullName: "A",
          email: "a@b.c",
          password: "123456",
        },
        {
          fullName: "John Doe Smith",
          email: "john@example.org",
          password: "verylongpassword",
        },
      ];

      validDataSets.forEach((data) => {
        expect(hasRequiredFields(data, ["fullName", "email", "password"])).toBe(
          true
        );
      });
    });

    it("should reject data with missing fields", () => {
      const invalidDataSets = [
        { email: "test@example.com", password: "123456" }, // Missing fullName
        { fullName: "Test User", password: "123456" }, // Missing email
        { fullName: "Test User", email: "test@example.com" }, // Missing password
        { fullName: "Test User" }, // Missing email & password
        {}, // Missing all
        { email: "", fullName: "", password: "" }, // Empty strings
      ];

      invalidDataSets.forEach((data) => {
        expect(hasRequiredFields(data, ["fullName", "email", "password"])).toBe(
          false
        );
      });
    });
  });

  describe("Full Name Validation", () => {
    it("should validate full name length and format", () => {
      const validNames = [
        "John Doe",
        "A",
        "Mary Jane Watson",
        "José García",
        "李明",
      ];

      validNames.forEach((name) => {
        expect(isValidFullName(name)).toBe(true);
      });
    });

    it("should reject invalid full names", () => {
      const invalidNames = ["", "   ", null, undefined];

      invalidNames.forEach((name) => {
        expect(isValidFullName(name)).toBe(false);
      });
    });
  });
});
