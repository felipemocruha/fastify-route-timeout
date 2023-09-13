declare module "@fastify/request-context" {
  interface RequestContextData {
    FASTIFY_ROUTE_TIMEOUT: string;
    FASTIFY_ROUTE_OVERRIDE_TIMEOUT: number;
  }

  interface RequestContext {
    get<K extends keyof RequestContextData>(key: K): RequestContextData[K];
  }
}
