# AI Integration

## 1) Muc tieu tich hop AI
Cho phep nguoi dung dieu khien nha thong minh bang ngon ngu tu nhien, nhung van dam bao command co cau truc, an toan va thuc thi duoc tren ESP32.

## 2) Vai tro cua OpenRouter
- Cung cap model LLM de parse y dinh nguoi dung.
- Tra ve command JSON theo schema he thong.
- Ho tro mo rong model de danh gia chat luong parse.

## 3) Chuoi xu ly AI command
1. Nhan natural language input tu dashboard.
2. Chuan hoa context (room, device list, mode hien tai).
3. Gui prompt co rang buoc schema.
4. Nhan ket qua parse tu LLM.
5. Validate schema va business constraints.
6. Neu hop le, chuyen thanh command noi bo.
7. Gui command den ESP32 va nhan ack.
8. Tra ket qua thuc thi cho dashboard.

## 4) Command schema logic (muc nghia)
- intent: lock_control | light_control | ac_control | query_state
- target_device: loai thiet bi
- target_room: phong muc tieu
- action: hanh dong can thuc hien
- mode: manual | auto
- parameters: thong so bo sung (nguong, nhiet do, muc uu tien)
- confidence: do tin cay parse
- requires_confirmation: true/false

## 5) Rule validate bat buoc truoc khi thuc thi
- Bat buoc target_device hop le.
- Bat buoc action nam trong capability cua thiet bi.
- Bat buoc mode hop le theo trang thai he thong.
- Neu confidence thap, bat buoc xac nhan nguoi dung.
- Command vi pham safety policy phai bi tu choi.

## 6) Xu ly lenh mo ho
- Neu cau lenh khong ro phong: yeu cau nguoi dung bo sung.
- Neu cau lenh co nhieu hanh dong: tach thanh danh sach command theo thu tu.
- Neu lenh xung dot mode: uu tien policy o feature spec.

## 7) Prompting strategy
- System instruction mo ta ro danh sach thiet bi ho tro.
- Fixed output contract (chi chap nhan mot dang schema).
- Cam model sinh noi dung ngoai schema command.
- Truyen context state toi thieu de giam hallucination.

## 8) Quan sat chat luong AI
- Parse success rate.
- Command rejection rate.
- Confirmation required rate.
- Mean latency model response.
- Tyle command can chinh sua thu cong sau AI.

## 9) Fallback va resilience
- Khi OpenRouter timeout: thong bao nguoi dung va goi y thao tac manual.
- Khi ket qua parse khong hop le: yeu cau AI parse lai 1 lan voi context bo sung.
- Khi van that bai: tra ve huong dan command theo mau.

## 10) Bao mat can nho (MVP khong auth)
- Khong log API key.
- Han che log du lieu nhay cam.
- Kiem soat tan suat goi AI de tranh abuse local.
