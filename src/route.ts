import { Origin } from './origin'
import { Matcher } from './matcher'
import { RequestPolicy, ResponsePolicy } from './policy'
import {
  applyRequestPolicies,
  applyResponsePolicies,
  IRequest,
  IResponse,
} from './helpers'
// noinspection ES6PreferShortImport
import { PathMatcher } from './matchers/path'

interface RouteOptions {
  matcher: Matcher<any> | string
  origin: Origin<any>
  policies?: {
    request?: RequestPolicy<any, any, any>[]
    response?: ResponsePolicy<any, any>[]
  }
}

export class Route {
  matcher: Matcher<any>
  origin: Origin<any>
  requestPolicies: RequestPolicy<any, any, any>[]
  responsePolicies: ResponsePolicy<any, any>[]

  constructor({ matcher, origin, policies }: RouteOptions) {
    if (matcher instanceof Matcher) {
      this.matcher = matcher
    } else {
      this.matcher = new PathMatcher({ path: matcher })
    }

    this.origin = origin

    this.requestPolicies = policies?.request ?? []
    this.responsePolicies = policies?.response ?? []
  }

  async handle<
    RequestType extends IRequest,
    ResponseType extends IResponse,
    Args extends unknown[],
  >(request: RequestType, args: Args): Promise<ResponseType> {
    const requestPolicyResult = await applyRequestPolicies<
      RequestType,
      ResponseType,
      Args
    >(request, args, this.requestPolicies)
    if (requestPolicyResult.isResponse()) {
      return await applyResponsePolicies<ResponseType, Args>(
        requestPolicyResult.response,
        args,
        this.responsePolicies as ResponsePolicy<any, ResponseType, Args>[]
      )
    }

    const response = (await this.origin.execute(
      requestPolicyResult.request,
      ...args
    )) as ResponseType

    return await applyResponsePolicies<ResponseType, Args>(
      response,
      args,
      this.responsePolicies as ResponsePolicy<any, ResponseType, Args>[]
    )
  }

  async matches<RequestType extends IRequest, Args extends unknown[]>(
    request: RequestType,
    args: Args
  ): Promise<boolean> {
    return await this.matcher.match(request, ...args)
  }
}
