import { Module } from '&/utils/system/system';
import type * as AST from '../ast';

// fuse analyze runs in future - just run sequentially for now

export const analyze: Module<AST.Program, AST.Program> = {
  run: (program) => {
    return program;
  }
};
