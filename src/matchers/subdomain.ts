import { Matcher } from '@matcher'
import { IRequest } from '@helpers'

export class SubdomainMatcher extends Matcher<{ subdomain: string }> {
  async match(request: IRequest): Promise<boolean> {
    const url = new URL(request.url)
    return url.hostname.startsWith(this.options.subdomain)
  }
}
