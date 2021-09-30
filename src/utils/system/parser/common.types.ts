import { TokenBase } from '../lexer';
import type { ConsumeHandle } from './handles';

export type LexerHandle<T extends TokenBase = TokenBase> = ConsumeHandle<T>;

export type RDParser<H extends ConsumeHandle, C, R> = (handle: H, context: C) => R;

export type ExtendedRDParser<H extends ConsumeHandle, C, As extends unknown[], R> =
  (handle: H, context: C, ...args: As) => R;
