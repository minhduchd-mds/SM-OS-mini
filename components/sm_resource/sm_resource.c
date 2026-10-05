#include "sm_resource.h"

#include <string.h>

static void copy_text(char *dst, size_t dst_size, const char *src)
{
    if (dst == NULL || dst_size == 0) {
        return;
    }

    if (src == NULL) {
        dst[0] = '\0';
        return;
    }

    size_t length = strlen(src);
    if (length >= dst_size) {
        length = dst_size - 1;
    }

    memcpy(dst, src, length);
    dst[length] = '\0';
}

sm_status_t sm_resource_registry_init(sm_resource_registry_t *registry,
                                      const sm_board_profile_t *board)
{
    if (registry == NULL || board == NULL || board->pins == NULL ||
        board->pin_count != SM_GPIO_COUNT) {
        return SM_ERR_INVALID_ARG;
    }

    memset(registry, 0, sizeof(*registry));
    registry->board = board;

    for (size_t i = 0; i < SM_GPIO_COUNT; ++i) {
        const sm_pin_profile_t *profile = &board->pins[i];
        sm_gpio_resource_t *resource = &registry->gpio[i];

        resource->gpio = profile->gpio;
        resource->safety = profile->safety;
        resource->capabilities = profile->capabilities;
        resource->policy_reason = profile->reason;

        if (profile->safety == SM_PIN_SAFETY_RESERVED) {
            resource->state = SM_RESOURCE_RESERVED;
            copy_text(resource->owner, sizeof(resource->owner), "system.board");
            copy_text(resource->role, sizeof(resource->role), profile->reason);
        } else {
            resource->state = SM_RESOURCE_FREE;
        }
    }

    return SM_OK;
}

sm_status_t sm_gpio_claim(sm_resource_registry_t *registry,
                          uint8_t gpio,
                          const char *owner,
                          const char *role)
{
    if (registry == NULL || owner == NULL || owner[0] == '\0') {
        return SM_ERR_INVALID_ARG;
    }

    if (gpio >= SM_GPIO_COUNT) {
        return SM_ERR_OUT_OF_RANGE;
    }

    sm_gpio_resource_t *resource = &registry->gpio[gpio];

    if (resource->state == SM_RESOURCE_RESERVED) {
        return SM_ERR_RESERVED;
    }

    if (resource->state == SM_RESOURCE_CLAIMED) {
        if (strncmp(resource->owner, owner, sizeof(resource->owner)) == 0) {
            copy_text(resource->role, sizeof(resource->role), role);
            return SM_OK;
        }
        return SM_ERR_CONFLICT;
    }

    resource->state = SM_RESOURCE_CLAIMED;
    copy_text(resource->owner, sizeof(resource->owner), owner);
    copy_text(resource->role, sizeof(resource->role), role);
    registry->claimed_count++;
    return SM_OK;
}

sm_status_t sm_gpio_release(sm_resource_registry_t *registry,
                            uint8_t gpio,
                            const char *owner)
{
    if (registry == NULL || owner == NULL || owner[0] == '\0') {
        return SM_ERR_INVALID_ARG;
    }

    if (gpio >= SM_GPIO_COUNT) {
        return SM_ERR_OUT_OF_RANGE;
    }

    sm_gpio_resource_t *resource = &registry->gpio[gpio];

    if (resource->state == SM_RESOURCE_RESERVED) {
        return SM_ERR_RESERVED;
    }

    if (resource->state == SM_RESOURCE_FREE) {
        return SM_OK;
    }

    if (strncmp(resource->owner, owner, sizeof(resource->owner)) != 0) {
        return SM_ERR_NOT_OWNER;
    }

    resource->state = SM_RESOURCE_FREE;
    resource->owner[0] = '\0';
    resource->role[0] = '\0';

    if (registry->claimed_count > 0) {
        registry->claimed_count--;
    }

    return SM_OK;
}

const sm_gpio_resource_t *sm_gpio_get(const sm_resource_registry_t *registry,
                                      uint8_t gpio)
{
    if (registry == NULL || gpio >= SM_GPIO_COUNT) {
        return NULL;
    }
    return &registry->gpio[gpio];
}

size_t sm_gpio_claimed_count(const sm_resource_registry_t *registry)
{
    return registry == NULL ? 0 : registry->claimed_count;
}

const char *sm_status_name(sm_status_t status)
{
    switch (status) {
    case SM_OK: return "ok";
    case SM_ERR_INVALID_ARG: return "invalid-arg";
    case SM_ERR_OUT_OF_RANGE: return "out-of-range";
    case SM_ERR_RESERVED: return "reserved";
    case SM_ERR_CONFLICT: return "conflict";
    case SM_ERR_NOT_OWNER: return "not-owner";
    default: return "unknown";
    }
}

const char *sm_resource_state_name(sm_resource_state_t state)
{
    switch (state) {
    case SM_RESOURCE_FREE: return "free";
    case SM_RESOURCE_CLAIMED: return "claimed";
    case SM_RESOURCE_RESERVED: return "reserved";
    default: return "unknown";
    }
}
