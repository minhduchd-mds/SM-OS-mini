# SM-OS Mini

> **A lightweight programmable hardware operating system research project for ESP32-S3 and other memory-constrained embedded devices.**

**SM-OS Mini** is an experimental embedded operating-system layer designed for small devices with limited RAM, flash, CPU time, power, and I/O resources.

The project explores one core question:

> **How far can we push a low-memory microcontroller toward a programmable, modular device platform without turning it into an oversized “mini Linux”?**

The current primary target is **ESP32-S3**, especially boards with external PSRAM and USB OTG support.

---

## Project status

**Stage:** Early research / architecture / bootstrapping  
**Target:** ESP32-S3  
**Recommended baseline:** ESP32-S3 N16R8  
**Framework:** ESP-IDF + FreeRTOS  
**License:** Not selected yet

This repository intentionally starts small. The first goal is to validate architecture, resource ownership, device lifecycle, recovery, and memory behavior before adding scripting, rich UI, or dynamic application loading.

---

# Why this project exists

Most microcontroller projects are built as one monolithic firmware:

```text
Application
    ↓
ESP-IDF / Arduino
    ↓
Hardware
```

That works well for a single-purpose device, but becomes difficult when one board must support:

- multiple independent projects,
- removable USB devices,
- external storage,
- different sensors,
- GPIO assignments that change over time,
- shared SPI / I2C / UART buses,
- project auto-start,
- live hardware reconfiguration,
- logging and diagnostics,
- safe recovery after project failures.

SM-OS Mini investigates a different model:

```text
Hardware
   ↓
ESP-IDF / FreeRTOS
   ↓
SM-OS HAL
   ↓
Device + Resource Manager
   ↓
Project Runtime
   ↓
Projects / Services / UI
```

Instead of rebuilding the entire firmware every time a peripheral changes, the long-term goal is to let the system understand available hardware resources and safely assign them to projects.

---

# Core idea

SM-OS Mini treats the ESP32-S3 as a small programmable motherboard.

```text
ESP32-S3
│
├── GPIO
├── I2C
├── SPI
├── UART
├── ADC
├── USB Host
├── Wi-Fi
├── Ethernet
├── SD Card
└── External devices
```

The operating layer is responsible for:

- discovering devices,
- tracking available pins and buses,
- reserving resources,
- preventing conflicts,
- starting and stopping projects,
- supervising project health,
- exposing a stable hardware API,
- preserving the OS when one project fails.

Long-term interaction model:

```text
Connect hardware
      ↓
SM-OS detects / identifies it
      ↓
Choose available resources
      ↓
Assign a project
      ↓
Configure
      ↓
Run
      ↓
Optional Auto Start
```

---

# Design philosophy

## 1. Low memory first

SM-OS Mini is not designed for desktop-class hardware.

Every subsystem should be evaluated against:

- internal SRAM usage,
- PSRAM usage,
- stack size,
- heap fragmentation,
- flash footprint,
- task count,
- scheduler overhead,
- interrupt latency,
- power usage.

A feature that works but consumes uncontrolled memory is considered incomplete.

---

## 2. Do not rebuild what ESP-IDF already solves

SM-OS Mini will use ESP-IDF for low-level platform capabilities such as:

- FreeRTOS,
- Wi-Fi,
- Bluetooth when required,
- USB Host,
- SPI / I2C / UART,
- SDMMC,
- FATFS / LittleFS,
- NVS,
- OTA,
- watchdogs,
- secure boot and flash security where applicable.

SM-OS Mini is primarily a **resource, device, project, and system-management layer** above ESP-IDF.

---

## 3. Hardware resources always have an owner

GPIOs and peripherals cannot be treated as globally available mutable state.

Example:

```text
GPIO 4
State : CLAIMED
Owner : project.sensor.temperature
Mode  : INPUT
```

A second project requesting GPIO 4 must be rejected or explicitly resolve the conflict.

This applies to:

- GPIO,
- SPI controllers,
- SPI chip-select pins,
- I2C buses and addresses,
- UART instances,
- ADC channels,
- USB devices,
- storage mounts,
- timers,
- shared services.

---

## 4. Projects do not directly own ESP-IDF

Application code should eventually depend on SM-OS APIs rather than directly coupling itself to ESP-IDF internals.

Desired model:

```text
Project
  ↓
SM-OS API
  ↓
HAL / Resource Manager
  ↓
ESP-IDF
  ↓
Hardware
```

This reduces breakage when ESP-IDF changes and gives SM-OS a place to enforce permissions and ownership.

---

## 5. The OS must survive project failure

A user project should never be allowed to become the system.

Long-term supervision goals include:

