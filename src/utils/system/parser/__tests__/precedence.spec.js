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
  } else if (node.type === 'apply') {
    return `(${print(node.left)} ${print(node.right)})`;
  } else {
    return node.type;
  }
};

const run = (parser, ts) => {
  const input = tokens(ts);
  return print(parser.run(input));
};

const lassoc = p => [p, p+1];
const rassoc = p => [p+1, p];

const rules = {
  binary:  (op, ps) => rec => (handle, ctx, precedence) => {
    const [lp, rp] = ps(precedence);

    const left = rec(handle, ctx, lp);
    handle.consume(op);
    const right = rec(handle, ctx, rp);

    return { type: 'op', op, left, right };
  },

  apply: (ps = lassoc) => rec => (handle, ctx, precedence) => {
    const [lp, rp] = ps(precedence);

    const left = rec(handle, ctx, lp);
    const right = rec(handle, ctx, rp);

    return { type: 'apply', left, right };
  },

  parens: rec => (handle, context) => {
    handle.consume('(');
    const node = rec(handle, context, 0);
    handle.consume(')');

    return node;
  },

  pure: parser => rec => parser,
};

const createExpressionParser = (precedencedRules) => {
  const start = (handle, ctx) => {
    const node = expr(handle, ctx);

    handle.consumeEOI();

    return { type: 'start', children: [node] };
  };

  const expr = lrec((handle, ctx, precedence = 0) => {
    return precedented(handle, ctx, precedence, precedenceTable);
  });

  const precedenceTable = precedencedRules.map(rules =>
    rules.map(rule => rule(expr))
  );

  return createRDParser(start);
};


describe('precedented', () => {
  const add = rules.binary('+', lassoc);
  const sub = rules.binary('-', lassoc);

  const mult = rules.binary('*', lassoc);
  const div = rules.binary('/', lassoc);

  const append = rules.binary(':', rassoc);
  const app = rules.apply(lassoc);

  const parser = createExpressionParser([
    [add, sub],
    [mult, div],
    [append],
    [app],
    [rules.parens, rules.pure(a)],
  ]);

  it('respects precedence', () => {
    expect(run(parser, 'a + a * a : a (a + a * a : a a)'))
      .toEqual('a + (a * (a : (a (a + (a * (a : (a a)))))))');

    // TODO - multiple runs are failing because state persists beyond run -> cache/lrec isn't cleared
    // expect(run(parser, '(a a : a / a - a) a : a / a - a'))
    //   .toEqual('(((((((a a) : a) / a) - a) a) : a) / a) - a');

    // expect(run(parser, 'a + a * a + a (a - a + a) / a'))
    //   .toEqual('(a + (a * a)) + ((a ((a - a) + a)) / a)');
  });

  it('emulates associativity with precedence', () => {
    expect(run(parser, 'a + a + a + a'))
      .toEqual('((a + a) + a) + a');

    expect(run(parser, 'a : a : a : a'))
      .toEqual('a : (a : (a : a))');
  });

  it('supports alternating associativity', () => {
    expect(run(parser, 'a + a - a : a : a + a - a'))
      .toEqual('(((a + a) - (a : (a : a))) + a) - a');

    // TODO - multiple runs are failing because state persists beyond run -> cache/lrec isn't cleared
    // expect(run(parser, 'a * a / a : a : a a a'))
    //   .toEqual('(a * a) / (a : (a : ((a a) a)))');
  });
});
