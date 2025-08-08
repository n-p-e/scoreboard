import { describe, expect, it } from "vitest"
import { fragment, url } from "./url"

describe("url template function", () => {
  describe("basic functionality", () => {
    it("should handle basic URL with single parameter", () => {
      const userId = "john123"
      const result = url`/users/${userId}/profile`
      expect(result).toBe("/users/john123/profile")
    })

    it("should handle multiple parameters", () => {
      const userId = "john123"
      const profileType = "public profile"
      const result = url`/users/${userId}/profiles/${profileType}`
      expect(result).toBe("/users/john123/profiles/public%20profile")
    })

    it("should handle template with no parameters", () => {
      const result = url`/api/health`
      expect(result).toBe("/api/health")
    })
  })

  describe("basic fragment functionality", () => {
    it("should create a fragment object with correct properties", () => {
      const frag = fragment("https://example.com")
      expect(frag).toEqual({
        _isRawFragment: true,
        value: "https://example.com",
      })
    })

    it("should preserve raw URLs without encoding", () => {
      const baseUrl = "https://api.example.com"
      const userId = "user@domain.com"
      const result = url`${fragment(baseUrl)}/users/${userId}`
      expect(result).toBe("https://api.example.com/users/user%40domain.com")
    })

    it("should handle fragments with special characters", () => {
      const queryFragment = fragment("search?q=test&type=user")
      const userId = "john doe"
      const result = url`/api/${queryFragment}&user=${userId}`
      expect(result).toBe("/api/search?q=test&type=user&user=john%20doe")
    })
  })
})
