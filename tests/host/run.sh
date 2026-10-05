#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
OUT="${TMPDIR:-/tmp}/sm-os-resource-tests"

cc -std=c11 -Wall -Wextra -Werror -pedantic \
  -I"$ROOT/components/sm_board/include" \
  -I"$ROOT/components/sm_resource/include" \
  "$ROOT/components/sm_board/sm_board_profile.c" \
  "$ROOT/components/sm_resource/sm_resource.c" \
  "$ROOT/tests/host/test_resource_manager.c" \
  -o "$OUT"

"$OUT"
rm -f "$OUT"
