# Android SMS

OpenClaw 문자 도구와 Termux SMS 브리지입니다.

지금은 백엔드가 `dryRun=true`라서 예약해도 실제 문자는 나가지 않습니다.
폰이 준비되면 URL/키만 넣고 `dryRun=false`로 바꾸면 됩니다.

## 플러그인 빌드

```bash
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

## PC에서 브리지 미리 켜기

폰 없이 연결만 시험할 때:

```bat
set ANDROID_SMS_BRIDGE_KEY=임의비밀키
set SMS_BRIDGE_DRY_RUN=1
python bridge\sms_bridge.py
```

확인:

```bat
curl http://127.0.0.1:8787/health
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

## 실제 발송으로 바꾸는 시점

1. 폰에서 `termux-sms-send` 성공
2. 폰에서 `sms_bridge.py` 실행
3. PC에서 `ANDROID_SMS_BRIDGE_URL` / `ANDROID_SMS_BRIDGE_KEY` 설정
4. 백엔드 `dryRun=false` 변경
5. OpenClaw 플러그인 재설치 후 Gateway 재시작
