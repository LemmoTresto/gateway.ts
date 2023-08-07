import {Origin} from "@origin";
import {IRequest, IResponse} from "@helpers";


export class UrlOrigin extends Origin<{ url: string; }> {
    async execute(request: IRequest): Promise<IResponse> {
        // @ts-ignore
        const url = new URL(this.options?.url ?? request.url);
        return await fetch(url, request)
    }
}
