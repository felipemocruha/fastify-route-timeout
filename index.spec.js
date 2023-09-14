const { describe, expect, test } = require("@jest/globals");
const Fastify = require("fastify");
const {
  RequestTimeoutPlugin,
  FastifyRouteTimeoutError,
  overrideTimeout,
} = require("./");
const { requestContext } = require("@fastify/request-context");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

describe("RequestTimeoutPlugin", () => {
  let server;

  beforeEach(async () => {
    server = Fastify();
  });

  afterEach(async () => {
    await server.close();
  });

  test("should timeout when function takes longer than defaultTimeout", async () => {
    await server.register(RequestTimeoutPlugin, { defaultTimeoutMillis: 10 });

    server.get("/test", async (req, rep) => {
      await sleep(100);
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toEqual(504);
    expect(response.json()).not.toEqual({ success: true });
  });

  test("should not timeout when function does not take longer than defaultTimeout", async () => {
    await server.register(RequestTimeoutPlugin, { defaultTimeoutMillis: 100 });

    server.get("/test", async (req, rep) => {
      await sleep(10);
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({ success: true });
  });

  test("should timeout when there is a route declaring specific timeout", async () => {
    await server.register(RequestTimeoutPlugin, {
      defaultTimeoutMillis: 10,
      routes: { "/test": { GET: 10 } },
    });

    server.get("/test", async (req, rep) => {
      await sleep(100);
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toEqual(504);
    expect(response.json()).not.toEqual({ success: true });
  });

  test("should timeout when using parametrized route", async () => {
    await server.register(RequestTimeoutPlugin, {
      defaultTimeoutMillis: 1000,
      routes: { "/test/:id/case/:id2": { GET: 10 } },
    });

    server.get("/test/:id/case/:id2", async (req, rep) => {
      await sleep(100);
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test/16b2f40ad8c14e92a8a9db5f47926d6c/case/10",
    });

    expect(response.statusCode).toEqual(504);
    expect(response.json()).not.toEqual({ success: true });
  });

  test("should override route configured value and timeout", async () => {
    await server.register(RequestTimeoutPlugin, {
      defaultTimeoutMillis: 500,
      routes: { "/test/:id/case/:id2": { GET: 4000 } },
    });

    const override = async (req, rep) => {
      overrideTimeout(10);
    };

    server.get(
      "/test/:id/case/:id2",
      { onRequest: override },
      async (req, rep) => {
        await sleep(1000);
        return { success: true };
      },
    );

    const response = await server.inject({
      method: "GET",
      url: "/test/16b2f40ad8c14e92a8a9db5f47926d6c/case/10",
    });

    expect(response.statusCode).toEqual(504);
    expect(response.json()).not.toEqual({ success: true });
  });

  test("should not timeout when there is a route declaring specific timeout", async () => {
    await server.register(RequestTimeoutPlugin, {
      defaultTimeoutMillis: 10,
      routes: { "/test": { GET: 100 } },
    });

    server.get("/test", async (req, rep) => {
      await sleep(10);
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({ success: true });
  });

  test("should timeout when there is not a route matching current route", async () => {
    await server.register(RequestTimeoutPlugin, {
      defaultTimeoutMillis: 10,
      routes: { "/another-test": { GET: 100 } },
    });

    server.get("/test", async (req, rep) => {
      await sleep(100);
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toEqual(504);
    expect(response.json()).not.toEqual({ success: true });
  });

  test("should throw FastifyRouteTimeoutError if it fails", async () => {
    await server.register(RequestTimeoutPlugin, { defaultTimeoutMillis: 10 });

    const setSpy = jest.spyOn(requestContext, "set").mockImplementation(() => {
      throw new Error("exception");
    });

    server.get("/test", async (req, rep) => {
      return { success: true };
    });

    const response = await server.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toEqual(500);
    expect(response.json().message).toEqual("FastifyRouteTimeoutError");
  });
});
