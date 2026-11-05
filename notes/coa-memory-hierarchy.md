## The memory hierarchy

From fastest and smallest to slowest and largest:

**Registers → Cache → Main memory (RAM) → Secondary storage (SSD/HDD) → Tertiary storage**

As you move down the hierarchy, cost per bit and speed decrease, while capacity increases.

## Locality of reference

The hierarchy works because programs tend to reuse data:

- **Temporal locality:** recently used data is likely to be used again soon, as in loops.
- **Spatial locality:** data near recently used data is likely to be used soon, as with arrays.

## Cache memory

A small, fast memory between the CPU and RAM.

- **Hit:** the data is in the cache. **Miss:** it must be fetched from RAM.
- **Hit ratio** = hits ÷ (hits + misses).
- **Average access time** = h × T_cache + (1 − h) × T_main, a simplified model.

### Worked example

If h = 0.9, T_cache = 10 ns and T_main = 100 ns:

```
average = 0.9 × 10 + 0.1 × 100 = 9 + 10 = 19 ns
```

## Cache mapping techniques

| Mapping | How it works | Trade-off |
| --- | --- | --- |
| Direct | Each block maps to exactly one line: block mod (number of lines) | Simple, but causes conflict misses |
| Fully associative | A block can go in any line | Flexible, but needs expensive comparisons |
| Set associative | A block maps to one set and can use any line in that set | A balance of the two; 2-way and 4-way are common |

## Replacement and write policies

- **Replacement:** LRU, FIFO or random.
- **Write-through:** write to the cache and main memory at the same time. It is simple, but slow.
- **Write-back:** write to main memory only when the block is replaced, using a **dirty bit**.

## Main memory types

- **SRAM:** made of flip-flops. Fast and expensive, it is used for cache.
- **DRAM:** made of capacitors. It needs refreshing, is cheaper and is used for RAM.
- **ROM, PROM, EPROM and EEPROM:** non-volatile memory.

> **Exam tip:** Mapping questions usually ask you to split an address into **tag, index (line or set) and offset** bits. Work out the offset bits from the block size first.
