## What is a process?

A **process** is a program in execution. The operating system keeps a **process control block (PCB)** for each one. The PCB stores the process ID, the process state, the program counter, the CPU registers, scheduling information and memory information.

## Process states

**New → Ready → Running → Waiting → Ready → … → Terminated**

- **Ready:** waiting for the CPU.
- **Running:** currently executing.
- **Waiting (blocked):** waiting for I/O or an event.

A **context switch** saves the state of the running process into its PCB and loads the state of the next process. Context switching is pure overhead.

## Threads

A **thread** is a lightweight unit of execution inside a process. Threads of the same process share code, data and open files, but each thread has its own stack and registers.

## CPU scheduling criteria

- **CPU utilisation** and **throughput**: higher is better.
- **Turnaround time** = completion time − arrival time.
- **Waiting time** = turnaround time − burst time.
- **Response time:** the time until a process first gets the CPU.

## Scheduling algorithms

| Algorithm | Pre-emptive? | Notes |
| --- | --- | --- |
| FCFS | No | Simple, but suffers from the convoy effect |
| SJF | No | Gives the minimum average waiting time, but burst times must be known |
| SRTF | Yes | The pre-emptive version of SJF |
| Priority | Either | Can cause starvation; ageing fixes it |
| Round robin | Yes | Uses a time quantum and is fair to all processes |

### Worked example: FCFS

| Process | Burst time |
| --- | --- |
| P1 | 5 |
| P2 | 3 |
| P3 | 2 |

All three arrive at time 0. The order is P1 (0–5), then P2 (5–8), then P3 (8–10). The waiting times are 0, 5 and 8, so the **average waiting time = 13 / 3 ≈ 4.33**.

With **SJF** the order becomes P3, P2, P1. The waiting times are 0, 2 and 5, so the **average drops to 7 / 3 ≈ 2.33**.

> **Exam tip:** Always draw a Gantt chart before you calculate waiting and turnaround times.
