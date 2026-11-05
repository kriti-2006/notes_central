## Why complexity matters

An algorithm's **time complexity** describes how its running time grows as the input size *n* grows. We usually describe the worst case using **Big-O notation**.

| Notation | Name | Example |
| --- | --- | --- |
| O(1) | Constant | Access an array element by index |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Traverse a list |
| O(n log n) | Linearithmic | Merge sort |
| O(n²) | Quadratic | Bubble sort |

**Space complexity** measures the extra memory an algorithm needs in the same way.

## Arrays

An array stores elements of the same type in **contiguous memory**. Because every element has the same size, the address of element *i* is:

```
address(A[i]) = base_address + i × element_size
```

- Access by index: **O(1)**
- Search in an unsorted array: **O(n)**
- Insert or delete in the middle: **O(n)**, because elements must shift

Arrays are ideal when you know the size in advance and need fast random access.

## Linked lists

A linked list is a chain of **nodes**. Each node holds data and a pointer to the next node, so nodes do not need to sit next to each other in memory.

```
struct Node {
    int data;
    struct Node *next;
};
```

- **Singly linked list:** each node points to the next node.
- **Doubly linked list:** each node also points to the previous node, which allows backward traversal.
- **Circular linked list:** the last node points back to the first.

## Arrays vs linked lists

| Operation | Array | Linked list |
| --- | --- | --- |
| Access the i-th element | O(1) | O(n) |
| Insert at the beginning | O(n) | O(1) |
| Memory | Fixed, contiguous | Dynamic, plus an extra pointer per node |
| Cache friendliness | High | Low |

> **Exam tip:** When asked to "insert a node after a given node" in a singly linked list, update the new node's `next` before changing the existing node's `next`, or you will lose the rest of the list.
