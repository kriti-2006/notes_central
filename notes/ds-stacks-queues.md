## Stack: last in, first out

A **stack** allows insertion and deletion at one end only, called the **top**. The last element pushed is the first one popped (**LIFO**).

| Operation | Meaning | Time |
| --- | --- | --- |
| push(x) | Add x on top | O(1) |
| pop() | Remove the top element | O(1) |
| peek() | Read the top element without removing it | O(1) |

**Overflow** happens when you push onto a full array-based stack. **Underflow** happens when you pop from an empty stack.

### Applications

- Function calls and recursion (the call stack)
- Undo in editors
- Balanced-parenthesis checking
- Converting and evaluating **infix, postfix and prefix** expressions

### Evaluating a postfix expression

Scan from left to right. Push operands onto the stack. When you reach an operator, pop two operands, apply the operator, and push the result back.

```
Expression: 5 3 + 2 *
push 5, push 3, '+' → 8, push 2, '*' → 16
```

## Queue: first in, first out

A **queue** inserts at the **rear** and deletes from the **front** (**FIFO**).

- **enqueue(x):** add at the rear
- **dequeue():** remove from the front

### Circular queue

In a simple array-based queue, the space freed at the front is never reused. A **circular queue** wraps the indices around with modulo arithmetic:

```
rear  = (rear + 1) % SIZE
front = (front + 1) % SIZE
```

### Other variants

- **Deque (double-ended queue):** insert and delete at both ends.
- **Priority queue:** the element with the highest priority leaves first. It is usually implemented with a heap.

> **Remember:** a stack is the natural structure for depth-first search, and a queue is the natural structure for breadth-first search.
