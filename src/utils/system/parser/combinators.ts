import { RDParser } from './common.types';
import { CompositeParseError, ParseError } from './errors';
import { ConsumeHandle } from './handles';


export const attempt = <H extends ConsumeHandle, R>(
  handle: H,
  parser: RDParser<H, R>
): R => {
  const mark = handle.mark();
  try {
    return parser(handle);
  } catch (e: unknown) {
    handle.reset(mark);
    throw e;
  }
};


export const choice = <H extends ConsumeHandle, Ps extends RDParser<H, unknown>[]>(
  handle: H,
  parsers: Ps
): ReturnType<Ps[number]> => {
  let errors: ParseError[] = [];

  for (const parser of parsers) {
    try {
      return attempt(handle, parser) as ReturnType<Ps[number]>;
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


export const repeated = <H extends ConsumeHandle, R>(handle: H, parser: RDParser<H, R>): [R[], Error]  => {
  let error: ParseError | undefined = undefined;

  try {
    const node = attempt(handle, parser);
    const [following, e] = repeated(handle, parser);
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


export const optional = <H extends ConsumeHandle, R>(handle: H, parser: RDParser<H, R>): [R, undefined] | [undefined, Error] => {
  let error: Error | undefined = undefined;

  try {
    return [attempt(handle, parser), undefined];
  } catch (e) {
    if (e instanceof ParseError) {
      error = e;
    } else {
      throw e;
    }
  }

  return [undefined, error];
};

