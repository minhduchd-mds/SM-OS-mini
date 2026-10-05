# SM-OS Mini Roadmap

The roadmap is deliberately staged to prevent architecture from being buried under features.

## V0.1 — Measurable core

Goal: establish a trustworthy low-memory baseline.

- [x] Repository and project definition
- [x] Minimal ESP-IDF boot skeleton
- [x] Basic heap logging
- [ ] Board profile model
- [ ] Resource registry
- [ ] GPIO claim/release prototype
- [ ] Conflict tests
- [ ] Static project registry
- [ ] Diagnostics command interface
- [ ] Watchdog baseline
- [ ] Boot failure counter design

**Exit criteria:** GPIO ownership can be demonstrated without resource leaks, and memory cost is measured.

## V0.2 — Device and bus ownership

- [ ] Pin Manager
- [ ] I2C bus model
- [ ] I2C address registry
- [ ] SPI bus model
- [ ] SPI chip-select ownership
- [ ] UART ownership
- [ ] ADC ownership
- [ ] Board-specific reserved pins
- [ ] Resource inspector

**Exit criteria:** conflicting projects cannot silently reconfigure each other's hardware.

## V0.3 — Project Supervisor

- [ ] Project manifest schema
- [ ] START / STOP / RESTART lifecycle
- [ ] Auto-start policy
- [ ] Dependencies
- [ ] Per-project resource release
- [ ] Restart counter
- [ ] Crash metadata
- [ ] Safe mode trigger

**Exit criteria:** one failed project can be disabled/restarted while core services remain available.

## V0.4 — Storage and USB research

- [ ] VFS naming policy
- [ ] microSD lifecycle
- [ ] USB Host baseline
- [ ] hub enumeration
- [ ] HID experiment
- [ ] CDC experiment
- [ ] MSC experiment
- [ ] disconnect/reconnect tests
- [ ] dependent-project pause behavior

**Exit criteria:** USB device removal does not crash the OS or leave stale resource handles.

## V0.5 — Operator interface

- [ ] CLI
- [ ] Web status UI
- [ ] Hardware Map
- [ ] Project Manager
- [ ] resource conflict UI
- [ ] memory dashboard
- [ ] optional LVGL/LCD investigation

**Exit criteria:** core project and hardware operations can be performed without recompiling firmware.

## V0.6+ — Controlled extensibility

Only after earlier stages are stable:

- [ ] signed project package format
- [ ] scripting runtime comparison
- [ ] Lua feasibility
- [ ] JavaScript feasibility
- [ ] WASM feasibility
- [ ] A/B OTA
- [ ] recovery partition
- [ ] remote management
- [ ] low-power profiles

## Explicitly deferred

These are not early milestones:

- arbitrary ELF/native app loading,
- Linux compatibility,
- POSIX completeness,
- desktop shell,
- browser engine,
- Docker-like containers,
- high-bandwidth USB workloads.

The project should remain small enough that its resource behavior can be understood.
