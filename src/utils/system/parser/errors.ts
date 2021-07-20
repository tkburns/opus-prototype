import { TokenBase } from '../lexer';

export class UnrestrainedLeftRecursion extends Error {
  constructor(
    readonly flag: unknown
  ) {
    super('Unrestrained left recursion in parser');
  }
}

export class TokenMismatch extends Error {
  constructor(
    readonly expected: string,
    readonly token: TokenBase
  ) {
    super(`token mismatch as ${token.location.line}:${token.location.column}; expected ${expected}, but recieved ${token.type}`);
    this.name = this.constructor.name;
  }
}

export class UnexpectedEOI extends Error {
  constructor(
    readonly expected?: string,
  ) {
    super(`EOI reached unexpectedly${expected ? `; expected token ${expected}` : ''}`);
    this.name = this.constructor.name;
  }
}

const flattenErrors = (errors: ParseError[]): Exclude<ParseError, CompositeParseError>[] =>
  errors.reduce((acc, error) =>
    error instanceof CompositeParseError
      ? [...acc, ...error.errors]
      : [...acc, error],
    [] as Exclude<ParseError, CompositeParseError>[]
  );

export class CompositeParseError extends Error {
  readonly errors: Exclude<ParseError, CompositeParseError>[];

  constructor(
    errors: ParseError[]
  ) {
    const flattenedErrors = flattenErrors(errors);

    super(CompositeParseError.createMessage(flattenedErrors));
    this.name = this.constructor.name;

    this.errors = flattenedErrors;
  }

  static createMessage(errors: Exclude<ParseError, CompositeParseError>[]): string {
    const errorMessages = errors.map(e => `[${e.name}] ${e.message}`);
    return `multiple parse errors:\n  ${errorMessages.join('\n  ')}`;
  }
}

export type ParseError =
  TokenMismatch |
  UnexpectedEOI |
  CompositeParseError;

export const isParseError = (e: unknown): e is ParseError =>
  e instanceof TokenMismatch ||
  e instanceof UnexpectedEOI ||
  e instanceof CompositeParseError;
