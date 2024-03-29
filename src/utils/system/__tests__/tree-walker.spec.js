import { createWalkerModule } from '../tree-walker';

/*
  type Node = Branch | Leaf;
  type Branch = { type: 'branch'; left: Node; right: Node; };
  type Leaf = { type: 'leaf'; value: string; };
*/

it('walks through tree', () => {
  const walkers = {
    branch: (node, walk) => `${walk(node.left)} ${walk(node.right)}`,
    leaf: (node) => node.value
  };

  const walker = createWalkerModule(walkers);

  const result = walker.run({
    type: 'branch',
    left: {
      type: 'branch',
      left: {
        type: 'leaf',
        value: 'a'
      },
      right: {
        type: 'leaf',
        value: 'b'
      }
    },
    right: {
      type: 'leaf',
      value: 'c'
    }
  });

  expect(result).toEqual('a b c');
});
