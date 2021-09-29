import { choice } from '.';
import { RDParser } from './common.types';
import { ConsumeHandle } from './handles';

export const precedented = <H extends ConsumeHandle, C, Ps extends RDParser<H, C, unknown>[][]>(
  handle: H,
  context: C,
  precedence: number,
  parserTable: Ps
): ReturnType<Ps[number][number]> => {
  if (precedence < 0 && precedence >= parserTable.length) {
    throw new Error(`precedence out of bounds of parserTable (0 .. ${parserTable.length - 1})`);
  }

  const choices: Ps[number] = parserTable.reduceRight((precedenceLevels, parsers) => {
    const nextPrecedenceLevel: Ps[number][number] | undefined = precedenceLevels[0];

    const currentPrecedenceLevel: Ps[number][number] = (handle, context) => {
      const currentChoices = nextPrecedenceLevel
        ? [...parsers, nextPrecedenceLevel]
        : parsers;

      return choice(handle, context, currentChoices);
    };

    return [currentPrecedenceLevel, ...precedenceLevels];
  }, [] as Ps[number]);

  const precedenceParser: Ps[number][number] = choices[precedence];

  return precedenceParser(handle, context) as ReturnType<Ps[number][number]>;
};
