import {PolicyResult, RequestPolicy, ResponsePolicy} from "@policy";

export async function applyRequestPolicies<
    RequestType extends IRequest,
    ResponseType extends IResponse,
    Args extends unknown[]
>(
    request: RequestType,
    args: Args,
    policies: RequestPolicy<any, RequestType, ResponseType, Args>[]
): Promise<PolicyResult<RequestType, ResponseType>> {
    let result: PolicyResult<RequestType, ResponseType> = PolicyResult.request(request);
    for (const policy of policies) {
        result = await policy.transform(result.request, ...args);
        if (result.isResponse()) return result;
    }

    return result;
}

export async function applyResponsePolicies<
    ResponseType extends IResponse,
    Args extends unknown[]
>(
    response: ResponseType,
    args: Args,
    policies: ResponsePolicy<any, ResponseType, Args>[]
): Promise<ResponseType> {
    let result: ResponseType = response;
    for (const policy of policies) {
        // @ts-ignore
        result = policy.transform(result, ...args);
    }

    return result;
}

export type GenericTraps = {
    [key: string]: any
}

export type IRequest = Request & GenericTraps

export type IResponse = Response & GenericTraps
