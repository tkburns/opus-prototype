import type { TokenMap } from '../lexer';

export type BaseNode = (
  Name
);

export type Name = {
  type: 'name';
  value: string;
  token: TokenMap['name'];
};
