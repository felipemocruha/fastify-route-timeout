const wrapper = require("fastify-plugin");
const { FastifyInstance, FastifyReply, FastifyRequest } = require("fastify");
const { requestContext } = require("@fastify/request-context");

const TIMEOUT = "FASTIFY_ROUTE_TIMEOUT";
const OVERRIDE_TIMEOUT = "FASTIFY_ROUTE_OVERRIDE_TIMEOUT";

const defaultTimeoutPayload = {
  code: 504,
  message: "Request Timed Out",
};

class FastifyRouteTimeoutError extends Error {
  constructor(err) {
    super("FastifyRouteTimeoutError");
    this.err = err;
    Object.setPrototypeOf(this, FastifyRouteTimeoutError.prototype);
  }
}

const overrideTimeout = (millis) => {
  requestContext.set(OVERRIDE_TIMEOUT, millis);
};

const RequestTimeoutPlugin = wrapper(async (server, options) => {
  await server.register(require("@fastify/request-context"));

  if (!options.timeoutPayload) {
    options.timeoutPayload = defaultTimeoutPayload;
  }

  const close = () => {
    const timeout = requestContext.get(TIMEOUT);
    if (timeout) {
      clearTimeout(timeout);
      requestContext.set(TIMEOUT, null);
    }
  };

  server.addHook("preHandler", async (request, reply) => {
    let timeoutMillis = options.defaultTimeoutMillis;

    if (options.routes) {
      const route = options.routes[request.routeOptions.url];
      const method = request.routeOptions.method;

      if (route && route[method]) {
        timeoutMillis = route[method] ?? timeoutMillis;
      }
    }

    try {
      const dynamicTimeout = requestContext.get(OVERRIDE_TIMEOUT);
      if (dynamicTimeout) {
        timeoutMillis = dynamicTimeout;
      }

      const timeout = setTimeout(() => {
        reply.status(504).send(options.timeoutPayload);
      }, timeoutMillis);

      requestContext.set(TIMEOUT, timeout);
    } catch (err) {
      throw new FastifyRouteTimeoutError(err);
    }
  });

  server.addHook("onSend", async (request, reply, payload) => {
    try {
      close();
      return payload;
    } catch (err) {
      throw new FastifyRouteTimeoutError(err);
    }
  });
});

module.exports = {
  FastifyRouteTimeoutError,
  overrideTimeout,
  RequestTimeoutPlugin,
};
