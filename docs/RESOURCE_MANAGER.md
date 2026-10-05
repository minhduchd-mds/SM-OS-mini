# V0.1 Resource Manager

SM-OS Mini V0.1 now contains a real fixed-memory GPIO resource registry.

## Current guarantees

- No dynamic allocation is used by the board profile or GPIO registry.
- Every GPIO has a board-policy state before projects start.
- Reserved pins cannot be claimed.
- A claimed GPIO has exactly one owner in V0.1.
- A second owner receives a conflict instead of silently reconfiguring the pin.
- Only the current owner can release a claimed GPIO.
- Re-claiming by the same owner is idempotent and may update its role.
- Oversized owner/role metadata is rejected rather than silently truncated.

## Board profile

Initial profile:

```text
esp32s3-wroom1-n16r8
Flash: 16 MB
PSRAM: 8 MB
```

Policy categories:

```text
SAFE
CAUTION
RESERVED
```

Examples:

- GPIO19/20 — reserved for native USB in the current profile.
- GPIO35/36/37 — reserved because the N16R8 target uses the Octal memory bus.
- GPIO0/3/45/46 — caution; not automatically blocked.
- GPIO22–34 — represented as unavailable in the WROOM-1 module profile.

A caution pin remains claimable in V0.1. Higher layers are expected to require an explicit user decision before assigning it.

## Fixed-memory registry

The registry is statically sized for 49 GPIO indices.

Each entry contains:

- state,
- safety policy,
- capability mask,
- owner,
- role,
- board-policy reason.

Current metadata budgets:

```text
owner: 32 bytes
role:  24 bytes
```

These limits are deliberate. SM-OS Mini should not use unbounded metadata structures in a core hardware path.

## API

```c
sm_resource_registry_init(...)
sm_gpio_claim(...)
sm_gpio_release(...)
sm_gpio_get(...)
sm_gpio_claimed_count(...)
```

Typical flow:

```text
Project requests GPIO
        ↓
range validation
        ↓
board policy
        ↓
current ownership
        ↓
claim OR conflict
```

## Host tests

The core logic is intentionally free from ESP-IDF dependencies so conflict rules can be tested on a normal CI runner.

```bash
sh tests/host/run.sh
```

Tests currently cover:

- N16R8 board policy,
- claim,
- conflicting owner,
- release by wrong owner,
- reserved GPIO rejection,
- out-of-range GPIO,
- same-owner idempotency,
- metadata bounds.

## Deliberately not implemented yet

V0.1 GPIO ownership is exclusive.

The following are later layers:

- shared I2C bus ownership,
- SPI bus + chip-select ownership,
- UART ownership,
- ADC channel conflicts,
- GPIO electrical-mode validation,
- persistence,
- project manifest binding,
- ISR ownership,
- runtime task cleanup.

These should build on the same registry rules rather than bypassing them.
