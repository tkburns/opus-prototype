import { TokenBase } from '../lexer';
import { ConsumeBeforeLRec, LRecError, UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle, Mark } from './handles';

export type LRecHandle<Handle extends ConsumeHandle<TokenBase>> = Handle & {
  getLRecState: (name: string) => 'base' | 'acc' | null;
  getSavedLRecNode: (n: string) => unknown;
}

type HandleToken<H extends ConsumeHandle<TokenBase>> =
  H extends ConsumeHandle<infer T> ? T : never;

const isLRecHandle = (
  handle: ConsumeHandle<TokenBase>
): handle is LRecHandle<ConsumeHandle<TokenBase>> =>
  'getSavedLRecNode' in handle;

export const createBaseLRecHandle =
  <Name extends string, Handle extends ConsumeHandle<TokenBase>>(name: Name, handle: Handle):
    LRecHandle<Handle> =>
  {
    const start = handle.mark();

    const getLRecState = (n: string) => {
      if (n === name) {
        return 'base';
      } else if (isLRecHandle(handle)) {
        return handle.getLRecState(n);
      } else {
        return null;
      }
    };

    const getSavedLRecNode = (n: string) => {
      const current = handle.mark();

      if (start.position === current.position && n === name) {
        throw new UnrestrainedLeftRecursion(name);
      } else if (isLRecHandle(handle)) {
        return handle.getSavedLRecNode(n);
      } else {
        return undefined;
      }
    };

    return {
      ...handle,
      getLRecState,
      getSavedLRecNode: getSavedLRecNode as (n: string) => never
    };
  };

type Prev<Node> = {
  node: Node;
  endMark: Mark;
};
export const createAccLRecHandle =
  <Name extends string, Node, Handle extends ConsumeHandle<TokenBase>>(name: Name, prev: Prev<Node>, handle: Handle):
    LRecHandle<Handle> =>
  {
    const start = handle.mark();

    const getLRecState = (n: string) => {
      if (n === name) {
        return 'acc';
      } else if (isLRecHandle(handle)) {
        return handle.getLRecState(n);
      } else {
        return null;
      }
    };

    const getSavedLRecNode = (n: string) => {
      const current = handle.mark();

      if (start.position === current.position) {
        if (n === name) {
          handle.reset(prev.endMark);
          return prev.node;
        } else if (isLRecHandle(handle) && handle.getLRecState(n) != null) {
          throw new LRecError(`currently accumulating ${JSON.stringify(name)}, not ${JSON.stringify(n)}`);
        } else {
          return undefined;
        }
      } else {
        if (isLRecHandle(handle)) {
          return handle.getSavedLRecNode(n);
        } else {
          return undefined;
        }
      }
    };

    const consume: Handle['consume'] = <N extends HandleToken<Handle>['type']>(expected?: N) => {
      const current = handle.mark();

      if (start.position === current.position) {
        throw new ConsumeBeforeLRec(name, expected);
      }

      return handle.consume(expected) as ReturnType<Handle['consume']>;
    };

    return {
      ...handle,
      getLRecState,
      consume,
      getSavedLRecNode: getSavedLRecNode as (n: string) => never,
    };
  };

type RDParser<T extends TokenBase, R, H extends ConsumeHandle<T>> = (handle: H) => R;

export const lrec = <T extends TokenBase, R, H extends ConsumeHandle<T>>(name: string, parser: RDParser<T, R, H>): RDParser<T, R, H> =>
  (handle: H) => {
    // add a handle.hasSavedLRecNode(name) ?
    if (isLRecHandle(handle)) {
      const saved = handle.getSavedLRecNode(name) as R;
      if (saved) {
        return saved;
      }
    }

    const startMark = handle.mark();

    const baseHandle = createBaseLRecHandle(name, handle);
    const base = parser(baseHandle);
    let prev = { node: base, endMark: handle.mark() };

    let failed = false;
    while (!failed) {
      try {
        handle.reset(startMark);

        const lrecHandle = createAccLRecHandle(name, prev, handle);
        const node = parser(lrecHandle);

        prev = { node: node, endMark: handle.mark() };
      } catch (e) {
        failed = true;
      }
    }

    handle.reset(prev.endMark);
    return prev.node;
  };
