## Definition

```
L{f(t)} = F(s) = ∫₀^∞ e^(−st) f(t) dt
```

## Standard transforms

| f(t) | F(s) | Condition |
| --- | --- | --- |
| 1 | 1/s | s > 0 |
| tⁿ | n! / sⁿ⁺¹ | s > 0 |
| e^(at) | 1/(s − a) | s > a |
| sin at | a / (s² + a²) | s > 0 |
| cos at | s / (s² + a²) | s > 0 |
| sinh at | a / (s² − a²) | s > \|a\| |
| cosh at | s / (s² − a²) | s > \|a\| |

## Key properties

- **Linearity:** L{a f + b g} = a F(s) + b G(s)
- **First shifting:** L{e^(at) f(t)} = F(s − a)
- **Multiplication by t:** L{t f(t)} = −F′(s)
- **Division by t:** L{f(t)/t} = ∫ₛ^∞ F(u) du
- **Transform of a derivative:** L{f′(t)} = s F(s) − f(0)
- **Second derivative:** L{f″(t)} = s² F(s) − s f(0) − f′(0)
- **Integral:** L{∫₀ᵗ f(u) du} = F(s)/s

## Inverse Laplace transform

Use **partial fractions** to split F(s) into standard forms, then read the answers off the table.

```
L⁻¹{ 1 / ((s − 1)(s − 2)) } = L⁻¹{ −1/(s − 1) + 1/(s − 2) } = −eᵗ + e^(2t)
```

**Convolution theorem:** L⁻¹{F(s) G(s)} = ∫₀ᵗ f(u) g(t − u) du

## Solving differential equations

1. Take the Laplace transform of both sides.
2. Substitute the initial conditions.
3. Solve the resulting equation for Y(s).
4. Take the inverse transform to find y(t).

### Example

Solve y′ + y = 0 with y(0) = 1.

```
sY − 1 + Y = 0  ⇒  Y = 1/(s + 1)  ⇒  y = e^(−t)
```
