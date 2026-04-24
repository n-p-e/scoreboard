import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createClient, createContract, endpoint } from "./contract-dsl"

describe("Zod Contract Client", () => {
  const articlesContract = createContract({ prefix: "/articles" }).routes({
    submit: endpoint.post("/submit", {
      reqBody: z.object({ title: z.string() }),
      resBody: z.object({ id: z.number() }),
    }),
    updateSeasonScore: endpoint.patch("/:articleId/score/:season", {
      pathParams: z.object({
        articleId: z.string(),
        season: z.number(),
      }),
      reqBody: z.object({ delta: z.number() }),
      resBody: z.object({ ok: z.boolean() }),
    }),
  })

  const rootContract = createContract({ prefix: "/api" }).routes({
    articles: articlesContract,
    ping: endpoint.get("/ping", {
      resBody: z.object({ pong: z.boolean() }),
    }),
    profile: endpoint.get("/users/:userId", {
      pathParams: z.object({
        userId: z.string(),
      }),
      resBody: z.object({ id: z.string() }),
    }),
  })

  it("should accumulate paths correctly for nested contracts", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 123 }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    const result = await client.articles.submit({ body: { title: "Hello" } })

    // Verify path: baseUrl + rootPrefix + subPrefix + routePath
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.com/api/articles/submit",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toStrictEqual({
      status: 200,
      body: { id: 123 },
    })
  })

  it("should throw an error if the response fails Zod validation", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ wrongKey: "data" }), // Fails resBody schema
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    // Should throw ZodError because 'id' is missing in the response
    await expect(
      client.articles.submit({ body: { title: "Valid" } })
    ).rejects.toThrow()
  })

  it("should correctly pass the JSON body in the request", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 1 }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    const body = { title: "My New Article" }
    await client.articles.submit({ body })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(body),
      })
    )
  })

  it("should work with top-level routes", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ pong: true }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    const result = await client.ping()

    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.com/api/ping",
      expect.any(Object)
    )
    expect(result).toStrictEqual({
      status: 200,
      body: { pong: true },
    })
  })

  it("should interpolate top-level path params", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "alice%20smith" }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    const result = await client.profile({
      params: { userId: "alice smith" },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.com/api/users/alice%20smith",
      expect.any(Object)
    )
    expect(result).toStrictEqual({
      status: 200,
      body: { id: "alice%20smith" },
    })
  })

  it("should interpolate nested path params and send body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    const result = await client.articles.updateSeasonScore({
      params: {
        articleId: "abc",
        season: 2026,
      },
      body: {
        delta: -10,
      },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.com/api/articles/abc/score/2026",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ delta: -10 }),
      })
    )
    expect(result).toStrictEqual({
      status: 200,
      body: { ok: true },
    })
  })

  it("should throw if path params fail validation", async () => {
    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: vi.fn() as any,
    })

    await expect(
      client.articles.updateSeasonScore({
        params: {
          articleId: "abc",
          season: "2026" as any,
        },
        body: {
          delta: -10,
        },
      })
    ).rejects.toThrow()
  })
})
