import { TokenBase } from '../lexer';

export class ParseError extends Error {}

export class LRecError extends ParseError {}

export class UnrestrainedLeftRecursion extends LRecError {
  constructor(
    readonly recName: string
  ) {
    super(`Unrestrained left recursion in parser for ${recName}`);
  }
}

export class ConsumeBeforeLRec extends LRecError {
  constructor(
    readonly recName: string,
    readonly expected?: string,
  ) {
    super(`attempted to consume ${expected ?? 'any'} before recursing ${recName}`);
  }
}

export class RecMismatch extends LRecError {
  constructor(
    readonly currentRec: string,
    readonly attemptedRec: string
  ) {
    super(`currently accumulating ${currentRec}, not ${attemptedRec}`);
  }
}


export class TokenMismatch extends ParseError {
  constructor(
    readonly expected: string,
    readonly token: TokenBase
  ) {
    super(`token mismatch as ${token.location.line}:${token.location.column}; expected ${expected}, but recieved ${token.type}`);
    this.name = this.constructor.name;
  }
}

export class UnexpectedEOI extends ParseError {
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

export class CompositeParseError extends ParseError {
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
