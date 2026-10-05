#include "sm_board_profile.h"

#define GPIO_CAPS (SM_PIN_CAP_GPIO | SM_PIN_CAP_I2C | SM_PIN_CAP_SPI | SM_PIN_CAP_UART)
#define ADC_CAPS  (GPIO_CAPS | SM_PIN_CAP_ADC)
#define TOUCH_CAPS (ADC_CAPS | SM_PIN_CAP_TOUCH)

static const sm_pin_profile_t k_pins[SM_GPIO_COUNT] = {
    [0]  = {0,  TOUCH_CAPS, SM_PIN_SAFETY_CAUTION,  "boot/strapping-sensitive"},
    [1]  = {1,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [2]  = {2,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [3]  = {3,  TOUCH_CAPS, SM_PIN_SAFETY_CAUTION,  "boot/strapping-sensitive"},
    [4]  = {4,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [5]  = {5,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [6]  = {6,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [7]  = {7,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [8]  = {8,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [9]  = {9,  TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [10] = {10, TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [11] = {11, TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [12] = {12, TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [13] = {13, TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [14] = {14, TOUCH_CAPS, SM_PIN_SAFETY_SAFE,     ""},
    [15] = {15, ADC_CAPS,   SM_PIN_SAFETY_SAFE,     ""},
    [16] = {16, ADC_CAPS,   SM_PIN_SAFETY_SAFE,     ""},
    [17] = {17, ADC_CAPS,   SM_PIN_SAFETY_SAFE,     ""},
    [18] = {18, ADC_CAPS,   SM_PIN_SAFETY_SAFE,     ""},
    [19] = {19, SM_PIN_CAP_GPIO | SM_PIN_CAP_USB, SM_PIN_SAFETY_RESERVED, "native USB D-"},
    [20] = {20, SM_PIN_CAP_GPIO | SM_PIN_CAP_USB, SM_PIN_SAFETY_RESERVED, "native USB D+"},
    [21] = {21, GPIO_CAPS,  SM_PIN_SAFETY_SAFE,     ""},
    [22] = {22, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [23] = {23, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [24] = {24, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [25] = {25, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [26] = {26, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [27] = {27, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [28] = {28, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [29] = {29, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [30] = {30, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [31] = {31, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [32] = {32, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [33] = {33, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [34] = {34, SM_PIN_CAP_GPIO, SM_PIN_SAFETY_RESERVED, "not exposed on WROOM-1"},
    [35] = {35, SM_PIN_CAP_GPIO | SM_PIN_CAP_SPI, SM_PIN_SAFETY_RESERVED, "Octal flash/PSRAM internal bus"},
    [36] = {36, SM_PIN_CAP_GPIO | SM_PIN_CAP_SPI, SM_PIN_SAFETY_RESERVED, "Octal flash/PSRAM internal bus"},
    [37] = {37, SM_PIN_CAP_GPIO | SM_PIN_CAP_SPI, SM_PIN_SAFETY_RESERVED, "Octal flash/PSRAM internal bus"},
    [38] = {38, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
    [39] = {39, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
    [40] = {40, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
    [41] = {41, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
    [42] = {42, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
    [43] = {43, SM_PIN_CAP_GPIO | SM_PIN_CAP_UART, SM_PIN_SAFETY_CAUTION, "default UART0 TX"},
    [44] = {44, SM_PIN_CAP_GPIO | SM_PIN_CAP_UART, SM_PIN_SAFETY_CAUTION, "default UART0 RX"},
    [45] = {45, GPIO_CAPS, SM_PIN_SAFETY_CAUTION, "boot/strapping-sensitive"},
    [46] = {46, GPIO_CAPS, SM_PIN_SAFETY_CAUTION, "boot/strapping-sensitive"},
    [47] = {47, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
    [48] = {48, GPIO_CAPS, SM_PIN_SAFETY_SAFE, ""},
};

static const sm_board_profile_t k_profile = {
    .board_id = "esp32s3-wroom1-n16r8",
    .display_name = "ESP32-S3 WROOM-1 N16R8",
    .module = "ESP32-S3-WROOM-1",
    .flash_mb = 16,
    .psram_mb = 8,
    .native_usb_reserved = true,
    .pins = k_pins,
    .pin_count = SM_GPIO_COUNT,
};

const sm_board_profile_t *sm_board_profile_esp32s3_n16r8(void)
{
    return &k_profile;
}

const sm_pin_profile_t *sm_board_pin(const sm_board_profile_t *profile, uint8_t gpio)
{
    if (profile == NULL || gpio >= profile->pin_count) {
        return NULL;
    }
    return &profile->pins[gpio];
}

const char *sm_pin_safety_name(sm_pin_safety_t safety)
{
    switch (safety) {
    case SM_PIN_SAFETY_SAFE: return "safe";
    case SM_PIN_SAFETY_CAUTION: return "caution";
    case SM_PIN_SAFETY_RESERVED: return "reserved";
    default: return "unknown";
    }
}
