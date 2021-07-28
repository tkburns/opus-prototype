import { TokenBase } from '../lexer';
import { TokenMismatch, UnexpectedEOI } from './errors';

/* ------------------------------------- */

type InputResult<T extends TokenBase> =
  { token: T } |
  { EOI: true };

export interface IteratorInput<T extends TokenBase = TokenBase> {
  get: (position: number) => InputResult<T>;
}

const IteratorInput = {
  create<T extends TokenBase>(iterator: Iterator<T, undefined>): IteratorInput<T> {
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
  }
};

/* ------------------------------------- */

export type Mark = { position: number };
export interface Position {
  current: () => number;
  advance: () => void;

  mark: () => Mark;
  reset: (mark: Mark) => void;
}

const Position = {
  create(): Position {
    let position = 0;

    const current = () => position;
    const advance = () => { position += 1; };

    const mark = () => ({ position });
    const reset = (m: Mark) => { position = m.position; };

    return { current, advance, mark, reset };
  }
};

/* ------------------------------------- */

type Matching<T extends TokenBase, N extends T['type']> = T & { type: N };

export interface ConsumeHandle<T extends TokenBase = TokenBase> {
  mark: Position['mark'];
  reset: Position['reset'];

  consume<N extends T['type']>(t: N): Matching<T, N>;
  consume(t?: string): T;
  consumeEOI: () => void;

  peek: () => T;
  peekEOI: () => boolean;
}

export const ConsumeHandle = {
  create<T extends TokenBase>(iterator: Iterator<T, undefined>): ConsumeHandle<T> {
    const input = IteratorInput.create(iterator);
    const position = Position.create();

    const mark = position.mark;
    const reset = position.reset;

    const consume: ConsumeHandle<T>['consume'] = (expected?: string) => {
      const result = input.get(position.current());

      if (!('token' in result)) {
        throw new UnexpectedEOI();
      }

      const { token } = result;

      if (expected != null && token.type !== expected) {
        throw new TokenMismatch(expected, token);
      }

      position.advance();
      return token;
    };

    const consumeEOI = () => {
      const result = input.get(position.current());
      if (!('EOI' in result)) {
        throw new TokenMismatch('EOI', result.token);
      }
    };

    const peek = () => {
      const result = input.get(position.current());

      if (!('token' in result)) {
        throw new UnexpectedEOI();
      }

      const { token } = result;

      return token;
    };

    const peekEOI = () => {
      const result = input.get(position.current());
      return 'EOI' in result
        ? result.EOI
        : false;
    };

    return { mark, reset, consume, peek, peekEOI, consumeEOI };
  }
};
