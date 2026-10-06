# SM-OS Mini security baseline

SM-OS Mini separates the normal development image from an explicit production-security profile.

## Trust boundary

The trusted computing base is limited to the ESP-IDF boot chain, SM-OS core/HAL, resource broker, project supervisor and provisioning logic. Future dynamically loaded projects or scripts must not receive raw peripheral authority by default.

## Production device lifecycle

1. Build and test the ordinary development image first.
2. Generate and custody the Secure Boot signing key outside the repository.
3. Provision a dedicated manufacturing/test device before enabling irreversible eFuse-backed features.
4. Build with `sdkconfig.defaults;sdkconfig.production.defaults`.
5. Verify signed boot, flash encryption, OTA rollback and recovery on sacrificial hardware.
6. Only then provision production devices.
7. Increment the application security version only when an older signed image must be revoked.

## Required controls

- Secure Boot V2 for authenticated boot.
- Flash Encryption in Release mode for production.
- Signed application images.
- OTA rollback with explicit application confirmation.
- Anti-rollback using the ESP-IDF application security version.
- No private signing keys or production credentials in Git.
- Separate device identity/provisioning material from project configuration.
- Resource ownership must fail closed: a project receives only declared GPIO/bus/device capabilities.
- Crash cleanup must invalidate stale resource handles before a project can restart.

## Recovery rule

Security hardening is incomplete until a device can recover from an interrupted or invalid OTA update without accepting an older revoked image.

## Development warning

Do not enable the production profile on a developer board casually. Secure Boot and Flash Encryption can permanently modify eFuses and change reflashing/debug behavior.
