#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define SM_GPIO_COUNT 49

typedef enum {
    SM_PIN_SAFETY_SAFE = 0,
    SM_PIN_SAFETY_CAUTION,
    SM_PIN_SAFETY_RESERVED,
} sm_pin_safety_t;

typedef enum {
    SM_PIN_CAP_GPIO = 1u << 0,
    SM_PIN_CAP_ADC = 1u << 1,
    SM_PIN_CAP_TOUCH = 1u << 2,
    SM_PIN_CAP_USB = 1u << 3,
    SM_PIN_CAP_UART = 1u << 4,
    SM_PIN_CAP_SPI = 1u << 5,
    SM_PIN_CAP_I2C = 1u << 6,
} sm_pin_capability_t;

typedef struct {
    uint8_t gpio;
    uint32_t capabilities;
    sm_pin_safety_t safety;
    const char *reason;
} sm_pin_profile_t;

typedef struct {
    const char *board_id;
    const char *display_name;
    const char *module;
    uint32_t flash_mb;
    uint32_t psram_mb;
    bool native_usb_reserved;
    const sm_pin_profile_t *pins;
    size_t pin_count;
} sm_board_profile_t;

const sm_board_profile_t *sm_board_profile_esp32s3_n16r8(void);
const sm_pin_profile_t *sm_board_pin(const sm_board_profile_t *profile, uint8_t gpio);
const char *sm_pin_safety_name(sm_pin_safety_t safety);

#ifdef __cplusplus
}
#endif
