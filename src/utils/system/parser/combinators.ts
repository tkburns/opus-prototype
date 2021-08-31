import { RDParser } from './common.types';
import { CompositeParseError, ParseError } from './errors';
import { ConsumeHandle } from './handles';


export const attempt = <H extends ConsumeHandle, C, R>(
  handle: H,
  context: C,
  parser: RDParser<H, C, R>
): R => {
  const mark = handle.mark();
  try {
    return parser(handle, context);
  } catch (e: unknown) {
    handle.reset(mark);
    throw e;
  }
};


export const choice = <H extends ConsumeHandle, C, Ps extends RDParser<H, C, unknown>[]>(
  handle: H,
  context: C,
  parsers: Ps
): ReturnType<Ps[number]> => {
  let errors: ParseError[] = [];

  for (const parser of parsers) {
    try {
      return attempt(handle, context, parser) as ReturnType<Ps[number]>;
    } catch (e: unknown) {
      if (e instanceof ParseError) {
        errors = errors.concat(e);
      } else {
        throw e;
      }
    }
  }

  throw new CompositeParseError(errors);
};


export const repeated = <H extends ConsumeHandle, C, R>(handle: H, context: C, parser: RDParser<H, C, R>): [R[], Error]  => {
  let error: ParseError | undefined = undefined;

  try {
    const node = attempt(handle, context, parser);
    const [following, e] = repeated(handle, context, parser);
    return [[node, ...following], e];
  } catch (e) {
    if (e instanceof ParseError) {
      error = e;
    } else {
      throw e;
    }
  }

  return [[], error];
};


export const optional = <H extends ConsumeHandle, C, R>(handle: H, context: C, parser: RDParser<H, C, R>): [R, undefined] | [undefined, Error] => {
  let error: Error | undefined = undefined;

  try {
    return [attempt(handle, context, parser), undefined];
  } catch (e) {
    if (e instanceof ParseError) {
      error = e;
    } else {
      throw e;
    }
  }

  return [undefined, error];
};

