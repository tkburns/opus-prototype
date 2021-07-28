import { TokenBase } from '../lexer';
import type { ConsumeHandle } from './handles';

export type LexerHandle<T extends TokenBase = TokenBase> = ConsumeHandle<T>;
export type RDParser<H extends ConsumeHandle, R> = (handle: H) => R;
