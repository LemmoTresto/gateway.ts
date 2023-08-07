import {IRequest, IResponse} from "@helpers";

export abstract class Origin<Options extends Record<string, unknown> | undefined, RequestType extends IRequest = IRequest, ResponseType extends IResponse = IResponse, Args extends unknown[] = unknown[]> {
    protected readonly options: Options;

    public constructor(options?: Partial<Options>) {
        this.options = (options ?? {}) as Options;
    }

    abstract execute(request: RequestType, ...args: Args): Promise<ResponseType>;
}
