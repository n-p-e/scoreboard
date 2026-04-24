import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createClient, createContract, endpoint } from "./contract-dsl"

describe("Zod Contract Client", () => {
  const articlesContract = createContract({ prefix: "/articles" }).routes({
    submit: endpoint.post("/submit", {
      reqBody: z.object({ title: z.string() }),
      resBody: z.object({ id: z.number() }),
    }),
  })

  const rootContract = createContract({ prefix: "/api" }).routes({
    articles: articlesContract,
    ping: endpoint.get("/ping", {
      resBody: z.object({ pong: z.boolean() }),
    }),
  })

  it("should accumulate paths correctly for nested contracts", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 123 }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    await client.articles.submit({ body: { title: "Hello" } })

    // Verify path: baseUrl + rootPrefix + subPrefix + routePath
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.com/api/articles/submit",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("should throw an error if the response fails Zod validation", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
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
      json: () => Promise.resolve({ pong: true }),
    })

    const client = createClient({
      contract: rootContract,
      baseUrl: "https://test.com",
      fetcher: mockFetch as any,
    })

    const result = await client.ping({ body: undefined })

    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.com/api/ping",
      expect.any(Object)
    )
    expect(result.pong).toBe(true)
  })
})
