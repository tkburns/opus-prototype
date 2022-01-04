import type { TokenBase } from './lexer';
import util from 'util';


export const indent = (str: string, prefix: string, indentation: string = prefix): string =>
  prefix + str.replace(/\r?\n/g, (match) => match + indentation);

export const lines = (...strs: string[]): string =>
  strs.join('\n');


/* tokens */

export const stringifyToken = (token: TokenBase): string => {
  if ('value' in token) {
    return `${token.type}(${util.inspect(token.value)})`;
  } else {
    return token.type;
  }
};


/* tree-based structures */

export const indentChild = (str: string, lastChild: boolean): string =>
  lastChild
    ? indent(str, ' └─ ', '    ')
    : indent(str, ' ├─ ', ' │  ');


/* template string utils */

type TemplateProcessor<T> = (pre: string, interp: T, post: string) =>
  [processedPre: string, processedInterp: string, processedPost: string];

const processTemplate = <T>(
  literals: readonly string[],
  interpolations: readonly T[],
  processor: TemplateProcessor<T>
): string[] => {
  if (literals.length < 2 || interpolations.length < 1) {
    return [...literals];
  }

  const [pre, post] = literals;
  const [interp] = interpolations;

  const [processedPre, processedInterp, processedPost] = processor(pre, interp, post);

  return [
    processedPre,
    processedInterp,
    ...processTemplate([processedPost, ...literals.slice(2)], interpolations.slice(1), processor)
  ];
};



const getIndentation = (s: string): string => {
  const nonSpace = s.search(/\S|\n/);
  return nonSpace === -1
    ? s
    : s.slice(0, nonSpace);
};


export const flattenIndentation = (s: string): string => {
  const lines = s.split('\n');

  const baseIndent = lines.reduce(
    (minIndent, line) => {
      if (!/\S/.test(line)) {
        return minIndent;
      }
      const indent = getIndentation(line).length;
      if (minIndent == null) {
        return indent;
      } else {
        return Math.min(indent, minIndent);
      }
    },
    undefined as undefined | number
  );

  const flattened = baseIndent != null
    ? lines.map(line => line.slice(baseIndent))
    : lines;

  return flattened.join('\n');
};


/* code template processor */

export type Stringable = string | number | boolean;
export type CodeInterpolation = Stringable | Stringable[];

export const code = (literals: TemplateStringsArray, ...interpolations: CodeInterpolation[]): string => {
  const normalizedInterpolations = interpolations
    .map(interp => Array.isArray(interp) ? interp : [interp])
    .map(interp => interp.map(segment => segment.toString()));

  const processed = processTemplate(literals, normalizedInterpolations, (pre, interp, post) => {
    const interpLines = interp.flatMap(chunk => chunk.split('\n'));

    const preLines = pre.split('\n');

    const indentation = getIndentation(preLines[preLines.length - 1]);

    const indented = interpLines
      .map((line, num) => num === 0
        ? line
        : indentation + line
      );

    return [
      pre,
      indented.join('\n'),
      post,
    ];
  });

  return flattenIndentation(processed.join('')).trim();
};
