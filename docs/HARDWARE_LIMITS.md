# Hardware Limits and Design Constraints

SM-OS Mini is built around physical limits, not around an assumption of unlimited compute.

## Primary target

Initial reference platform:

- ESP32-S3
- dual-core Xtensa LX7
- recommended 16 MB flash
- recommended 8 MB PSRAM
- native USB OTG
- optional microSD
- optional W5500 Ethernet
- GPIO / I2C / SPI / UART expansion

Exact pin availability depends on the board/module variant.

## Internal SRAM is the critical resource

External PSRAM is useful, but it does not replace internal SRAM for every workload.

Reserve internal-capable memory for:

- kernel-critical data,
- interrupts,
- DMA where required,
- USB-critical paths,
- selected network buffers,
- scheduler structures.

Prefer PSRAM for:

- large non-critical buffers,
- UI assets,
- caches,
- history,
- optional script heaps.

## USB constraints

ESP32-S3 native USB OTG is Full-Speed.

A USB hub increases the number of attachable devices, **not** the upstream bandwidth.

Therefore SM-OS Mini targets low/medium-bandwidth device classes first:

- HID,
- MSC,
- CDC,
- serial adapters,
- GNSS,
- control devices.

High-bandwidth camera, SDR, SSD, and multi-stream audio workloads are not primary targets.

## Pin constraints

A GPIO cannot be labeled merely "free" without board context.

The pin database must eventually account for:

- USB pins,
- flash/PSRAM-connected pins,
- boot/strapping behavior,
- input-only/output capabilities where applicable,
- ADC conflicts,
- reserved board peripherals,
- current resource owner.

## Bus sharing

I2C may support multiple addresses on one shared bus.

SPI can share clock/data lines while using independent chip-select ownership.

The resource model must represent buses separately from pins.

## Power is outside software abstraction

SM-OS cannot make an unsafe power design safe.

External USB hubs and higher-current peripherals require proper power architecture.

Projects must document:

- voltage,
- expected current,
- logic level,
- power source,
- whether hot-plug is supported.

## Baseline measurement policy

Before enabling a new subsystem, record:

- firmware size,
- free heap after boot,
- minimum free heap,
- task count,
- per-task stack watermark when available,
- static/internal memory impact,
- PSRAM impact,
- idle CPU behavior.

Features should be judged by both capability and resource cost.
