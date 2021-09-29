import { a, tokenIterator } from './common';
import { createRDParser } from '../index';
import { lrec } from '../lrec';
import { precedented } from '../precedence';

const tokens = (input) => {
  const chars = input.split('')
    .filter(c => c != ' ');

  return tokenIterator(chars);
};

const print = (node) => {
  if (node.type === 'start') {
    return node.children
      .map(print)
      .map(s => s[0] === '(' && s.slice(-1)[0] === ')'
        ? s.slice(1, -1)
        : s
      )
      .join('\n');
  } else if (node.type === 'op') {
    return `(${print(node.left)} ${node.op} ${print(node.right)})`;
  } else {
    return node.type;
  }
};

const run = (parser, ts) => {
  const input = tokens(ts);
  return print(parser.run(input));
};

const binary = (op, rec, [lp, rp]) => (handle, ctx) => {
  const left = rec(handle, { ...ctx, precedence: lp });
  handle.consume(op);
  const right = rec(handle, { ...ctx, precedence: rp });

  return { type: 'op', op, left, right };
};

describe('precedented', () => {

  it('respects precedence', () => {
    const start = (handle, ctx) => {
      const node = expr(handle, ctx);

      handle.consumeEOI();

      return { type: 'start', children: [node] };
    };

    const expr = lrec((handle, ctx) => {
      return precedented(handle, ctx, ctx.precedence ?? 0, [
        [add, sub],
        [mult, div],
        [app],
        [paren, a],
      ]);
    });

    const add = binary('+', expr, [0, 1]);
    const sub = binary('-', expr, [0, 1]);

    const mult = binary('*', expr, [1, 2]);
    const div = binary('/', expr, [1, 2]);

    const app = binary(':', expr, [2, 3]);

    const paren = (handle, context) => {
      handle.consume('(');
      const node = expr(handle, { ...context, precedence: 0 });
      handle.consume(')');

      return node;
    };

    const parser = createRDParser(start);

    expect(run(parser, 'a + a * a + a : (a - a + a) / a'))
      .toEqual('(a + (a * a)) + ((a : ((a - a) + a)) / a)');
  });

  it('emulates associativity with precedence', () => {
    const start = (handle, ctx) => {
      const node = expr(handle, ctx);

      handle.consumeEOI();

      return { type: 'start', children: [node] };
    };

    const expr = lrec((handle, ctx) => {
      return precedented(handle, ctx, ctx.precedence ?? 0, [
        [add, sub],
        [mult, div],
        [app],
        [paren, a],
      ]);
    });

    const add = binary('+', expr, [0, 1]);
    const sub = binary('-', expr, [0, 1]);

    const mult = binary('*', expr, [1, 2]);
    const div = binary('/', expr, [1, 2]);

    const app = binary(':', expr, [2, 3]);

    const paren = (handle, context) => {
      handle.consume('(');
      const node = expr(handle, { ...context, precedence: 0 });
      handle.consume(')');

      return node;
    };

    const parser = createRDParser(start);

    expect(run(parser, 'a + a + a + a'))
      .toEqual('((a + a) + a) + a');
  });
});
