## Memory management basics

- **Logical address:** the address the CPU generates.
- **Physical address:** the actual address in RAM.
- The **MMU (memory management unit)** translates logical addresses into physical addresses.

## Contiguous allocation

Each process occupies one continuous block of memory.

- **First fit:** use the first hole that is big enough.
- **Best fit:** use the smallest hole that is big enough.
- **Worst fit:** use the largest hole.

**External fragmentation** means the total free memory is enough, but it is split into small, separate holes. **Compaction** solves it by moving processes together.

## Paging

- Physical memory is divided into fixed-size **frames**, and logical memory into **pages** of the same size.
- A **page table** maps each page number to a frame number.
- Paging removes external fragmentation, but can cause a small amount of **internal fragmentation** in a process's last page.
- A **TLB (translation lookaside buffer)** caches recent translations to speed them up.

## Virtual memory and page replacement

Virtual memory lets a program run even when it is only partly in RAM. When a page that is not in memory is needed, a **page fault** occurs.

| Algorithm | Idea |
| --- | --- |
| FIFO | Replace the oldest page. It can show **Belady's anomaly** |
| Optimal | Replace the page that will not be used for the longest time. It is a benchmark only |
| LRU | Replace the least recently used page |

**Thrashing** happens when the system spends more time swapping pages than executing processes.

## Deadlocks

A **deadlock** is a set of processes in which each process is waiting for a resource held by another process in the set.

### The four necessary conditions (Coffman)

1. **Mutual exclusion**
2. **Hold and wait**
3. **No pre-emption**
4. **Circular wait**

A deadlock can occur only if all four hold at the same time.

### Handling deadlocks

- **Prevention:** make sure at least one condition can never hold.
- **Avoidance:** the **Banker's algorithm** grants a request only if the system stays in a **safe state**.
- **Detection and recovery:** let deadlocks happen, detect them, then abort or roll back processes.
- **Ignore:** the "ostrich" approach used by most desktop operating systems.
