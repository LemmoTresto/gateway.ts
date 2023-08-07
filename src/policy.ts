import {IRequest, IResponse} from "@helpers";

export abstract class RequestPolicy<Options extends Record<string, unknown> | undefined, RequestType extends IRequest = IRequest, ResponseType extends IResponse = IResponse, Args extends unknown[] = unknown[]> {
    protected readonly options: Options;

    public constructor(options?: Partial<Options>) {
        this.options = (options ?? {}) as Options;
    }

    abstract transform(request: RequestType, ...args: Args): Promise<PolicyResult<RequestType, ResponseType>>;
}

export abstract class ResponsePolicy<Options extends Record<string, unknown> | undefined, ResponseType extends IResponse = IResponse, Args extends unknown[] = unknown[]> {
    protected readonly options: Options;

    public constructor(options?: Partial<Options>) {
        this.options = (options ?? {}) as Options;
    }

    abstract transform(response: ResponseType, ...args: Args): Promise<ResponseType>;
}

enum PolicyResultType {
    Request,
    Response,
}

export class PolicyResult<RequestType extends IRequest = IRequest, ResponseType extends IResponse = IResponse> {
    private constructor(private readonly result: RequestType | ResponseType, private readonly type: PolicyResultType) {
    }

    get request(): RequestType {
        return this.result as RequestType;
    }

    get response(): ResponseType {
        return this.result as ResponseType;
    }

    static request<RequestType extends IRequest = IRequest>(result: RequestType): PolicyResult<RequestType, any> {
        return new PolicyResult(result, PolicyResultType.Request);
    }

    static response<ResponseType extends IResponse = IResponse>(result: ResponseType): PolicyResult<any, ResponseType> {
        return new PolicyResult(result, PolicyResultType.Response);
    }

    public isRequest(): boolean {
        return this.type === PolicyResultType.Request;
    }

    public isResponse(): boolean {
        return this.type === PolicyResultType.Response;
    }
}
