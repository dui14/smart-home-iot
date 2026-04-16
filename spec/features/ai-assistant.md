# Feature Spec: AI Assistant (LLM -> JSON Parser)

## 1) Description
AI Assistant nhan natural language command tu user, goi LLM de parse thanh JSON command chuan, validate theo schema va business rule, sau do execute qua API server den ESP32.

## 2) Scope
- In scope:
	- Assistant thinking router: phan loai `chat` hoac `device_control` truoc khi execute.
	- Voice Chat auto-send khi ket thuc ghi am.
	- Tach mode trong AI Assistant: Voice Chat va Manual Command.
	- Parse-only va parse-and-execute flow.
	- JSON schema validation cho command.
	- Mapping command den lock/light/ac.
	- Error reason minh bach cho dashboard.
- Out of scope:
	- Multi-turn memory dai han.
	- Personalization theo user profile.

## 3) User Scenarios
1. User nhap "bat den phong khach" va he thong tu dong bat den room dung.
2. User nhap "khoa cua" va he thong parse thanh action `lock` cho smart-lock.
3. User nhap lenh mo ho "bat den" khi co nhieu phong, he thong tra ve yeu cau bo sung room.
4. User xem parsed JSON truoc khi xac nhan execute (parse-only).

## 4) Input / Output
### Input
	- `POST /api/v1/ai/assistant`
		- `request_id`
		- `user_text`
		- `input_type`
		- `context`
- `POST /api/v1/ai/parse-only`
	- `request_id`
	- `user_text`
- `POST /api/v1/ai/parse-and-execute`
	- `request_id`
	- `user_text`
	- `context.current_state` (tuy chon)

### Output
	- Assistant:
		- `intent`
		- `assistant_text`
		- `parsed_commands`
		- `execution_status`
		- `resulting_state`
- Parse-only:
	- `parsed_command`
	- `validation_result`
	- `confidence`
	- `requires_confirmation`
- Parse-and-execute:
	- `parsed_command`
	- `validation_result`
	- `execution_status`
	- `resulting_state`
	- `trace_id`

## 5) API Interaction
1. Dashboard goi `POST /api/v1/ai/assistant` cho Voice Chat mode.
2. Dashboard goi `POST /api/v1/ai/parse-only` hoac `POST /api/v1/ai/parse-and-execute` cho Manual Command mode.
2. Server goi LLM provider (OpenRouter) voi prompt rang buoc schema.
3. Server validate JSON output.
4. Neu hop le va la parse-and-execute:
	 - Server goi `POST /api/v1/command` (internal orchestration).
	 - Server day command den ESP32 qua `POST /command`.

## 6) Device Behavior
- AI assistant khong tac dong truc tiep len firmware.
- Device behavior duoc kich hoat thong qua command da validate:
	- `lock/unlock` -> servo.
	- `on/off` light -> relay theo room.
	- `on/off/set_mode/set_target` AC -> relay + DHT22 logic.

## 7) Validation Logic
1. JSON parse hop le.
2. Co day du key bat buoc: `device`, `room`, `action`.
3. `device` thuoc tap ho tro: `lock|light|ac`.
4. `room` thuoc danh sach room hop le theo device.
5. `action` phu hop capability cua `device`.
6. Business constraints hop le theo mode hien tai.

## 8) Edge Cases
1. LLM tra ve JSON khong parse duoc: `ERR_AI_PARSE_FAILED`.
2. LLM tra ve schema thieu field: `ERR_INVALID_PAYLOAD`.
3. Device khong ton tai: `ERR_DEVICE_NOT_FOUND`.
4. Room mo ho: `requires_confirmation=true`, khong execute.
5. AI timeout: tra fallback huong dan command manual.

## 9) Acceptance Criteria
1. Parse dung command cho cac cau lenh pho bien lock/light/ac.
2. Khong command nao den ESP32 khi validation that bai.
3. Dashboard nhan du ly do loi cu the theo ma loi contract.
4. Co trace toan bo lifecycle parse -> validate -> execute.
