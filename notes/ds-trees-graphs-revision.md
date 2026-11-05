## Tree terminology

- **Root:** the top node, which has no parent.
- **Leaf:** a node with no children.
- **Height of a tree:** the number of edges on the longest path from the root to a leaf.
- **Degree of a node:** the number of children it has.

## Binary trees

Each node has at most two children.

| Traversal | Order | Use |
| --- | --- | --- |
| Inorder | Left → Root → Right | Gives sorted output for a BST |
| Preorder | Root → Left → Right | Copying a tree |
| Postorder | Left → Right → Root | Deleting a tree |
| Level order | Level by level, using a queue | Breadth-first processing |

A binary tree of height *h* has at most **2^(h+1) − 1** nodes.

## Binary search tree (BST)

For every node, keys in the **left** subtree are smaller and keys in the **right** subtree are larger.

- Search, insert and delete: **O(h)**. That is O(log n) when the tree is balanced and O(n) when it is skewed.
- **AVL tree:** a self-balancing BST in which the heights of the two subtrees of any node differ by at most 1.

## Heaps

A **complete binary tree** that satisfies the heap property:

- **Max-heap:** every parent is greater than or equal to its children.
- **Min-heap:** every parent is less than or equal to its children.

Heap sort runs in **O(n log n)**.

## Graphs

A graph *G = (V, E)* is a set of vertices and the edges between them.

| Representation | Space | Best for |
| --- | --- | --- |
| Adjacency matrix | O(V²) | Dense graphs |
| Adjacency list | O(V + E) | Sparse graphs |

### Traversals

- **BFS:** uses a queue and visits the graph level by level. It finds shortest paths in unweighted graphs.
- **DFS:** uses a stack or recursion and goes as deep as possible before backtracking.

Both take **O(V + E)** time with an adjacency list.

### Key algorithms

- **Dijkstra:** shortest paths with non-negative edge weights.
- **Prim and Kruskal:** minimum spanning tree.
- **Topological sort:** linear ordering of a directed acyclic graph (DAG).
