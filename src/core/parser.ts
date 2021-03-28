import { createRDParser, LexerHandle, ASTBase, repeated, oneOf, optional } from '&/utils/system/parser';
import { FilteredToken } from './lexer';
import type * as AST from './ast.types';

type RDParser<Node extends ASTBase = ASTBase> = (handle: LexerHandle<FilteredToken>) => Node;

const program: RDParser<AST.Program> = (handle) => {
  const entries = repeated(handle, () =>
    oneOf(handle, [declaration, expression])
  );

  if (!handle.atEOI()) {
    const token = handle.peek();
    throw new Error(`failed to parse 'program'; expected EOI but recieved token ${token.type} (at ${token.location.line}:${token.location.column})`);
  }

  return {
    type: 'program',
    entries
  };
};

const declaration: RDParser<AST.Declaration> = (handle) => {
  const vrb = name(handle);
  handle.consume('=');
  const expr = expression(handle);

  return {
    type: 'declaration',
    name: vrb,
    expression: expr,
  };
};

const expression: RDParser<AST.Expression> = (handle) => {
  return oneOf(handle, [
    funcCall,
    expressionRecSafe
  ]);
};

const expressionRecSafe: RDParser<AST.Expression> = (handle) => {
  return oneOf(handle, [
    parenthesizedExpression,
    func,
    tuple,
    name,
    atom,
    number,
    text,
  ]);
};

const parenthesizedExpression: RDParser<AST.Expression> = (handle) => {
  handle.consume('(');
  const expr = expression(handle);
  handle.consume(')');

  return expr;
};

const funcCall: RDParser<AST.FuncCall> = (handle) => {
  const func = expressionRecSafe(handle);
  handle.consume('(');
  const arg = expression(handle);
  handle.consume(')');

  return {
    type: 'function-call',
    func,
    arg,
  };
};

const func: RDParser<AST.Func> = (handle) => {
  const arg = name(handle);
  handle.consume('=>');
  const expr = expression(handle);

  return {
    type: 'function',
    arg,
    body: expr,
  };
};

const tuple: RDParser<AST.Tuple> = (handle) => {
  handle.consume('(');

  const members = repeated(handle, () => {
    const member = expression(handle);
    optional(handle, () => {
      handle.consume(',');
    });

    return member;
  });

  handle.consume(')');

  return {
    type: 'tuple',
    members,
  };
};

const name: RDParser<AST.Name> = (handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    value: token.value,
    token
  };
};

const atom: RDParser<AST.Atom> = (handle) => {
  const token = handle.consume('atom');

  return {
    type: 'atom',
    value: token.value,
    token
  };
};

const number: RDParser<AST.Numeral> = (handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    value: token.value,
    token
  };
};

const text: RDParser<AST.Text> = (handle) => {
  const token = handle.consume('text');

  return {
    type: 'text',
    value: token.value,
    token
  };
};

const root: RDParser<AST.AST> = program;
export const parser = createRDParser(root);
