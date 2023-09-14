const wrapper = require("fastify-plugin");
const { FastifyInstance, FastifyReply, FastifyRequest } = require("fastify");
const { requestContext } = require("@fastify/request-context");

const TIMEOUT = "FASTIFY_ROUTE_TIMEOUT";
const OVERRIDE_TIMEOUT = "FASTIFY_ROUTE_OVERRIDE_TIMEOUT";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

interface Options {
  defaultTimeoutMillis: number;
  routes?: Record<string, Partial<Record<Method, number>>>;
  timeoutPayload?: any;
}

const defaultTimeoutPayload = {
  code: 504,
  message: "Request Timed Out",
};

export class FastifyRouteTimeoutError extends Error {
  err: Error;

  constructor(err: Error) {
    super("FastifyRouteTimeoutError");
    this.err = err;
    Object.setPrototypeOf(this, FastifyRouteTimeoutError.prototype);
  }
}

export const overrideTimeout = (millis: number) => {
  requestContext.set(OVERRIDE_TIMEOUT, millis);
};

export const RequestTimeoutPlugin = wrapper(
  async (server: typeof FastifyInstance, options: Options) => {
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

    server.addHook(
      "preHandler",
      async (request: typeof FastifyRequest, reply: typeof FastifyReply) => {
        let timeoutMillis = options.defaultTimeoutMillis;

        if (options.routes) {
          const route = options.routes[request.routeOptions.url];
          const method = request.routeOptions.method as Method;

          if (route && route[method]) {
            timeoutMillis = route[method] ?? timeoutMillis;
          }
        }

        try {
          const dynamicTimeout = requestContext.get(OVERRIDE_TIMEOUT);
          if (dynamicTimeout) {
            console.log(dynamicTimeout);
            timeoutMillis = dynamicTimeout;
          }

          const timeout = setTimeout(() => {
            reply.status(504).send(options.timeoutPayload);
          }, timeoutMillis);

          requestContext.set(TIMEOUT, timeout);
        } catch (err) {
          throw new FastifyRouteTimeoutError(err as Error);
        }
      },
    );

    server.addHook(
      "onSend",
      async (
        request: typeof FastifyRequest,
        reply: typeof FastifyReply,
        payload: any,
      ) => {
        try {
          close();
          return payload;
        } catch (err) {
          throw new FastifyRouteTimeoutError(err as Error);
        }
      },
    );
  },
);
