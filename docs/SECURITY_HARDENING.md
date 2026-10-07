# SM-OS Mini Security Hardening

## Scope

The default development build must remain safe to flash repeatedly on lab boards. Production security settings that can change ESP32-S3 eFuses are intentionally **not enabled by default**.

## Production security model

A production device profile should be provisioned through a separate manufacturing process and should evaluate:

- Secure Boot v2 for authenticated boot
- flash encryption in release mode for off-chip flash confidentiality
- signed OTA images
- OTA rollback plus anti-rollback security versions
- restricted UART download/JTAG policy
- protected device identity and per-device credentials
- encrypted storage for sensitive NVS partitions
- watchdog and safe-mode recovery that does not bypass signature checks

## Safety rule

Do not enable irreversible eFuse-backed security settings from the normal developer CI artifact. Provisioning must be an explicit physical manufacturing step with a recovery/test fixture and a recorded device state.

## Build profiles

Keep three conceptual profiles:

- **development** — current default, repeatable flashing and diagnostics
- **qualification** — production-like policy without irreversible automatic provisioning
- **production** — signed artifacts for already-reviewed/provisioned hardware

The production signing material must live outside the repository and outside normal build artifacts.

## OTA release requirements

Before production OTA is considered complete, the runtime needs:

1. A/B OTA partitions.
2. Boot confirmation and automatic rollback for an unhealthy new image.
3. Monotonic security version policy for vulnerability-driven anti-rollback.
4. Signed image verification before activation.
5. Power-loss tests at every update phase.
6. Recovery-mode behavior that remains authenticated.

## Runtime isolation requirements

Security is also a resource-ownership problem. User projects must not receive direct unrestricted access to ESP-IDF internals. Project runtime APIs should use capability handles issued by the Resource Broker, with explicit ownership, generation IDs and cleanup after stop/crash.

## Evidence

A release should record at least:

- source commit
- ESP-IDF version
- board profile
- partition-table hash
- firmware hash
- security profile identifier
- resource/memory budget report
- test result summary


## Configuration qualification in CI

A separate required job runs ESP-IDF reconfigure for ESP32-S3 with both developer
and production defaults in an isolated sdkconfig and build directory. It checks
the effective Secure Boot v2, signing, release-mode flash encryption, rollback,
anti-rollback and security version settings, so ignored or incompatible defaults
cannot pass by appearing only in the source file. This gate does not build or
publish production firmware, generate signing keys, flash devices or burn eFuses.
It proves configuration resolution, not physical provisioning or OTA recovery.
