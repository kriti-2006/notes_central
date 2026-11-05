## Periodic functions

A function f(x) is **periodic** with period T if f(x + T) = f(x) for all x. sin x and cos x have a period of 2π.

## Fourier series on (−π, π)

A periodic function can be written as a sum of sines and cosines:

```
f(x) = a₀/2 + Σ (aₙ cos nx + bₙ sin nx),   n = 1, 2, 3, …
```

### Euler's formulas

```
a₀ = (1/π) ∫ f(x) dx          from −π to π
aₙ = (1/π) ∫ f(x) cos nx dx   from −π to π
bₙ = (1/π) ∫ f(x) sin nx dx   from −π to π
```

## Dirichlet's conditions

A Fourier series converges if, over one period, f(x):

1. is single-valued and bounded,
2. has a finite number of discontinuities, and
3. has a finite number of maxima and minima.

At a point of discontinuity, the series converges to the **average of the left-hand and right-hand limits**.

## Even and odd functions

| Function | Property | What simplifies |
| --- | --- | --- |
| Even | f(−x) = f(x) | bₙ = 0, leaving a **cosine series** |
| Odd | f(−x) = −f(x) | a₀ = aₙ = 0, leaving a **sine series** |

Spotting symmetry first can halve the amount of work.

## Change of interval: period 2L

For a function on (−L, L):

```
f(x) = a₀/2 + Σ [aₙ cos(nπx/L) + bₙ sin(nπx/L)]
aₙ = (1/L) ∫ f(x) cos(nπx/L) dx   from −L to L
bₙ = (1/L) ∫ f(x) sin(nπx/L) dx   from −L to L
```

## Half-range series

A function defined only on (0, L) can be extended as:

- an **even** function, which gives a **half-range cosine series**, or
- an **odd** function, which gives a **half-range sine series**.

## Worked example: f(x) = x on (−π, π)

x is odd, so a₀ = aₙ = 0.

```
bₙ = (2/π) ∫₀^π x sin nx dx = 2(−1)^(n+1) / n
x = 2 [ sin x − (sin 2x)/2 + (sin 3x)/3 − … ]
```

Putting x = π/2 gives **π/4 = 1 − 1/3 + 1/5 − …**, which is Gregory's series.
