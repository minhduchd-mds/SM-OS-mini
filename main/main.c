#include <inttypes.h>
#include <stddef.h>

#include "esp_log.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "sm_board_profile.h"
#include "sm_resource.h"

static const char *TAG = "sm_os";
static sm_resource_registry_t g_resources;

static void log_resource_baseline(const sm_board_profile_t *board)
{
    size_t free_count = 0;
    size_t caution_count = 0;
    size_t reserved_count = 0;

    for (uint8_t gpio = 0; gpio < SM_GPIO_COUNT; ++gpio) {
        const sm_gpio_resource_t *resource = sm_gpio_get(&g_resources, gpio);
        if (resource == NULL) {
            continue;
        }

        if (resource->state == SM_RESOURCE_RESERVED) {
            reserved_count++;
        } else {
            free_count++;
            if (resource->safety == SM_PIN_SAFETY_CAUTION) {
                caution_count++;
            }
        }
    }

    ESP_LOGI(TAG, "Board: %s", board->display_name);
    ESP_LOGI(TAG, "Memory profile: flash=%" PRIu32 "MB psram=%" PRIu32 "MB",
             board->flash_mb, board->psram_mb);
    ESP_LOGI(TAG,
             "GPIO registry: free=%u caution=%u reserved=%u total=%u",
             (unsigned)free_count,
             (unsigned)caution_count,
             (unsigned)reserved_count,
             (unsigned)SM_GPIO_COUNT);

    const sm_gpio_resource_t *usb_dm = sm_gpio_get(&g_resources, 19);
    const sm_gpio_resource_t *octal = sm_gpio_get(&g_resources, 35);

    ESP_LOGI(TAG, "GPIO19: %s (%s)",
             sm_resource_state_name(usb_dm->state), usb_dm->policy_reason);
    ESP_LOGI(TAG, "GPIO35: %s (%s)",
             sm_resource_state_name(octal->state), octal->policy_reason);
}

void app_main(void)
{
    ESP_LOGI(TAG, "SM-OS Mini boot");
    ESP_LOGI(TAG, "Stage: V0.1 resource manager");

    const sm_board_profile_t *board = sm_board_profile_esp32s3_n16r8();
    const sm_status_t status = sm_resource_registry_init(&g_resources, board);

    if (status != SM_OK) {
        ESP_LOGE(TAG, "Resource registry init failed: %s", sm_status_name(status));
        return;
    }

    log_resource_baseline(board);

    ESP_LOGI(TAG, "Free heap: %" PRIu32 " bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "Minimum free heap since boot: %" PRIu32 " bytes",
             esp_get_minimum_free_heap_size());

    for (;;) {
        ESP_LOGI(TAG,
                 "heartbeat | free_heap=%" PRIu32 " | gpio_claimed=%u",
                 esp_get_free_heap_size(),
                 (unsigned)sm_gpio_claimed_count(&g_resources));
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}
