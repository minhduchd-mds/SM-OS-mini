# CI/CD

SM-OS Mini builds firmware automatically with GitHub Actions.

## CI

Every push to `main` runs:

1. Checkout source.
2. Install the pinned ESP-IDF version.
3. Set the target to `esp32s3`.
4. Reconfigure from `sdkconfig.defaults`.
5. Build the firmware.
6. Print total and per-component size reports.
7. Package the flashable binaries.
8. Generate SHA-256 checksums.
9. Upload the firmware bundle as a workflow artifact.

The current pinned toolchain is:

```text
ESP-IDF v6.0.3
Target: esp32s3
```

## Build artifact

Successful builds publish an artifact named:

```text
sm-os-mini-esp32s3
```

It contains:

```text
sm_os_mini.bin
bootloader.bin
partition-table.bin
flash_args
sdkconfig
BUILD_INFO.txt
SHA256SUMS.txt
```

Artifacts are retained for 30 days.

## CD / tagged releases

Push a semantic version tag such as:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow will:

1. rebuild the firmware from the tagged commit,
2. verify the build succeeds,
3. download the build artifact,
4. create a GitHub Release if one does not already exist,
5. attach all firmware files and checksums to that release.

## Hardware deployment

Cloud CI does **not** directly flash a physical ESP32-S3 yet.

That step will be introduced only when one of these deployment paths is available:

- a trusted self-hosted GitHub runner physically connected to the board, or
- a signed OTA endpoint implemented by SM-OS Mini.

This prevents CI from pretending to provide hardware validation when no real board is attached.

## Future pipeline stages

Planned additions:

- resource-registry unit tests,
- GPIO ownership conflict tests,
- host-side component tests,
- firmware-size budget gates,
- static analysis,
- hardware-in-the-loop tests,
- signed release artifacts,
- OTA staging and rollback validation.
