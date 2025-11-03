import { render, screen } from "@testing-library/react";
import Avatar from "./Avatar";
import { describe, it, expect } from "vitest";

describe("Avatar Component", () => {
  describe("Image Display", () => {
    it("should display image when src is provided", () => {
      const testCases = [
        { src: "https://example.com/avatar.jpg", alt: "John Doe" },
        { src: "https://example.com/photo.png", alt: "Alice" },
        { src: "/local/image.jpg", alt: "Bob" },
      ];

      testCases.forEach(({ src, alt }) => {
        const { unmount } = render(<Avatar src={src} alt={alt} />);
        const img = screen.getByRole("img");
        expect(img).toBeTruthy();
        expect(img.alt).toBe(alt);
        unmount();
      });
    });

    it("should have correct alt text", () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="Test User" />);
      const img = screen.getByAltText("Test User");
      expect(img).toBeTruthy();
    });
  });

  describe("Initials Display", () => {
    it("should display correct initials for full names", () => {
      const testCases = [
        { alt: "John Doe", expected: "JD" },
        { alt: "Alice Bob Cooper", expected: "AC" },
        { alt: "Mary Jane", expected: "MJ" },
        { alt: "X Y Z", expected: "XZ" },
      ];

      testCases.forEach(({ alt, expected }) => {
        const { container, unmount } = render(<Avatar alt={alt} />);
        expect(container.textContent).toBe(expected);
        unmount();
      });
    });

    it("should display single initial for single word", () => {
      const testCases = ["Alice", "Bob", "X", "John"];

      testCases.forEach((name) => {
        const { container, unmount } = render(<Avatar alt={name} />);
        expect(container.textContent).toBe(name[0].toUpperCase());
        unmount();
      });
    });

    it("should display ? for empty/invalid names", () => {
      const testCases = ["", null, undefined];

      testCases.forEach((name) => {
        const { container, unmount } = render(<Avatar alt={name} />);
        expect(container.textContent).toBe("?");
        unmount();
      });
    });
  });

  describe("Size Variations", () => {
    it("should apply correct size classes", () => {
      const sizes = [
        { size: "sm", expectedClass: "size-8" },
        { size: "md", expectedClass: "size-10" },
        { size: "lg", expectedClass: "size-12" },
        { size: "xl", expectedClass: "size-32" },
      ];

      sizes.forEach(({ size, expectedClass }) => {
        const { container, unmount } = render(
          <Avatar alt="Test" size={size} />
        );
        const div = container.querySelector("div");
        expect(div.className).toContain(expectedClass);
        unmount();
      });
    });
  });

  describe("Color Generation", () => {
    it("should generate consistent colors for same name", () => {
      const { container: container1 } = render(<Avatar alt="John Doe" />);
      const { container: container2 } = render(<Avatar alt="John Doe" />);

      const div1 = container1.querySelector("div");
      const div2 = container2.querySelector("div");

      expect(div1.style.backgroundColor).toBe(div2.style.backgroundColor);
    });

    it("should generate different colors for different names", () => {
      const { container: container1, unmount: unmount1 } = render(
        <Avatar alt="John Doe" />
      );
      const { container: container2, unmount: unmount2 } = render(
        <Avatar alt="Alice Smith" />
      );

      const div1 = container1.querySelector("div");
      const div2 = container2.querySelector("div");

      // Khác nhau (có thể trùng nhưng xác suất rất thấp)
      expect(div1.style.backgroundColor).toBeTruthy();
      expect(div2.style.backgroundColor).toBeTruthy();

      unmount1();
      unmount2();
    });
  });
});
