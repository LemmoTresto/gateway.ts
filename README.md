# Gateway.ts

## A simple gateway for your microservices.

### Installation

```bash
npm install gateway.ts # Optionally save as a dev dependency
```

### Usage

This is a use case for a Cloudflare Worker. The same principles apply to other environments/projects.

You first want to retrieve a `GatewayBuilder` via the `Gateway.builder` method. 
This method takes 3 optional generic types:
`RequestType`, `ResponseType` and `Args`.

These are used to define the types of the request, response and any optional arguments that are passed to the **Matchers**, **Origins** and **Policies**.

In this case these are `Request`, `Response` and `[Env]` respectively.

After this you can define your routes and global policies, like shown below.

```typescript
import { Gateway, Route } from 'gateway.ts';
import { SubdomainMatcher } from "gateway.ts/matchers";
import { UrlOrigin } from "gateway.ts/origins";

const gateway = Gateway.builder<Request, Response, [Env]>()
	.setDefaultOrigin(new UrlOrigin()) // This is the default origin, used when no other origins match. This is optional and will default to UrlOrigin.
	.setRoutes([
		new Route({
			matcher: new SubdomainMatcher({ subdomain: "auth.api" }),
			origin: new BindingOrigin({ binding: "AUTH_API" }),
            // As you can see we don't use policies here as they are optional.
		}),
		new Route({
			matcher: new SubdomainMatcher({ subdomain: "replay.api" }),
			origin: new BindingOrigin({ binding: "REPLAY_PARSER_API" }),
			policies: {
				request: [new AuthenticationPolicy()],
				response: [new CorsPolicy()]
			}
		}),
	])
	.setGlobalPolicies({
		request: [new AuthenticationPolicy()]
	})
	.build();
```

After this you can use the `gateway.handle` method to handle requests. You can hook this up to any environment/framework you want.

This is an example for a Cloudflare Worker:

```typescript
export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        return await gateway.handle(request, env);
    },
};
````

### Concepts

In this section we will go over the concepts used in this library.
All concepts have the RequestType, ResponseType and Args generic types, these are not required.
However, if you use custom types in your Gateway and you have unexpected errors without the generic types filled in your custom classes I suggest adding them.

#### Matchers

Matchers are used to determine which route to use for a given request. They are matched in parallel and the first one to match is used.
You can create your own Matchers by extending the `Matcher` abstract class.

An example is shown here:

```typescript
export class SubdomainMatcher extends Matcher<{ subdomain: string; }> {
    async match(request: IRequest): Promise<boolean> {
        const url = new URL(request.url);
        return url.hostname.startsWith(this.options.subdomain)
    }
}
```

The `Matcher` class has a few generic types that can be used to pass options to the matcher and to define the request, response and args types.


#### Origins

Origins are used to determine where to route a request. These are optional and if none are provided the request will be routed to the original destination.
You can create your own Origins by extending the `Origin` abstract class.

An example is shown here:

```typescript
export class BindingOrigin extends Origin<{ binding: string; }, Request, Response, [Env]> {
    async execute(request: Request, env: Env): Promise<Response> {
        const binding: Fetcher = env[this.options.binding];
        return await binding.fetch(request)
    }
}
```

The `Origin` class has a few generic types that can be used to pass options to the origin and to define the request, response and args types.

#### Policies

Policies are used to modify the request and response. These are optional and if none are provided the request and response will be passed through unmodified.

There are two types of policies: `RequestPolicy` and `ResponsePolicy`.

A RequestPolicy is used to modify the request before it is sent to the origin. It can return either a modified request or a response in case you want to abort the origin call.
To return a request or response you can use the `PolicyResult.request` and `PolicyResult.response` methods respectively.

An example is shown here:

```typescript
export class AuthenticationPolicy extends RequestPolicy<{ test: string; }, Request, Response, [Env]> {
    async transform(request: Request, env: Env): Promise<PolicyResult<Request, Response>> {
        if (!request.headers.has('Authorization')) return PolicyResult.response(new Response('Not Authorized.', { status: 403 }))

        const authHeader = request.headers.get('Authorization');
        
        // Do something with authHeader and your test option.

        return PolicyResult.request(request);
    }
}
```

A ResponsePolicy is used to modify the response before it is sent to the client.

An example is shown here:

```typescript
export class CorsPolicy extends ResponsePolicy<{ origin: string, methods: string[], headers: string[] }, Response> {
    async transform(response: Response): Promise<Response> {
        return PolicyResult.response<Response>(new Response(response.body, {
            ...response,
            headers: {
                ...response.headers,
                'Access-Control-Allow-Origin': this.options.origin,
                'Access-Control-Allow-Methods': this.options.methods.join(', '),
                'Access-Control-Allow-Headers': this.options.headers.join(', ')
            }
        }));
    }
}
```

The `RequestPolicy` and `ResponsePolicy` classes have a few generic types that can be used to pass options to the policy and to define the request, response and args types.

### Contributing

If you want to contribute to this project feel free to open a pull request or issue.

### License

This project is licensed under the GNU LESSER GENERAL PUBLIC license. Read the LICENSE file for more information.
