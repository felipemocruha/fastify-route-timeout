declare module "@fastify/request-context" {
  interface RequestContextData {
    FASTIFY_ROUTE_TIMEOUT: string;
  }

  interface RequestContext {
    get<K extends keyof RequestContextData>(key: K): RequestContextData[K];
  }
}
