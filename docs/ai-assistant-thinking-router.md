# AI Assistant Thinking Router

## Feature overview
- AI Assistant duoc tach thanh 2 mode ro rang trong UI:
  - Voice Chat: noi xong auto-send, khong can bam gui thu cong.
  - Manual Command: nhap lenh dieu khien va bam gui de parse-and-execute.
- User co the chon provider theo tung request: `OpenRouter` hoac `Google Gemini`.
- Khi context language la `vi-VN`, assistant phai tra loi tieng Viet co dau.
- Backend bo sung endpoint `POST /api/v1/ai/assistant`.
- Assistant tu thinking de phan loai intent:
  - `chat`: tra loi hoi thoai tu nhien, khong goi ESP32.
  - `device_control`: parse command, execute den ESP32, tra ket qua.

## Architecture impact
- Presentation:
  - `public/index.html`: them mode switch Voice Chat/Manual Command.
  - `public/app.js`: them state `aiMode`, auto-send khi mic `onend`, route den `/ai/assistant` cho voice chat.
  - `public/styles.css`: style mode switch va trang thai mic theo mode.
- Application:
  - `src/application/commandService.js`: them use case `aiAssistant` de intent routing, fallback local commands, va thong diep fail than thien khi ESP32 offline.
- Infrastructure:
  - `src/infrastructure/openRouterClient.js`: them `planAssistant` cho planning JSON `intent + assistant_text + commands`.
- API:
  - `src/api/router.js`: them route `POST /ai/assistant` va response contract moi.

## API endpoints
- Main conversational endpoint:
  - `POST /api/v1/ai/assistant`
- Command endpoints:
  - `POST /api/v1/ai/parse-only`
  - `POST /api/v1/ai/parse-and-execute`
- Legacy compatibility:
  - `POST /api/v1/ai-command`
  - `POST /api/v1/voice-command`

## Validation summary
- Voice chat thuong (`hello who are you`) tra `intent=chat`, `execution_status=chat_only`, khong goi ESP32.
- Lenh smart-home (`bat quat va mo den phong khach`) tra `intent=device_control` va execute theo danh sach command.
- Neu ESP32 offline trong nhanh `device_control`, assistant van tra `assistant_text` than thien va `execution_status=failed`.
- Test API da bo sung cho endpoint assistant va backward compatibility routes.
