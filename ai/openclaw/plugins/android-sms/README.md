# Android SMS

OpenClaw 문자 도구와 Termux SMS 브리지입니다.

모든 요청은 실제 문자 발송 경로를 사용합니다.
폰 브리지 URL과 키가 없으면 발송 성공으로 처리하지 않고 오류를 반환합니다.

## 플러그인 빌드

```bash
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

## 폰에서 브리지 켜기

Termux + Termux:API 설치 후 `termux-sms-send`가 성공한 다음:

```sh
pkg install python
export ANDROID_SMS_BRIDGE_KEY=임의비밀키
python sms_bridge.py
```

폰 IP 확인:

```sh
ifconfig wlan0
```

PC OpenClaw / 백엔드 환경변수:

```env
ANDROID_SMS_BRIDGE_URL=http://폰IP:8787
ANDROID_SMS_BRIDGE_KEY=임의비밀키
```

같은 Wi-Fi만 사용하고, 인터넷에 포트를 열지 마세요.
키는 Git에 올리지 마세요.

## 실제 발송 준비

1. 폰에서 `termux-sms-send` 성공
2. 폰에서 `sms_bridge.py` 실행
3. PC에서 `ANDROID_SMS_BRIDGE_URL` / `ANDROID_SMS_BRIDGE_KEY` 설정
4. OpenClaw 플러그인 재설치 후 Gateway 재시작
