## Number systems

| System | Base | Digits |
| --- | --- | --- |
| Binary | 2 | 0, 1 |
| Octal | 8 | 0–7 |
| Decimal | 10 | 0–9 |
| Hexadecimal | 16 | 0–9, A–F |

For example, (1011)₂ = 8 + 0 + 2 + 1 = (11)₁₀ = (B)₁₆.

## Representing signed numbers

- **Sign-magnitude:** the leftmost bit is the sign. It has two zeros, +0 and −0.
- **1's complement:** invert every bit.
- **2's complement:** invert every bit, then add 1. It is the standard because it has a single zero and makes subtraction easy.

With 8 bits, 2's complement covers **−128 to +127**.

## Floating point (IEEE 754)

A single-precision number uses 32 bits: **1 sign bit, 8 exponent bits and 23 mantissa bits**.

```
value = (−1)^sign × 1.mantissa × 2^(exponent − 127)
```

## Basic computer organisation

- **CPU:** made up of the ALU, the control unit and registers.
- **Memory:** stores both instructions and data (the von Neumann architecture).
- **I/O:** communicates with the outside world.
- **System bus:** the address bus, data bus and control bus.

## Important registers

| Register | Purpose |
| --- | --- |
| PC (program counter) | Address of the next instruction |
| IR (instruction register) | The instruction being executed |
| MAR (memory address register) | The address to read or write |
| MDR (memory data register) | The data being transferred |
| AC (accumulator) | Holds ALU results |

## The instruction cycle

1. **Fetch:** MAR ← PC, MDR ← memory[MAR], IR ← MDR, PC ← PC + 1
2. **Decode:** the control unit interprets the opcode.
3. **Execute:** carry out the operation.
4. **Interrupt check:** handle any pending interrupt.

## Addressing modes

- **Immediate:** the operand is in the instruction, for example `ADD #5`.
- **Direct:** the instruction contains the operand's address.
- **Indirect:** the instruction contains the address of the operand's address.
- **Register:** the operand is in a register.
- **Indexed:** effective address = base + index register.

## Hardwired vs microprogrammed control

| Hardwired | Microprogrammed |
| --- | --- |
| Built from logic circuits | Uses microinstructions stored in control memory |
| Faster | Slower |
| Hard to modify | Easy to modify |
| Used in RISC | Used in CISC |
