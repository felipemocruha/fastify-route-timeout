import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

declare module "@fastify/request-context" {
  interface RequestContextData {
    FASTIFY_ROUTE_TIMEOUT: string;
    FASTIFY_ROUTE_OVERRIDE_TIMEOUT: number;
  }

  interface RequestContext {
    get<K extends keyof RequestContextData>(key: K): RequestContextData[K];
  }
}

declare type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

declare interface Options {
  defaultTimeoutMillis: number;
  routes?: Record<string, Partial<Record<Method, number>>>;
  timeoutPayload?: any;
}

declare class FastifyRouteTimeoutError extends Error {
  err: Error;
  constructor(err: Error);
}

declare const overrideTimeout: (millis: number) => void;

declare const RequestTimeoutPlugin: any;

declare function sleep(ms: number): Promise<void>;

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqual(expected: any): R;
      not: Matchers<R>;
    }
  }
}