- project watchdog,
- stack monitoring,
- heap monitoring,
- restart counters,
- resource cleanup,
- crash logs,
- safe restart,
- boot-loop prevention.

---

## 6. Native dynamic binaries are not a V0 goal

Loading arbitrary native `.bin` or ELF applications sounds attractive but introduces:

- ABI compatibility problems,
- symbol relocation,
- memory corruption risks,
- interrupt ownership problems,
- dependency management,
- security problems,
- limited crash isolation on ESP32-S3.

Initial versions will prefer:

1. static native components,
2. dynamic configuration,
3. event-driven modules,
4. later evaluation of sandboxed scripting / WASM.

---

# Research targets

## Resource Manager

Tracks hardware resources:

```text
FREE
CLAIMED
SHARED
RESERVED
ERROR
```

It must understand not just GPIO numbers, but board-specific restrictions and peripheral ownership.

## Pin Manager

Example future state:

```text
GPIO 4   FREE
GPIO 5   Project: RF Monitor
GPIO 8   I2C SDA / SHARED
GPIO 9   I2C SCL / SHARED
GPIO 10  SPI CS / Storage
GPIO 19  USB D- / RESERVED
GPIO 20  USB D+ / RESERVED
```

The UI should recommend safe pins instead of allowing arbitrary assignments without validation.

## Bus Manager

Shared buses require different rules from individual GPIOs.

```text
I2C0
├── SDA GPIO8
├── SCL GPIO9
├── 0x68 RTC
└── 0x76 Environmental Sensor
```

```text
SPI2
├── MOSI GPIO11
├── MISO GPIO13
├── SCLK GPIO12
├── CS10 External Flash
└── CS14 Display
```

## Project Supervisor

Future projects should expose lifecycle operations:

```text
Install
Start
Stop
Restart
Enable Auto Start
Disable Auto Start
View Logs
View Resources
Remove
```

The supervisor will eventually monitor task state, CPU use, stack watermark, memory use, restart count, and watchdog state.

## Event Bus

The platform should prefer events over continuous polling.

Possible events:

```text
SYSTEM_READY
GPIO_CHANGED
USB_CONNECTED
USB_REMOVED
STORAGE_MOUNTED
STORAGE_REMOVED
NETWORK_UP
NETWORK_DOWN
TIMER
LOW_MEMORY
PROJECT_CRASHED
```

## USB Host + Hub

USB is one of the major research areas for ESP32-S3.

Target device classes may include HID, MSC, CDC, serial adapters, GNSS, and selected low-bandwidth peripherals.

The system must support device removal without crashing dependent projects.

> ESP32-S3 USB OTG is USB Full-Speed. A hub does **not** increase upstream bandwidth. All attached devices share the available USB link.

High-bandwidth USB workloads are outside the primary target.

---

# Memory strategy

Memory behavior is a first-class design constraint.

## Internal SRAM

Prefer internal SRAM for:

- kernel state,
- interrupt-related data,
- DMA-capable buffers where required,
- USB-critical buffers,
- network-critical buffers,
- scheduler structures,
- small fixed pools.

## PSRAM

Prefer PSRAM for:

- UI assets,
- history,
- large non-critical buffers,
- caches,
- decoded data,
- optional scripting heap.

PSRAM must not be treated as an unlimited replacement for internal SRAM.

## Allocation rules

Core services should prefer:

- static allocation,
- fixed-size pools,
- ring buffers,
- bounded queues,
- preallocated objects.

Avoid uncontrolled allocation in interrupt, USB-event, high-frequency GPIO, and supervisor paths.

---

# Proposed architecture

```text
┌───────────────────────────────────────┐
│               UI LAYER                │
│ LCD / Web UI / CLI / Remote API       │
├───────────────────────────────────────┤
│             COMMAND BUS               │
├───────────────────────────────────────┤
│          PROJECT SUPERVISOR           │
│ Project A | Project B | Project C     │
├───────────────────────────────────────┤
│            SM-OS RUNTIME API          │
├───────────────────────────────────────┤
│            RESOURCE MANAGER           │
│ GPIO | SPI | I2C | UART | USB | ADC  │
├───────────────────────────────────────┤
│             DEVICE MANAGER            │
├───────────────────────────────────────┤
│                SM-OS HAL              │
├───────────────────────────────────────┤
│          ESP-IDF / FreeRTOS           │
├───────────────────────────────────────┤
│              ESP32-S3                 │
└───────────────────────────────────────┘
```

---

# Proposed boot flow

```text
Power On
   ↓
ROM
   ↓
Bootloader
   ↓
SM-OS Core
   ↓
Memory Manager
   ↓
Resource Manager
   ↓
Device Manager
   ↓
Storage
   ↓
USB / Network
   ↓
Project Supervisor
   ↓
Auto-start eligible projects
   ↓
UI / CLI
```

