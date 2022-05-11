import type { ProgramNode, Program } from './program.types';
import type { ExpressionNode } from './expression.types';
import type { PatternNode } from './pattern.types';
import type { BaseNode } from './base.types';

export * from './program.types';
export * from './pattern.types';
export * from './expression.types';
export * from './base.types';

export type AST = Program;
export type Node = (
  ProgramNode |
  ExpressionNode |
  PatternNode |
  BaseNode
);

