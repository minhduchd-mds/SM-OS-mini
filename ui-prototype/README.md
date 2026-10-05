# SM-OS Mini UI Prototype

Prototype giao diện điều hành S3Core trước khi đưa UI vào firmware thật.

## Mục tiêu

- Review information architecture trước khi code LVGL/Web runtime.
- Kiểm tra Project Manager, Resource Manager và USB/Storage flows.
- Không phụ thuộc framework hoặc CDN.
- Icon dùng SVG sprite nội bộ.
- Chạy được bằng cách mở `index.html` hoặc qua HTTP server cục bộ.

## Chạy local

```bash
cd ui-prototype
python3 -m http.server 8080
```

Mở:

```text
http://localhost:8080
```

## Màn hình hiện có

- Dashboard
- Project Manager
- Hardware / Pin Map
- USB Hub
- Storage / VFS
- Terminal
- Settings / Recovery

## Interaction prototype

- Start/Stop project.
- Tạo project demo.
- Lọc và tìm GPIO.
- Pin Inspector.
- Terminal commands: `help`, `system info`, `mem`, `usb tree`, `resource list`, `project list`.
- Responsive desktop/mobile.

## Lưu ý

Các số liệu runtime trên giao diện là dữ liệu prototype. Hardware capability/pin reservation cuối cùng phải lấy từ Board Profile thực tế của SM-OS Mini.
