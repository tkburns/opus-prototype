import { TokenBase } from '../lexer';
import { ConsumeBeforeLRec, LRecError, UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle, Mark } from './handles';

export interface LRecHandleCore {
  getLRecState: (name: string) => 'base' | 'acc' | null;
  getSavedLRecNode: (n: string) => unknown;
}

export type LRecHandle<Handle extends ConsumeHandle<TokenBase>> =
  Handle & LRecHandleCore;

const isLRecHandle = (
  handle: object
): handle is LRecHandleCore =>
  'getLRecState' in handle &&
  'getSavedLRecNode' in handle;


export const createEmptyLRecHandle = <Handle extends ConsumeHandle<TokenBase>>(handle: Handle):
  LRecHandle<Handle> =>
{
  const getLRecState = () => null;
  const getSavedLRecNode = () => undefined;

  return { ...handle, getLRecState, getSavedLRecNode };
};


const ensureLRecHandle = <Handle extends ConsumeHandle<TokenBase>>(handle: Handle):
  Handle & LRecHandleCore =>
{
  if (isLRecHandle(handle)) {
    return handle;
  } else {
    return createEmptyLRecHandle(handle);
  }
};

export const createBaseLRecHandle =
  <Handle extends ConsumeHandle<TokenBase>>(name: string, _handle: Handle):
    LRecHandle<Handle> =>
  {
    const handle = ensureLRecHandle(_handle);
    const start = handle.mark();

    const getLRecState = (n: string) => {
      if (n === name) {
        return 'base';
      } else {
        return handle.getLRecState(n);
      }
    };

    const getSavedLRecNode = (n: string) => {
      const current = handle.mark();

      if (start.position === current.position && n === name) {
        throw new UnrestrainedLeftRecursion(name);
      } else {
        return handle.getSavedLRecNode(n);
      }
    };

    return {
      ...handle,
      getLRecState,
      getSavedLRecNode: getSavedLRecNode as (n: string) => never
    };
  };

type Prev<Node = unknown> = {
  node: Node;
  endMark: Mark;
};
export const createAccLRecHandle =
  <Handle extends ConsumeHandle<TokenBase>>(name: string, prev: Prev, _handle: Handle):
    LRecHandle<Handle> =>
  {
    const handle = ensureLRecHandle(_handle);
    const start = handle.mark();

    const getLRecState = (n: string) => {
      if (n === name) {
        return 'acc';
      } else {
        return handle.getLRecState(n);
      }
    };

    const getSavedLRecNode = (n: string) => {
      const current = handle.mark();

      if (start.position === current.position) {
        if (n === name) {
          handle.reset(prev.endMark);
          return prev.node;
        } else if (handle.getLRecState(n) != null) {
          throw new LRecError(`currently accumulating ${JSON.stringify(name)}, not ${JSON.stringify(n)}`);
        } else {
          return undefined;
        }
      } else {
        return handle.getSavedLRecNode(n);
      }
    };

    const consume  = (expected?: string) => {
      const current = handle.mark();

      if (start.position === current.position) {
        throw new ConsumeBeforeLRec(name, expected);
      }

      return handle.consume(expected);
    };

    return {
      ...handle,
      getLRecState,
      consume,
      getSavedLRecNode
    };
  };

export const LRecHandle = {
  createEmpty: createEmptyLRecHandle,
  createBase: createBaseLRecHandle,
  createAcc: createAccLRecHandle,
};


type RDParser<T extends TokenBase, R, H extends ConsumeHandle<T>> = (handle: H) => R;

export const lrec = <T extends TokenBase, R, H extends ConsumeHandle<T>>(name: string, parser: RDParser<T, R, H>): RDParser<T, R, H> =>
  (handle: H) => {
    if (isLRecHandle(handle)) {
      const saved = handle.getSavedLRecNode(name) as R | undefined;
      if (saved) {
        return saved;
      }
    }

    const startMark = handle.mark();

    const baseHandle = LRecHandle.createBase(name, handle);
    const base = parser(baseHandle);
    let prev = { node: base, endMark: handle.mark() };

    let failed = false;
    while (!failed) {
      try {
        handle.reset(startMark);

        const lrecHandle = LRecHandle.createAcc(name, prev, handle);
        const node = parser(lrecHandle);

        prev = { node: node, endMark: handle.mark() };
      } catch (e) {
        failed = true;
      }
    }

    handle.reset(prev.endMark);
    return prev.node;
  };
