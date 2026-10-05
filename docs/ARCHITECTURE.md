# SM-OS Mini Architecture

## Purpose

This document defines the architectural boundaries for SM-OS Mini before feature growth begins.

The project is intentionally **not** a desktop-style operating system. It is a small programmable hardware platform for resource-constrained microcontrollers.

## Layer model

```text
UI / CLI / Remote Control
          │
      Command Bus
          │
  Project Supervisor
          │
    SM-OS Runtime API
          │
    Resource Manager
          │
     Device Manager
          │
        SM-OS HAL
          │
   ESP-IDF / FreeRTOS
          │
       ESP32-S3
```

## Architectural invariants

### 1. Resource ownership is explicit

No project may silently take over a GPIO, bus, timer, mount, or USB device.

Every claim has:

- resource type,
- identifier,
- owner,
- state,
- sharing policy,
- release lifecycle.

### 2. UI never talks directly to drivers

The UI emits commands.

```text
UI
 ↓
Command Bus
 ↓
System service
 ↓
Resource validation
 ↓
Driver
```

This allows LCD UI, Web UI, CLI, and remote APIs to share one control path.

### 3. Core services must not depend on rich UI

The OS must boot, diagnose, recover, and manage resources with no display attached.

### 4. Projects run below a supervisor

A project lifecycle is owned by the supervisor:

```text
REGISTERED
   ↓
STARTING
   ↓
RUNNING
   ↓
STOPPING
   ↓
STOPPED
```

Failure transitions must be observable and must trigger resource cleanup.

### 5. Hardware disappearance is normal

USB and removable storage are asynchronous.

A driver or project must tolerate:

- device connected,
- device disconnected,
- device reconnected,
- device replaced,
- partial I/O failure.

### 6. Memory use must be bounded

Core paths should prefer:

- static buffers,
- fixed pools,
- bounded queues,
- ring buffers,
- explicit stack budgets.

Dynamic allocation in hot paths requires justification and measurement.

## V0.1 boundary

V0.1 includes only:

- boot baseline,
- memory metrics,
- resource registry design,
- GPIO ownership prototype,
- static project registry,
- diagnostics.

V0.1 explicitly excludes:

- dynamic native binaries,
- scripting VM,
- full Web UI,
- USB class drivers,
- Wi-Fi application logic,
- package manager.

This keeps the first measurements trustworthy.

## Planned component boundaries

```text
components/
├── sm_core       Boot state, health, safe mode
├── sm_hal        Stable hardware-facing API
├── sm_resource   Ownership, claims, conflicts
├── sm_device     Device registry and lifecycle
├── sm_project    Project supervisor
├── sm_event      Bounded event transport
├── sm_storage    Mount lifecycle and VFS policy
└── sm_usb        USB host / hub policy
```

## Failure containment goal

ESP32-S3 does not provide desktop-process isolation. SM-OS therefore cannot promise that arbitrary native code can never corrupt the system.

The design goal is instead to:

- minimize privileged APIs,
- centralize resource ownership,
- supervise tasks,
- detect watchdog failures,
- clean resources after controlled failures,
- provide safe mode,
- preserve a recovery path.

Sandboxed code may be evaluated later for stronger isolation.
