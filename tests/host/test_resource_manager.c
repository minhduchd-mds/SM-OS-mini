#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "sm_board_profile.h"
#include "sm_resource.h"

static void test_profile_policy(void)
{
    const sm_board_profile_t *board = sm_board_profile_esp32s3_n16r8();

    assert(board != NULL);
    assert(board->flash_mb == 16);
    assert(board->psram_mb == 8);

    assert(sm_board_pin(board, 19)->safety == SM_PIN_SAFETY_RESERVED);
    assert(sm_board_pin(board, 20)->safety == SM_PIN_SAFETY_RESERVED);
    assert(sm_board_pin(board, 35)->safety == SM_PIN_SAFETY_RESERVED);
    assert(sm_board_pin(board, 36)->safety == SM_PIN_SAFETY_RESERVED);
    assert(sm_board_pin(board, 37)->safety == SM_PIN_SAFETY_RESERVED);

    assert(sm_board_pin(board, 0)->safety == SM_PIN_SAFETY_CAUTION);
    assert(sm_board_pin(board, 45)->safety == SM_PIN_SAFETY_CAUTION);
    assert(sm_board_pin(board, 4)->safety == SM_PIN_SAFETY_SAFE);
}

static void test_claim_conflict_release(void)
{
    sm_resource_registry_t registry;
    const sm_board_profile_t *board = sm_board_profile_esp32s3_n16r8();

    assert(sm_resource_registry_init(&registry, board) == SM_OK);
    assert(sm_gpio_claimed_count(&registry) == 0);

    assert(sm_gpio_claim(&registry, 4, "project.alpha", "digital-output") == SM_OK);
    assert(sm_gpio_claimed_count(&registry) == 1);

    const sm_gpio_resource_t *gpio4 = sm_gpio_get(&registry, 4);
    assert(gpio4 != NULL);
    assert(gpio4->state == SM_RESOURCE_CLAIMED);
    assert(strcmp(gpio4->owner, "project.alpha") == 0);

    assert(sm_gpio_claim(&registry, 4, "project.beta", "digital-input") == SM_ERR_CONFLICT);
    assert(strcmp(sm_gpio_get(&registry, 4)->owner, "project.alpha") == 0);

    assert(sm_gpio_release(&registry, 4, "project.beta") == SM_ERR_NOT_OWNER);
    assert(sm_gpio_release(&registry, 4, "project.alpha") == SM_OK);
    assert(sm_gpio_get(&registry, 4)->state == SM_RESOURCE_FREE);
    assert(sm_gpio_claimed_count(&registry) == 0);
}

static void test_reserved_and_range_guard(void)
{
    sm_resource_registry_t registry;

    assert(sm_resource_registry_init(&registry, sm_board_profile_esp32s3_n16r8()) == SM_OK);

    assert(sm_gpio_claim(&registry, 19, "project.usb-conflict", "output") == SM_ERR_RESERVED);
    assert(sm_gpio_claim(&registry, 35, "project.psram-conflict", "output") == SM_ERR_RESERVED);
    assert(sm_gpio_claim(&registry, 60, "project.invalid", "output") == SM_ERR_OUT_OF_RANGE);
}

static void test_metadata_bounds(void)
{
    sm_resource_registry_t registry;
    char long_owner[SM_OWNER_MAX + 8];

    memset(long_owner, 'x', sizeof(long_owner));
    long_owner[sizeof(long_owner) - 1] = '\0';

    assert(sm_resource_registry_init(&registry, sm_board_profile_esp32s3_n16r8()) == SM_OK);
    assert(sm_gpio_claim(&registry, 4, long_owner, "output") == SM_ERR_INVALID_ARG);
    assert(sm_gpio_get(&registry, 4)->state == SM_RESOURCE_FREE);
}

static void test_same_owner_idempotent_update(void)
{
    sm_resource_registry_t registry;

    assert(sm_resource_registry_init(&registry, sm_board_profile_esp32s3_n16r8()) == SM_OK);

    assert(sm_gpio_claim(&registry, 5, "project.rf", "input") == SM_OK);
    assert(sm_gpio_claim(&registry, 5, "project.rf", "adc-input") == SM_OK);
    assert(sm_gpio_claimed_count(&registry) == 1);
    assert(strcmp(sm_gpio_get(&registry, 5)->role, "adc-input") == 0);
}

int main(void)
{
    test_profile_policy();
    test_claim_conflict_release();
    test_reserved_and_range_guard();
    test_metadata_bounds();
    test_same_owner_idempotent_update();

    puts("SM-OS host resource tests: PASS");
    return 0;
}
