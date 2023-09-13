# fastify-route-timeout

A Fastify plugin to automatically set timeouts for routes. If a route takes longer than its specified timeout, a custom response will be sent.

## Features

- Set a default timeout for all routes.
- Specify custom timeouts for specific routes and methods.
- Customize the timeout response payload.

## Installation

```bash
npm install @felipemocruha/fastify-route-timeout
```

## Usage

### Basic Usage

```javascript
import fastify from "fastify";
import { RequestTimeoutPlugin } from "your-package-name";

const server = fastify();

server.register(RequestTimeoutPlugin, {
  defaultTimeoutMillis: 5000,
});

server.listen(3000);
```

With the above setup, all routes will have a default timeout of 5 seconds.

### Custom Route Timeouts

You can specify custom timeouts for specific routes and methods:

```javascript
server.register(RequestTimeoutPlugin, {
  defaultTimeoutMillis: 5000,
  routes: {
    "/specific-route": {
      GET: 10000, // 10 seconds for this specific route and method
      POST: 2000, // 2 seconds for this specific route and method
    },
  },
});
```

### Custom Timeout Response

You can **optionally** customize the response payload sent when a timeout occurs:

```javascript
server.register(RequestTimeoutPlugin, {
  defaultTimeoutMillis: 5000,
  timeoutPayload: {
    errorType: "My custom error",
    messages: [{ message: "Custom timeout message" }],
  },
});
```

### Error Handling

The plugin wraps its internal errors using `FastifyRouteTimeoutError`. You should catch and handle these errors in your application the way you see fit:

```javascript
server.setErrorHandler((error, request, reply) => {
  if (error instanceof FastifyRouteTimeoutError) {
    console.error(
      "fastify-route-timeout failed unexpectedly: ",
      error.err.message,
    );
    reply.status(500).send({ error: "Internal Server Error" });
  } else {
    reply.send(error);
  }
});
```
