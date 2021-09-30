import { choice } from '.';
import { ExtendedRDParser, RDParser } from './common.types';
import { ConsumeHandle } from './handles';


export const precedented = <H extends ConsumeHandle, C, R, Ps extends ExtendedRDParser<H, C, [number], R>>(
  handle: H,
  context: C,
  precedence: number,
  parserTable: Ps[][]
): R => {
  if (precedence < 0 && precedence >= parserTable.length) {
    throw new Error(`precedence out of bounds of parserTable (0 .. ${parserTable.length - 1})`);
  }

  const choices: RDParser<H, C, R>[] = parserTable.reduceRight((precedenceLevels, parsers, level) => {
    const refinedParsers = parsers.map<RDParser<H, C, R>>(parser =>
      (h, c) => parser(h, c, level)
    );

    const nextPrecedenceLevel: RDParser<H, C, R> | undefined = precedenceLevels[0];

    const currentPrecedenceLevel: RDParser<H, C, R> = (handle, context) => {
      const currentChoices = nextPrecedenceLevel
        ? [...refinedParsers, nextPrecedenceLevel]
        : refinedParsers;

      return choice(handle, context, currentChoices);
    };

    return [currentPrecedenceLevel, ...precedenceLevels];
  }, [] as RDParser<H, C, R>[]);

  const precedenceParser: RDParser<H, C, R> = choices[precedence];

  return precedenceParser(handle, context);
};
