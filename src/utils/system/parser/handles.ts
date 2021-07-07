import { TokenBase } from '../lexer';
import { TokenMismatch, UnexpectedEOI } from './errors';

export type LexerHandle<T extends TokenBase> = ConsumeHandle<T>;


/* ------------------------------------- */

type InputResult<T extends TokenBase> =
  { token: T } |
  { EOI: true };
export type InputHandle<T extends TokenBase> = {
  get: (position: number) => InputResult<T>;
  // getToken that throws if on EOI?
};

const createInputHandle = <T extends TokenBase>(iterator: Iterator<T, undefined>):
  InputHandle<T> =>
{
  let tokens: T[] = [];

  const get = (position: number) => {
    while (position > tokens.length - 1) {
      const result = iterator.next();
      if (result.done) {
        return { EOI: true } as const;
      }

      tokens = [...tokens, result.value];
    }

    return { token: tokens[position] };
  };

  return { get };
};

/* ------------------------------------- */

// TODO - join with input handle?

export type Mark = { position: number };
export type PositionHandle = {
  current: () => number;
  advance: () => void;

  mark: () => Mark;
  reset: (mark: Mark) => void;
}

const createPositionHandle = (): PositionHandle => {
  let position = 0;

  const current = () => position;
  const advance = () => { position += 1; };

  const mark = () => ({ position });
  const reset = (m: Mark) => { position = m.position; };

  return { current, advance, mark, reset };
};

/* ------------------------------------- */

type Matching<T extends TokenBase, N extends T['type']> = T & { type: N };
interface Consume<T extends TokenBase> {
  <N extends T['type']>(t: N): Matching<T, N>;
  (t?: string): T;
}

export type ConsumeHandle<T extends TokenBase> = {
  mark: PositionHandle['mark'];
  reset: PositionHandle['reset'];

  consume: Consume<T>;
  peek: () => T;
  atEOI: () => boolean; // TODO - rename to peekEOI
  consumeEOI: () => void;
}

export const createConsumeHandle = <T extends TokenBase>(iterator: Iterator<T, undefined>):
  ConsumeHandle<T> =>
{
  const inputHandle = createInputHandle(iterator);
  const positionHandle = createPositionHandle();

  const consume: Consume<T> = <N extends T['type']>(expected?: N) => {
    const result = inputHandle.get(positionHandle.current());

    if (!('token' in result)) {
      throw new UnexpectedEOI();
    }

    const { token } = result;

    if (expected != null && token.type !== expected) {
      throw new TokenMismatch(expected, token);
    }

    positionHandle.advance();
    return token as Matching<T, N>;
  };

  const peek = () => {
    const result = inputHandle.get(positionHandle.current());

    if (!('token' in result)) {
      throw new UnexpectedEOI();
    }

    const { token } = result;

    return token;
  };

  const atEOI = () => {
    const result = inputHandle.get(positionHandle.current());
    return 'EOI' in result
      ? result.EOI
      : false;
  };

  const consumeEOI = () => {
    const result = inputHandle.get(positionHandle.current());
    if (!('EOI' in result)) {
      throw new TokenMismatch('EOI', result.token);
    }
  };

  return {
    mark: positionHandle.mark,
    reset: positionHandle.reset,
    consume,
    peek,
    atEOI,
    consumeEOI
  };
};
