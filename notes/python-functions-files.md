## Defining functions

```
def area(length, width=1):
    """Return the area of a rectangle."""
    return length * width

area(5, 2)               # 10
area(length=5)           # 5, using the default width
```

### Types of arguments

- **Positional:** matched by position.
- **Keyword:** matched by name, for example `area(width=2, length=5)`.
- **Default:** used when the caller leaves an argument out.
- **Variable-length:** `*args` collects extra positional arguments into a tuple, and `**kwargs` collects extra keyword arguments into a dict.

### Scope

A variable created inside a function is **local**. Use `global` to change a module-level variable, although passing values in and returning them is usually cleaner.

### Lambda functions

```
square = lambda x: x * x
sorted(students, key=lambda s: s["cgpa"])
```

## Recursion

A recursive function calls itself and needs a **base case** to stop.

```
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
```

## Modules and packages

- A **module** is a `.py` file. Import it with `import math` or `from math import sqrt`.
- A **package** is a folder of modules.
- Install third-party packages with `pip install package-name`.

## File handling

```
with open("marks.txt", "w") as f:
    f.write("Asha,92\n")

with open("marks.txt") as f:
    for line in f:
        name, score = line.strip().split(",")
```

| Mode | Meaning |
| --- | --- |
| "r" | Read (the default). Fails if the file is missing |
| "w" | Write. Creates the file or overwrites it |
| "a" | Append to the end |
| "rb" / "wb" | Binary read or write |

The `with` statement **closes the file automatically**, even if an error occurs.

## Exception handling

```
try:
    value = int(input("Number: "))
except ValueError:
    print("Please enter a whole number.")
else:
    print("You entered", value)
finally:
    print("Done")
```
