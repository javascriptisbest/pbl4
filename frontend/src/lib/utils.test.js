import { describe, it, expect } from "vitest";

// Test helper functions
describe("Utility Functions", () => {
  describe("formatMessageTime", () => {
    it("should format time correctly", () => {
      const date = new Date("2024-01-15T14:30:00");
      const formatted = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      expect(formatted).toMatch(/14:30/);
    });
  });

  describe("getInitials", () => {
    const getInitials = (name) => {
      if (!name || !name.trim()) return "?";
      const parts = name
        .trim()
        .split(" ")
        .filter((p) => p);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.trim()[0].toUpperCase();
    };

    it("should extract initials from full names", () => {
      const testCases = [
        { input: "John Doe", expected: "JD" },
        { input: "Alice Bob Cooper", expected: "AC" },
        { input: "Mary Jane Watson Parker", expected: "MP" },
        { input: "Jean-Claude Van Damme", expected: "JD" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getInitials(input)).toBe(expected);
      });
    });

    it("should handle single names", () => {
      const singleNames = [
        { input: "Alice", expected: "A" },
        { input: "Bob", expected: "B" },
        { input: "X", expected: "X" },
        { input: "ñ", expected: "Ñ" },
      ];

      singleNames.forEach(({ input, expected }) => {
        expect(getInitials(input)).toBe(expected);
      });
    });

    it("should handle edge cases", () => {
      const edgeCases = [
        { input: "", expected: "?" },
        { input: null, expected: "?" },
        { input: undefined, expected: "?" },
        { input: "  John   Doe  ", expected: "JD" },
        { input: "   ", expected: "?" },
      ];

      edgeCases.forEach(({ input, expected }) => {
        expect(getInitials(input)).toBe(expected);
      });
    });
  });

  describe("isValidEmail", () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it("should validate correct email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.com",
        "user_name@test-domain.org",
        "firstname.lastname@company.co.jp",
        "email123@subdomain.example.com",
        "a@b.co",
        "test.email.with.dots@example.com",
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email), `Should accept: ${email}`).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid",
        "invalid@",
        "@example.com",
        "invalid@domain",
        "invalid domain@example.com",
        "invalid@.com",
        "@",
        "",
        "test@",
        "test.com",
        "test @example.com",
        "test@ example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email), `Should reject: ${email}`).toBe(false);
      });
    });
  });

  describe("truncateText", () => {
    const truncateText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };

    it("should truncate long text", () => {
      const testCases = [
        {
          text: "This is a very long message that should be truncated",
          maxLength: 20,
          expected: "This is a very long ...",
        },
        {
          text: "Short message but will be cut",
          maxLength: 10,
          expected: "Short mess...",
        },
        {
          text: "Lorem ipsum dolor sit amet",
          maxLength: 15,
          expected: "Lorem ipsum dol...",
        },
      ];

      testCases.forEach(({ text, maxLength, expected }) => {
        expect(truncateText(text, maxLength)).toBe(expected);
      });
    });

    it("should not truncate short text", () => {
      const testCases = [
        { text: "Short", maxLength: 20 },
        { text: "Hi", maxLength: 10 },
        { text: "Exactly 10", maxLength: 10 },
        { text: "", maxLength: 5 },
        { text: "abc", maxLength: 100 },
      ];

      testCases.forEach(({ text, maxLength }) => {
        expect(truncateText(text, maxLength)).toBe(text);
      });
    });

    it("should handle null/undefined/empty", () => {
      expect(truncateText(null, 20)).toBe(null);
      expect(truncateText(undefined, 20)).toBe(undefined);
      expect(truncateText("", 20)).toBe("");
    });
  });
});
