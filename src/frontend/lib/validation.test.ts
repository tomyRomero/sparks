import { describe, expect, it } from "vitest";
import {
  displayNameProblem,
  emailProblem,
  passwordChecks,
  passwordProblem,
  requiredProblem,
  usernameProblem,
  utf8Length,
} from "./validation";

describe("usernameProblem", () => {
  it.each(["nova_reyes", "abc", "A1_", "x".repeat(30)])("accepts %s", (name) => {
    expect(usernameProblem(name)).toBeUndefined();
  });

  it("names the first thing wrong", () => {
    expect(usernameProblem("")).toBe("Choose a username.");
    expect(usernameProblem("nova reyes")).toBe("Use only letters, digits and underscores.");
    expect(usernameProblem("nova.reyes")).toBe("Use only letters, digits and underscores.");
    expect(usernameProblem("ab")).toBe("Use at least 3 characters.");
    expect(usernameProblem("x".repeat(31))).toBe("Use 30 characters or fewer.");
  });

  it("turns down letters outside plain ASCII, as the API's pattern does", () => {
    expect(usernameProblem("zoë")).toBe("Use only letters, digits and underscores.");
  });
});

describe("emailProblem", () => {
  it.each(["nova@sparks.test", "a.b+c@mail.example.co", "  nova@sparks.test  "])("accepts %s", (email) => {
    expect(emailProblem(email)).toBeUndefined();
  });

  it.each(["nova@", "nova", "nova@sparks", "@sparks.test", "no va@sparks.test"])("turns down %s", (email) => {
    expect(emailProblem(email)).toBe("Enter an email like name@example.com.");
  });

  it("asks for one when empty", () => {
    expect(emailProblem("   ")).toBe("Enter your email.");
  });
});

describe("displayNameProblem", () => {
  it("wants something besides spaces, up to 50 characters", () => {
    expect(displayNameProblem("Nova Reyes")).toBeUndefined();
    expect(displayNameProblem("  ")).toBe("Enter your name.");
    expect(displayNameProblem("x".repeat(50))).toBeUndefined();
    expect(displayNameProblem("x".repeat(51))).toBe("Use 50 characters or fewer.");
  });
});

describe("passwords", () => {
  it("counts bytes the way BCrypt does", () => {
    expect(utf8Length("abc")).toBe(3);
    expect(utf8Length("é")).toBe(2);
    expect(utf8Length("🔥")).toBe(4);
  });

  it("checks each rule on its own", () => {
    expect(passwordChecks("short")).toEqual({ longEnough: false, shortEnough: true });
    expect(passwordChecks("lighthouse")).toEqual({ longEnough: true, shortEnough: true });
    expect(passwordChecks("🔥".repeat(19))).toEqual({ longEnough: true, shortEnough: false });
  });

  it("allows exactly 72 bytes and nothing over", () => {
    expect(passwordProblem("x".repeat(72))).toBeUndefined();
    expect(passwordProblem("x".repeat(73))).toMatch(/too long/);
    expect(passwordProblem("é".repeat(37))).toMatch(/too long/);
  });

  it("names the first thing wrong", () => {
    expect(passwordProblem("")).toBe("Enter a password.");
    expect(passwordProblem("1234567")).toBe("Use at least 8 characters.");
  });
});

describe("requiredProblem", () => {
  it("only wants something besides spaces", () => {
    const check = requiredProblem("Enter your password.");
    expect(check(" ")).toBe("Enter your password.");
    expect(check("x")).toBeUndefined();
  });
});
