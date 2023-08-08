import { Matcher } from '@matcher'

export class PathMatcher extends Matcher<{ path: string }> {
  async match(request: Request): Promise<boolean> {
    return request.url.startsWith(this.options.path)
  }
}
