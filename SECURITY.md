# Security Policy — SM-OS Mini

**Status:** Experimental ESP32-S3 runtime research; no production security certification or safety assurance is claimed.

## Supported scope

The latest default-branch source is the research baseline. Older snapshots, forks, unpublished hardware configurations and third-party firmware are not covered by a supported release program.

## Report responsibly

Please **do not disclose a working exploit or credentials in a public issue**. If GitHub's private vulnerability reporting is enabled for this repository, use **Security → Report a vulnerability**. Otherwise contact the maintainer privately via their GitHub profile before sharing reproducible technical details. No security response SLA is promised.

Include firmware commit, ESP-IDF version, board/flash/PSRAM model, affected physical interfaces, the minimum reproduction steps and likely impact. Remove Wi-Fi credentials, device identities and personal data.

## Security boundaries

- Device/USB/GPIO access remains a physical capability, not a sandbox guarantee.
- Do not assume add-on boards or untrusted USB devices are electrically safe.
- No arbitrary native third-party binary is declared safe to load.
- Signed OTA, secure boot, flash encryption and rollback must be proven on the actual target device before being described as enabled or qualified.
- Fail closed when resource ownership or device permissions cannot be verified.

## Before deployment

Reproduce the issue with pinned firmware and dependencies; run host tests and controlled physical bench tests. Do not connect experimental firmware to safety-critical equipment.
