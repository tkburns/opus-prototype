import { TokenBase } from '../lexer';
import { ConsumeBeforeLRec, LRecError, UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle, Mark } from './handles';

export type LRecHandle<Name, Node, Handle extends ConsumeHandle<TokenBase>> = Handle & {
  getLRecState: (name: Name) => 'base' | 'acc' | null;
  getSavedLRecNode: (name: Name) => Node;
  debugSavedLRecNode: (name: Name) => Node;
}

type HandleToken<H extends ConsumeHandle<TokenBase>> =
  H extends ConsumeHandle<infer T> ? T : never;

const isLRecHandle = <Name, Node, Handle extends ConsumeHandle<TokenBase>>(
  handle: LRecHandle<Name, Node, Handle> | Handle
): handle is LRecHandle<Name, Node, Handle> =>
    'getSavedLRecNode' in handle;


type GetSavedLRecNode<Name, Node, Handle> =
  (n: Name) => Node &
  (
    Handle extends LRecHandle<infer Name2, infer Node2, infer Handle2>
      ? GetSavedLRecNode<Name2, Node2, Handle2>
      : undefined
  );

export const createBaseLRecHandle =
  <Name, Handle extends ConsumeHandle<TokenBase>>(name: Name, handle: Handle):
    LRecHandle<Name, never, Handle> =>
  {
    const start = handle.mark();

    const getLRecState = (n: unknown) => {
      if (n === name) {
        return 'base';
      } else if (isLRecHandle(handle)) {
        return handle.getLRecState(n);
      } else {
        return null;
      }
    };

    const getSavedLRecNode = (n: unknown) => {
      const current = handle.mark();

      if (start.position === current.position && n === name) {
        throw new UnrestrainedLeftRecursion(name);
      } else if (isLRecHandle(handle)) {
        return handle.getSavedLRecNode(n);
      } else {
        return undefined;
      }
    };

    const debugSavedLRecNode = (n: unknown) => {
      if (n === name) {
        return undefined;
      } else if (isLRecHandle(handle)) {
        return handle.debugSavedLRecNode(n);
      } else {
        return undefined;
      }
    };

    return {
      ...handle,
      getLRecState,
      getSavedLRecNode: getSavedLRecNode as GetSavedLRecNode<Name, never, Handle>,
      debugSavedLRecNode: debugSavedLRecNode as GetSavedLRecNode<Name, never, Handle>
    };
  };

type Prev<Node> = {
  node: Node;
  endMark: Mark;
};
export const createAccLRecHandle =
  <Name, Node, Handle extends ConsumeHandle<TokenBase>>(name: Name, prev: Prev<Node>, handle: Handle):
    LRecHandle<Name, Node, Handle> =>
  {
    const start = handle.mark();

    const getLRecState = (n: unknown) => {
      if (n === name) {
        return 'acc';
      } else if (isLRecHandle(handle)) {
        return handle.getLRecState(n);
      } else {
        return null;
      }
    };

    const getSavedLRecNode = (n: unknown) => {
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

    const debugSavedLRecNode = (n: unknown) => {
      if (n === name) {
        return prev.node;
      } else if (isLRecHandle(handle)) {
        return handle.debugSavedLRecNode(n);
      } else {
        return undefined;
      }
    };

    return {
      ...handle,
      getLRecState,
      consume,
      getSavedLRecNode: getSavedLRecNode as GetSavedLRecNode<Name, never, Handle>,
      debugSavedLRecNode: debugSavedLRecNode as GetSavedLRecNode<Name, never, Handle>
    };
  };

type RDParser<T extends TokenBase, R> = (handle: ConsumeHandle<T>) => R;

export const lrec = <T extends TokenBase, R>(name: string, parser: RDParser<T, R>): RDParser<T, R> => {
  // const name = Symbol('left recursion root');

  return (handle: ConsumeHandle<T>) => {
    // add a handle.hasSavedLRecNode(name)
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
};
