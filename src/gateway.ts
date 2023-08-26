import { Route } from './route'
import { RequestPolicy, ResponsePolicy } from './policy'
import {
  applyRequestPolicies,
  applyResponsePolicies,
  IRequest,
  IResponse,
} from './helpers'
import { Origin } from './origin'

export class Gateway<
  RequestType extends IRequest = IRequest,
  ResponseType extends IResponse = IResponse,
  Args extends unknown[] = unknown[],
> {
  private readonly routes: Route[]
  private readonly defaultOrigin: Origin<any, RequestType, ResponseType, Args>
  private readonly requestPolicies: RequestPolicy<
    any,
    RequestType,
    ResponseType,
    Args
  >[]
  private readonly responsePolicies: ResponsePolicy<any, ResponseType, Args>[]

  constructor(
    routes: Route[],
    defaultOrigin: Origin<any, RequestType, ResponseType, Args>,
    requestPolicies: RequestPolicy<any, RequestType, ResponseType, Args>[],
    responsePolicies: ResponsePolicy<any, ResponseType, Args>[]
  ) {
    this.routes = routes
    this.defaultOrigin = defaultOrigin
    this.requestPolicies = requestPolicies
    this.responsePolicies = responsePolicies
  }

  public static builder<
    RequestType extends IRequest,
    ResponseType extends IResponse,
    Args extends unknown[] = unknown[],
  >(): GatewayBuilder<RequestType, ResponseType, Args> {
    return new GatewayBuilder<RequestType, ResponseType, Args>()
  }

  public async handle(
    originalRequest: RequestType,
    ...args: Args
  ): Promise<ResponseType> {
    let request = originalRequest.clone() as RequestType

    // Apply global request policies.
    const requestPolicyResult = await applyRequestPolicies<
      RequestType,
      ResponseType,
      Args
    >(request, args, this.requestPolicies)
    if (requestPolicyResult.isResponse()) {
      return applyResponsePolicies<ResponseType, Args>(
        requestPolicyResult.response,
        args,
        this.responsePolicies
      )
    }

    request = requestPolicyResult.request

    const route = await this.matchRoute(request, args)

    // Allow route to handle request, if no route matches, use default origin.
    const routeResponse = ((await route?.handle(request, args)) ??
      (await this.defaultOrigin.execute(request, ...args))) as ResponseType

    // Apply global response policies.
    return await applyResponsePolicies<ResponseType, Args>(
      routeResponse,
      args,
      this.responsePolicies
    )
  }

  protected async matchRoute<RequestType extends IRequest>(
    request: RequestType,
    args: Args
  ): Promise<Route | null> {
    return await Promise.any(
      this.routes.map(async (route) => {
        if (await route.matches(request, args)) return route
        return Promise.reject()
      })
    ).catch(() => null)
  }
}

export class GatewayBuilder<
  RequestType extends IRequest,
  ResponseType extends IResponse,
  Args extends unknown[] = unknown[],
> {
  private routes: Route[] = []
  private defaultOrigin!: Origin<any, RequestType, ResponseType, Args>
  private globalRequestPolicies: RequestPolicy<
    any,
    RequestType,
    ResponseType,
    Args
  >[] = []
  private globalResponsePolicies: ResponsePolicy<any, ResponseType, Args>[] = []

  public setRoutes(routes: Route[]): this {
    this.routes = routes
    return this
  }

  public addRoute(route: Route): this {
    this.routes.push(route)
    return this
  }

  public setDefaultOrigin(
    origin: Origin<any, RequestType, ResponseType, Args>
  ): this {
    this.defaultOrigin = origin
    return this
  }

  public setGlobalPolicies(policies: {
    request?: RequestPolicy<any, RequestType, ResponseType, Args>[]
    response?: ResponsePolicy<any, ResponseType, Args>[]
  }): this {
    this.globalRequestPolicies = policies.request ?? []
    this.globalResponsePolicies = policies.response ?? []
    return this
  }

  public build(): Gateway<RequestType, ResponseType, Args> {
    return new Gateway<RequestType, ResponseType, Args>(
      this.routes,
      this.defaultOrigin,
      this.globalRequestPolicies,
      this.globalResponsePolicies
    )
  }
}
