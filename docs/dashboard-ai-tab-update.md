# Dashboard va AI tab update

## Feature overview
- Thiet ke lai UI thanh 2 tab: Dashboard va AI Assistant
- Dashboard co quick control bat/tat den phong khach, mo/dong cua chinh
- Dashboard hien thi Temperature Index lay tu sensor DHT22 cua ESP32
- AI tab co lich su chat va cho phep chon lai cuoc hoi thoai cu
- AI tab cho phep sua ten va xoa tung hoi thoai trong lich su
- Micro hoat dong theo toggle: bam lan 1 de ghi am, bam lan 2 de dung, text duoc dien vao o nhap de user bam Gui lenh AI thu cong
- Them language switch EN/VI o goc phai man hinh, speech recognition nhan dien theo ngon ngu duoc chon va tu dong gan vao o nhap
- AI response hien thi theo dang dong lenh: USER, AI working, Done, ket qua thuc thi

## Architecture impact
- Frontend public duoc nang cap cho tab layout va luong luu lich su localStorage
- Backend startup bo sung check ket noi ESP32 theo URL env ESP32_BASE_URL

## API usage
- GET /api/v1/status?includeSensor=true de cap nhat status va nhiet do
- POST /api/v1/control cho manual va quick control
- POST /api/v1/voice-command cho AI command

## Validation summary
- npm start da in log DB ket noi thanh cong
- npm start da in log ESP32 reachable hoac not reachable theo URL cu the
- Frontend da bo auto-send trong speech onresult, chi gui khi user bam nut Gui lenh AI
- Speech recognition da bat che do nghe lien tuc den khi user bam dung ghi am
