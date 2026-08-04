# 온디바이스 AI 설정

이 디렉터리는 Ollama와 `qwen3:8b`를 사용해 육아 지원용 로컬 AI 모델을 구성합니다.
qwen3:8b 모델을 우선적으로 사용한 이유는
우선 대화와 오픈클로 도구를 이용하기에 더 유리한 방향이라서 선택

딥시크 같은 경우에는 추론 능력이 뛰어난 모델이지만, 속도가 느리고 추론이 길다.

이후에는 필요에 의해서 추가, 혹은 변경을 하면된다.

## 모델 설치

명령 프롬프트에서 `ai` 디렉터리로 이동한 후 다음 스크립트를 실행합니다.

```bat
ollama\setup-ollama.cmd
```

스크립트는 다음 작업을 수행합니다.

1. `qwen3:8b` 모델 다운로드
2. `ollama/Modelfile` 설정 적용
3. `parenting-qwen:8b` 커스텀 모델 생성
   (커스텀 모델을 생성하는 이유는 세부적인 설정을 위함)
   (추가로 설정을 변경하기 위한 방법은 아래에 기술)

설정을 변경하기 위한 방법

1. `Modelfile`에 내용 수정하기
2. cmd 창에서 아래 내용 실행하기

```bat
ollama create parenting-qwen:8b -f ollama\Modelfile
```

3. 그 이후로는 동일하게 실행해서 사용하면 됩니다.

설치 결과는 다음 명령으로 확인 가능합니다.

```bat
ollama list
```

## 실행 확인

```bat
ollama run parenting-qwen:8b
```

Ollama API의 기본 주소는 다음과 같습니다.

```text
http://127.0.0.1:11434
```

## 백엔드 연결값

.env 파일에 넣으면 됩니다.

```bat
set OLLAMA_BASE_URL=http://127.0.0.1:11434
set OLLAMA_MODEL=parenting-qwen:8b
```

# AI 사용 사용설명서

컨트롤러에서 아래에 POST 요청으로 보내기
POST http://127.0.0.1:11434/api/chat
Content-Type: application/json

요청 예시는 아래와 같습니다.
{
"model": "parenting-qwen:8b",
"messages": [
{
"role": "user",
"content": "생후 6개월 아이의 수면 패턴을 알려줘."
}
],
"think": false,
"stream": false
}

응답 예시는 아래와 같습니다.
{
"model": "parenting-qwen:8b",
"message": {
"role": "assistant",
"content": "생후 6개월 아이는..."
},
"done": true
}

아래는 JSON 객체 내부에 대한 자세한 설명(필요한 사람들만 읽어보시면 될거같아요.)

## 최상위 목록

`model` 사용할 Ollama 모델 이름
`messages` 모델에게 전달할 대화 내용과 이전 대화 기록
`think` Qwen3의 별도 추론 기능 사용 여부
`stream` 응답을 나눠 받을지, 완성 후 한 번에 받을지 결정

## messages 내부 목록

### `role` 해당 메시지를 누가 작성했는지 나타냅니다.

아래는 role의 들어갈 수 있는 값입니다. 예시 ("role" : "system")
`system` 모델의 역할과 행동 규칙
`user` 사용자가 입력한 질문
`assistant` AI가 이전에 답변한 내용
`tool` 외부 도구를 실행한 결과

### `content` 메시지에 실제 내용입니다.

user라면 사용자의 질문
assistant라면 이전 AI 답변
system이라면 모델이 따라야 할 지시사항
tool이라면 도구 실행 결과

등이 예시 입니다.

### 올라마가 이전 대화를 기억 못합니다.

그래서 연속으로 이어지는 식으로 사용하려면
사용자 질문
→ 프론트엔드
→ 백엔드가 이전 대화 조회
→ Ollama용 messages 생성
→ Ollama 호출
→ AI 답변 저장
→ 프론트엔드에 답변 반환

위와 같은 방식으로 진행해야 합니다.
