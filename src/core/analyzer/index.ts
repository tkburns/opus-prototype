// import type * as RS from '&/utils/recursion-scheme';
import { Module } from '&/utils/system/system';
import type * as AST from '../ast';
import type * as AAST from './aast';
import * as Bindings from './bindings';

// fuse analyze runs in future - just run sequentially for now

export const analyzer: Module<AST.Get<AST.Program>, AAST.Get<AST.Program>> = {
  run: (program) => {
    return Bindings.analyze(program);
  }
};
