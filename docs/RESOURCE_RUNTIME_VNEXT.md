# Resource Runtime vNext

## Goal

Evolve the V0.1 fixed-memory GPIO registry into a concurrency-safe resource broker without turning SM-OS Mini into a general-purpose desktop OS.

## Resource model

Each resource should expose:

```text
Resource
├── immutable identity
├── capability set
├── safety policy
├── state
├── owner set
├── access mode
├── generation
├── dependencies
└── cleanup hook
```

Target states:

- FREE
- CLAIMED
- SHARED
- RESERVED
- ERROR

GPIO usually uses exclusive ownership. Shared buses such as I2C require a bus owner plus independently owned device addresses. SPI requires controller ownership plus explicit chip-select ownership.

## Capability handles

Projects should receive opaque handles rather than raw global resource pointers.

A handle should include a generation value. Restarting or releasing a project increments the resource generation so an old handle cannot be reused accidentally.

## Concurrency

All claim/release transitions must be serialized. The first implementation can use one broker mutex around short metadata operations. Interrupt handlers must never block on this mutex; ISR paths should publish bounded events to a task-owned queue.

## Lifecycle

```text
request
  -> validate board policy
  -> validate capability
  -> resolve dependency/share rule
  -> atomic claim
  -> return handle
  -> run
  -> stop/crash
  -> cleanup
  -> invalidate handle generation
  -> release
```

## Failure rules

- project crash must not leak ownership
- hot-removed hardware moves dependent resources to ERROR/unavailable
- safe mode starts without user auto-start projects
- core services use bounded queues and fixed pools
- no unbounded allocation in ISR, USB-event or high-frequency GPIO paths

## Later sandbox work

A WASM runtime may be evaluated only for non-driver application logic. HAL, interrupts, watchdog/recovery and core resource ownership remain native trusted code. Any WASM adoption requires measured RAM, flash, latency and energy budgets on the target board.