---

# Safe mode

Safe mode is considered a core feature, not an optional enhancement.

```text
Repeated boot failures
        ↓
Enter SAFE MODE
        ↓
Disable user auto-start projects
        ↓
Start minimal services
        ↓
Expose diagnostics
```

The system should remain recoverable even when a project or optional driver is broken.

---

# Initial hardware target

Recommended development baseline:

```text
ESP32-S3-WROOM
├── CPU       Dual-core LX7
├── Flash     16 MB
├── PSRAM      8 MB
├── USB       Native USB OTG
├── Storage   microSD optional
├── Network   Wi-Fi / optional W5500
└── Expansion GPIO / I2C / SPI / UART
```

A powered USB hub may be used for removable devices. USB peripherals must not be powered through an unsafe 3.3 V path.

---

# What SM-OS Mini is not

SM-OS Mini is **not** intended to become:

- a desktop operating system,
- Linux compatibility on ESP32,
- a browser-based desktop environment,
- a general-purpose POSIX replacement,
- an Electron/Node.js runtime,
- a Docker-equivalent container platform,
- a way to bypass electrical or hardware limits.

The project is intentionally specialized.

---

# Reference projects

The architecture study is influenced by lessons from:

- **ESP-IDF** — platform drivers, FreeRTOS, networking, OTA and security.
- **Toit / Jaguar** — application lifecycle and hot deployment ideas.
- **Flipper Zero / Furi** — hardware abstraction, application manifests and system services.
- **Zephyr** — device models and resource discipline.
- **Apache NuttX** — VFS, device abstraction and embedded OS structure.
- **Moddable SDK** — lightweight scripting and embedded UI concepts.

SM-OS Mini does not aim to clone any of them. The research goal is to combine useful embedded patterns around a hardware-resource-centric programming model.

---

# Development principles

Every major feature should answer:

1. How much internal SRAM does it use?
2. How much PSRAM does it use?
3. What is its worst-case stack requirement?
4. Does it allocate memory dynamically?
5. Can it fail without taking down the OS?
6. What resources does it own?
7. Are resources released after stop/crash?
8. Can the feature be disabled at build time?
9. Does it work without UI?
10. What happens when its hardware disappears?

---

# Roadmap

## V0.1 — Core foundation

- ESP-IDF project skeleton
- system boot
- board profile
- resource registry
- GPIO ownership prototype
- static project registry
- diagnostics CLI
- memory metrics
- watchdog baseline

## V0.2 — Device layer

- Pin Manager
- I2C resource manager
- SPI resource manager
- UART resource manager
- device registry
- resource conflict detection

## V0.3 — Project runtime

- project manifest model
- start / stop / restart
- auto-start
- dependency checks
- cleanup on stop
- crash supervision

## V0.4 — Storage + USB

- VFS conventions
- SD storage
- USB Host
- hub enumeration
- MSC
- CDC
- HID experiments
- hot-remove safety

## V0.5 — Control surfaces

- CLI
- Web UI
- optional LCD UI
- hardware map
- resource inspector
- project manager UI

## Later research

- OTA A/B + recovery
- signed project packages
- sandboxed scripting
- Lua / JavaScript evaluation
- WebAssembly feasibility
- remote management
- low-power profiles
- multiple board profiles

---

# Repository structure

```text
SM-OS-mini/
├── README.md
├── CMakeLists.txt
├── sdkconfig.defaults
├── main/
│   ├── CMakeLists.txt
│   └── main.c
└── docs/
    ├── ARCHITECTURE.md
    ├── HARDWARE_LIMITS.md
    └── ROADMAP.md
```

As the project grows:

```text
components/
├── sm_core/
├── sm_hal/
├── sm_resource/
├── sm_device/
├── sm_project/
├── sm_event/
├── sm_storage/
└── sm_usb/
```

---

# Research rule

> **Do not add a feature only because it is possible. Add it when its resource cost, failure behavior, and ownership model are understood.**

This project values predictable behavior over feature count.

---

# Long-term vision

```text
Connect module
      ↓
Detect capability
      ↓
Inspect available pins / buses
      ↓
Assign project
      ↓
Configure
      ↓
Run
      ↓
Observe
      ↓
Auto-start when stable
```

The goal is not to make ESP32-S3 pretend to be a PC.

The goal is to make a constrained embedded device **far easier to extend, inspect, program, and recover** while respecting its physical limits.

---

## Naming

Repository: **SM-OS Mini**  
Working architecture name: **S3Core**

Suggested one-line description:

> **SM-OS Mini — a low-memory programmable hardware OS research platform for ESP32-S3.**
