import { IRequest } from 'helpers'

export abstract class Matcher<
  Options extends Record<string, unknown> | undefined,
  RequestType extends IRequest = IRequest,
  Args extends unknown[] = unknown[],
> {
  protected readonly options: Options

  public constructor(options?: Partial<Options>) {
    this.options = (options ?? {}) as Options
  }

  abstract match(request: RequestType, ...args: Args): Promise<boolean>
}
