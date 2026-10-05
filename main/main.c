#include <inttypes.h>

#include "esp_log.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "sm_os";

void app_main(void)
{
    ESP_LOGI(TAG, "SM-OS Mini boot");
    ESP_LOGI(TAG, "Stage: V0.1 research baseline");
    ESP_LOGI(TAG, "Free heap: %" PRIu32 " bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "Minimum free heap since boot: %" PRIu32 " bytes",
             esp_get_minimum_free_heap_size());

    for (;;) {
        ESP_LOGI(TAG, "heartbeat | free_heap=%" PRIu32,
                 esp_get_free_heap_size());
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}
