import wrapper from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
const { requestContext } = require("@fastify/request-context");

const TIMEOUT = "FASTIFY_ROUTE_TIMEOUT";

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

export const RequestTimeoutPlugin = wrapper(
  async (server: FastifyInstance, options: Options) => {
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
      "onRequest",
      async (request: FastifyRequest, reply: FastifyReply) => {
        let timeoutMillis = options.defaultTimeoutMillis;

        if (options.routes) {
          const route = options.routes[request.url];
          const method = request.method as Method;

          if (route && route[method]) {
            timeoutMillis = route[method] ?? timeoutMillis;
          }
        }

        try {
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
      async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
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
