#pragma once

#include <stddef.h>
#include <stdint.h>

#include "sm_board_profile.h"

#ifdef __cplusplus
extern "C" {
#endif

#define SM_OWNER_MAX 32
#define SM_ROLE_MAX 24

typedef enum {
    SM_OK = 0,
    SM_ERR_INVALID_ARG = -1,
    SM_ERR_OUT_OF_RANGE = -2,
    SM_ERR_RESERVED = -3,
    SM_ERR_CONFLICT = -4,
    SM_ERR_NOT_OWNER = -5,
} sm_status_t;

typedef enum {
    SM_RESOURCE_FREE = 0,
    SM_RESOURCE_CLAIMED,
    SM_RESOURCE_RESERVED,
} sm_resource_state_t;

typedef struct {
    uint8_t gpio;
    sm_resource_state_t state;
    sm_pin_safety_t safety;
    uint32_t capabilities;
    char owner[SM_OWNER_MAX];
    char role[SM_ROLE_MAX];
    const char *policy_reason;
} sm_gpio_resource_t;

typedef struct {
    const sm_board_profile_t *board;
    sm_gpio_resource_t gpio[SM_GPIO_COUNT];
    size_t claimed_count;
} sm_resource_registry_t;

sm_status_t sm_resource_registry_init(sm_resource_registry_t *registry,
                                      const sm_board_profile_t *board);

sm_status_t sm_gpio_claim(sm_resource_registry_t *registry,
                          uint8_t gpio,
                          const char *owner,
                          const char *role);

sm_status_t sm_gpio_release(sm_resource_registry_t *registry,
                            uint8_t gpio,
                            const char *owner);

const sm_gpio_resource_t *sm_gpio_get(const sm_resource_registry_t *registry,
                                      uint8_t gpio);

size_t sm_gpio_claimed_count(const sm_resource_registry_t *registry);
const char *sm_status_name(sm_status_t status);
const char *sm_resource_state_name(sm_resource_state_t state);

#ifdef __cplusplus
}
#endif
