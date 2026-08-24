import hashlib
import json
import logging
import os
import re
from math import ceil
from dataclasses import dataclass, field
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.schemas.story import StoryGenerateRequest


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GeneratedStory:
    title: str
    scenes: list[str]
    characters: list[str] = field(default_factory=list)
    story_pattern: str = 'unspecified'


@dataclass(frozen=True)
class KoreanNameForms:
    base: str
    topic: str
    subject: str
    object: str
    vocative: str
    companion: str
    conjunction: str


@dataclass(frozen=True)
class StoryBlueprint:
    key: str
    source_title: str
    core: str
    beats: tuple[str, ...]


class StoryGenerationError(RuntimeError):
    pass


STORY_RULES = (7, 8, 800, 1000)
NUM_PREDICT = 4096
NUM_CONTEXT = 8192
DIALOGUE_RULES = (8, 14)
STORY_RESPONSE_FORMAT = {
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "minLength": 1,
            "maxLength": 80,
        },
        "characters": {
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": {
                "type": "string",
                "minLength": 1,
                "maxLength": 40,
            },
        },
        "scenes": {
            "type": "array",
            "minItems": 7,
            "maxItems": 8,
            "items": {
                "type": "string",
                "minLength": 115,
                "maxLength": 145,
            },
        },
    },
    "required": ["title", "characters", "scenes"],
    "additionalProperties": False,
}
DIALOGUE_PATTERN = re.compile(
    r'(?:“[^”\n]{1,120}”|‘[^’\n]{1,120}’|'
    r'"[^"\n]{1,120}"|\'[^\'\n]{1,120}\')'
)


# Public-domain tales are plot scaffolds only; modern edition wording is not
# copied.
STORY_BLUEPRINTS: dict[str, StoryBlueprint] = {}
STORY_BLUEPRINTS['hare_and_tortoise'] = StoryBlueprint(
    'hare_and_tortoise',
    '토끼와 거북이',
    '빠른 친구와 꾸준한 주인공이 서로의 속도를 존중하는 이야기',
    (
        '둘이 목적지와 약속을 정하고 함께 출발한다.',
        '빠른 친구가 서두르다 착오를 겪고 주인공은 단서를 모은다.',
        '좋아하는 물건으로 앞서 나온 문제를 해결한다.',
        '승패나 조롱 대신 서로 기다려 주며 함께 목적을 이룬다.',
    ),
)
STORY_BLUEPRINTS['lion_and_mouse'] = StoryBlueprint(
    'lion_and_mouse',
    '사자와 생쥐',
    '먼저 베푼 작은 친절이 뜻밖의 도움으로 돌아오는 우정 이야기',
    (
        '주인공이 곤란한 친구에게 작지만 구체적인 도움을 준다.',
        '친구는 자신이 도울 수 있을지 자신 없어 한다.',
        '주인공에게 새 문제가 생기고 앞서 나온 단서가 다시 등장한다.',
        '친구가 자기만의 장점으로 도우며 서로의 가치를 깨닫는다.',
    ),
)
STORY_BLUEPRINTS['golden_axe'] = StoryBlueprint(
    'golden_axe',
    '금도끼 은도끼',
    '화려한 유혹보다 자기 물건을 정직하게 알아보고 되찾는 이야기',
    (
        '좋아하는 물건이 왜 소중한지 보여 준 뒤 잃어버린다.',
        '친구가 비슷하지만 다른 물건을 차례로 보여 준다.',
        '주인공은 자기 물건의 작은 특징을 기억해 정직하게 고른다.',
        '물건을 되찾고 둘이 소박한 기쁨을 나눈다.',
    ),
)
STORY_BLUEPRINTS['ant_and_dove'] = StoryBlueprint(
    'ant_and_dove',
    '개미와 비둘기',
    '서로 다른 장점으로 작은 곤란을 번갈아 해결하는 이야기',
    (
        '친구가 곤란해지고 주인공이 주변 물건으로 돕는다.',
        '둘이 여정을 계속하며 처음의 도움을 기억한다.',
        '이번에는 주인공에게 친구의 장점이 필요한 문제가 생긴다.',
        '서로 도운 행동이 하나의 따뜻한 결말로 이어진다.',
    ),
)
STORY_BLUEPRINTS['town_and_country_mouse'] = StoryBlueprint(
    'town_and_country_mouse',
    '시골 쥐와 도시 쥐',
    '낯선 곳을 구경한 뒤 자신에게 편안한 것을 발견하는 이야기',
    (
        '친구의 권유로 화려하고 낯선 장소를 찾아간다.',
        '작은 소동 때문에 둘이 정신없이 움직인다.',
        '좋아하는 물건과 익숙한 기억으로 돌아갈 길을 찾는다.',
        '경험을 간직하고 자기만의 편안한 자리로 돌아온다.',
    ),
)

BLUEPRINTS_BY_THEME = {
    'BEDTIME': ('town_and_country_mouse', 'ant_and_dove'),
    'ADVENTURE': ('golden_axe', 'hare_and_tortoise'),
    'FRIENDSHIP': ('lion_and_mouse', 'ant_and_dove'),
    'HABIT': ('hare_and_tortoise', 'golden_axe'),
    'FAMILY': ('town_and_country_mouse', 'lion_and_mouse'),
}


class StoryGenerationService:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        enabled: bool | None = None,
        timeout_seconds: float = 90,
    ) -> None:
        self.base_url = (
            base_url
            or os.environ.get("OLLAMA_BASE_URL")
            or "http://127.0.0.1:11434"
        ).rstrip("/")
        self.model = (
            model
            or os.environ.get("OLLAMA_MODEL")
            or "parenting-qwen:8b"
        )
        self.enabled = (
            enabled
            if enabled is not None
            else os.environ.get(
                "STORY_LLM_ENABLED",
                "true",
            ).strip().lower() in {"1", "true", "yes"}
        )
        self.timeout_seconds = timeout_seconds

    def _name_forms(self, name: str) -> KoreanNameForms:
        last_character = name[-1]
        has_final = (
            '가' <= last_character <= '힣'
            and (ord(last_character) - ord('가')) % 28 != 0
        )
        if has_final:
            return KoreanNameForms(
                base=name,
                topic=f'{name}이는',
                subject=f'{name}이가',
                object=f'{name}이를',
                vocative=f'{name}아',
                companion=f'{name}이랑',
                conjunction=f'{name}이와',
            )
        return KoreanNameForms(
            base=name,
            topic=f'{name}는',
            subject=f'{name}가',
            object=f'{name}를',
            vocative=f'{name}야',
            companion=f'{name}랑',
            conjunction=f'{name}와',
        )

    def _select_story_blueprint(
        self,
        request: StoryGenerateRequest,
    ) -> StoryBlueprint:
        searchable = ' '.join(
            request.interests + request.favorite_items
        )
        keyword_blueprints = (
            ('토끼', 'hare_and_tortoise'),
            ('거북', 'hare_and_tortoise'),
            ('사자', 'lion_and_mouse'),
            ('생쥐', 'lion_and_mouse'),
            ('도끼', 'golden_axe'),
            ('연못', 'golden_axe'),
            ('비둘기', 'ant_and_dove'),
            ('개미', 'ant_and_dove'),
        )
        for keyword, blueprint_key in keyword_blueprints:
            if keyword in searchable:
                return STORY_BLUEPRINTS[blueprint_key]

        candidates = BLUEPRINTS_BY_THEME[request.theme.value]
        seed = json.dumps(
            {
                'name': request.baby_name,
                'interests': request.interests,
                'items': request.favorite_items,
                'theme': request.theme.value,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        index = hashlib.sha256(seed.encode('utf-8')).digest()[0]
        return STORY_BLUEPRINTS[candidates[index % len(candidates)]]

    def generate(self, request: StoryGenerateRequest) -> GeneratedStory:
        if not self.enabled:
            raise StoryGenerationError("STORY_LLM_DISABLED")

        initial_prompt = self._prompt(request)
        prompt = initial_prompt
        temperature = 0.65
        retryable_errors = {
            "STORY_LLM_STORY_JSON_INVALID",
            "STORY_LLM_STORY_STRUCTURE_INVALID",
            "STORY_LLM_RESPONSE_REQUIRED",
            "STORY_LLM_STORY_TOO_FEW_SCENES",
            "STORY_LLM_STORY_TOO_SHORT",
        }

        for attempt in range(2):
            generated: GeneratedStory | None = None
            try:
                generated = self._request_story(
                    request,
                    prompt,
                    temperature=temperature,
                )
                self._validate_story_quality(generated)
                return generated
            except StoryGenerationError as error:
                reason = str(error)
                if reason not in retryable_errors:
                    raise
                if (
                    attempt == 1
                    and reason == "STORY_LLM_STORY_TOO_SHORT"
                    and generated is not None
                ):
                    enriched = self._add_scene_details(request, generated)
                    self._validate_story_quality(enriched)
                    return enriched
                if attempt == 1:
                    raise
                logger.warning(
                    "STORY_LLM_RETRY attempt=%d reason=%s",
                    attempt + 1,
                    reason,
                )
                if reason in {
                    "STORY_LLM_STORY_TOO_FEW_SCENES",
                    "STORY_LLM_STORY_TOO_SHORT",
                } and generated is not None:
                    prompt = self._expansion_prompt(request, generated)
                    temperature = 0.55
                else:
                    prompt = initial_prompt + (
                        " JSON 문자열의 따옴표와 괄호를 끝까지 닫아 유효한 JSON만 출력한다."
                    )
                    temperature = 0.2

        raise StoryGenerationError("STORY_LLM_STORY_GENERATION_FAILED")

    def _request_story(
        self,
        request: StoryGenerateRequest,
        prompt: str,
        temperature: float = 0.65,
    ) -> GeneratedStory:
        story = self._request_json(
            prompt,
            temperature,
            STORY_RESPONSE_FORMAT,
        )

        title = story.get("title")
        scenes = story.get("scenes")
        characters = story.get(
            "characters",
            [request.baby_name],
        )
        if (
            not isinstance(title, str)
            or not title.strip()
            or not isinstance(scenes, list)
            or not scenes
            or len(scenes) > 30
            or any(not isinstance(scene, str) or not scene.strip() for scene in scenes)
            or not isinstance(characters, list)
            or any(
                not isinstance(character, str)
                or not character.strip()
                for character in characters
            )
        ):
            raise StoryGenerationError(
                "STORY_LLM_STORY_STRUCTURE_INVALID"
            )

        normalized_scenes = [
            scene.strip()
            for scene in scenes
        ]
        if len(normalized_scenes) == 1:
            packed_story = normalized_scenes[0]
            candidates = [
                scene.strip()
                for scene in re.split(
                    r"\n\s*\n",
                    packed_story,
                )
                if scene.strip()
            ]
            if not 2 <= len(candidates) <= 30:
                lines = [
                    line.strip()
                    for line in packed_story.splitlines()
                    if line.strip()
                ]
                minimum_scenes = STORY_RULES[0]
                if len(lines) >= minimum_scenes:
                    candidates = [
                        "\n".join(
                            lines[
                                index * len(lines) // minimum_scenes:
                                (index + 1) * len(lines) // minimum_scenes
                            ]
                        )
                        for index in range(minimum_scenes)
                    ]
            if not 2 <= len(candidates) <= 30:
                sentence_units = [
                    match.group(0).strip()
                    for match in re.finditer(
                        r".+?(?:[.!?。！？][”\"’']?|$)"
                        r"(?=\s+|$)",
                        packed_story,
                    )
                    if match.group(0).strip()
                ]
                minimum_scenes = STORY_RULES[0]
                if len(sentence_units) >= minimum_scenes:
                    candidates = [
                        " ".join(
                            sentence_units[
                                index * len(sentence_units) // minimum_scenes:
                                (index + 1) * len(sentence_units) // minimum_scenes
                            ]
                        )
                        for index in range(minimum_scenes)
                    ]
            if 2 <= len(candidates) <= 30:
                normalized_scenes = candidates

        maximum_scenes = STORY_RULES[1]
        while len(normalized_scenes) > maximum_scenes:
            merge_index = min(
                range(len(normalized_scenes) - 1),
                key=lambda index: (
                    len(normalized_scenes[index])
                    + len(normalized_scenes[index + 1])
                ),
            )
            normalized_scenes[merge_index] = (
                normalized_scenes[merge_index]
                + "\n"
                + normalized_scenes[merge_index + 1]
            )
            del normalized_scenes[merge_index + 1]

        normalized_scenes = [
            self._normalize_baby_name_particles(
                self._normalize_narration_style(scene),
                request.baby_name,
            )
            for scene in normalized_scenes
        ]

        return GeneratedStory(
            title=title.strip(),
            scenes=normalized_scenes,
            characters=[
                character.strip()
                for character in characters
            ],
            story_pattern=self._select_story_blueprint(request).key,
        )

    def _request_json(
        self,
        prompt: str,
        temperature: float,
        response_format: dict,
        num_predict: int = NUM_PREDICT,
    ) -> dict:
        payload = {
            "model": self.model,
            "stream": False,
            "format": response_format,
            "think": False,
            "prompt": prompt,
            "options": {
                "temperature": temperature,
                "num_predict": num_predict,
                "num_ctx": NUM_CONTEXT,
            },
        }
        payload['options']['repeat_penalty'] = 1.18
        payload['options']['repeat_last_n'] = 512
        http_request = Request(
            f"{self.base_url}/api/generate",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urlopen(
                http_request,
                timeout=self.timeout_seconds,
            ) as response:
                envelope = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            raise StoryGenerationError(
                f"STORY_LLM_HTTP_{error.code}"
            ) from error
        except (URLError, TimeoutError, OSError) as error:
            raise StoryGenerationError(
                "STORY_LLM_CONNECTION_FAILED"
            ) from error
        except json.JSONDecodeError as error:
            raise StoryGenerationError(
                "STORY_LLM_RESPONSE_INVALID"
            ) from error

        raw_json = envelope.get("response")
        if not isinstance(raw_json, str) or not raw_json.strip():
            raise StoryGenerationError("STORY_LLM_RESPONSE_REQUIRED")

        try:
            result = json.loads(raw_json)
        except json.JSONDecodeError as error:
            raise StoryGenerationError(
                "STORY_LLM_STORY_JSON_INVALID"
            ) from error
        if not isinstance(result, dict):
            raise StoryGenerationError(
                "STORY_LLM_STORY_STRUCTURE_INVALID"
            )
        return result

    def _normalize_narration_style(self, scene: str) -> str:
        replacements = (
            (r"하였다(?=[.!?。！？]|$)", "했어요"),
            (r"했다(?=[.!?。！？]|$)", "했어요"),
            (r"있었다(?=[.!?。！？]|$)", "있었어요"),
            (r"없었다(?=[.!?。！？]|$)", "없었어요"),
            (r"이었다(?=[.!?。！？]|$)", "이었어요"),
            (r"였다(?=[.!?。！？]|$)", "였어요"),
            (r"된다(?=[.!?。！？]|$)", "돼요"),
            (r"있다(?=[.!?。！？]|$)", "있어요"),
            (r"없다(?=[.!?。！？]|$)", "없어요"),
            (r"이다(?=[.!?。！？]|$)", "이에요"),
            (r"반짝인다(?=[.!?。！？]|$)", "반짝여요"),
            (r"움직인다(?=[.!?。！？]|$)", "움직여요"),
            (r"돌린다(?=[.!?。！？]|$)", "돌려요"),
            (r"웃는다(?=[.!?。！？]|$)", "웃어요"),
            (r"잡는다(?=[.!?。！？]|$)", "잡아요"),
            (r"간다(?=[.!?。！？]|$)", "가요"),
            (r"온다(?=[.!?。！？]|$)", "와요"),
            (r"본다(?=[.!?。！？]|$)", "봐요"),
            (r"준다(?=[.!?。！？]|$)", "줘요"),
            (r"낸다(?=[.!?。！？]|$)", "내요"),
            (r"([가-힣]+)한다(?=[.!?。！？]|$)", r"\1해요"),
        )
        lines: list[str] = []
        for line in scene.splitlines():
            stripped = line.strip()
            narrator_match = re.match(
                r"^(해설|내레이션|나레이터|narrator)"
                r"\s*[:：]\s*(?P<text>.*)$",
                stripped,
                flags=re.IGNORECASE,
            )
            if narrator_match:
                stripped = narrator_match.group("text").strip()
            else:
                character_match = re.match(
                    r"^(?P<speaker>[^:：\n]{1,20})"
                    r"\s*[:：]\s*(?P<dialogue>[\"'“‘].+)$",
                    stripped,
                )
                if character_match:
                    speaker = character_match.group("speaker").strip()
                    dialogue = character_match.group("dialogue").strip()
                    stripped = (
                        f"{dialogue} "
                        f"{self._with_topic_particle(speaker)} 말했어요."
                    )

            pieces = re.split(
                f"({DIALOGUE_PATTERN.pattern})",
                stripped,
            )
            normalized_pieces: list[str] = []
            for piece in pieces:
                if DIALOGUE_PATTERN.fullmatch(piece):
                    normalized_pieces.append(piece)
                    continue
                normalized = piece
                for pattern, replacement in replacements:
                    normalized = re.sub(
                        pattern,
                        replacement,
                        normalized,
                    )
                normalized_pieces.append(normalized)
            lines.append("".join(normalized_pieces).strip())
        return " ".join(line for line in lines if line)

    def _normalize_baby_name_particles(
        self,
        text: str,
        baby_name: str,
    ) -> str:
        forms = self._name_forms(baby_name)
        prefix = (
            rf'(?<![가-힣A-Za-z0-9]){re.escape(baby_name)}'
        )
        boundary = r'(?=$|[\s,.!?~…。，！？])'
        replacements = (
            (rf'{prefix}(?:이는|은|는){boundary}', forms.topic),
            (rf'{prefix}(?:이가|이|가){boundary}', forms.subject),
            (rf'{prefix}(?:이를|을|를){boundary}', forms.object),
            (rf'{prefix}(?:이랑|랑){boundary}', forms.companion),
            (rf'{prefix}(?:이와|와|과){boundary}', forms.conjunction),
            (rf'{prefix}(?:아|야){boundary}', forms.vocative),
        )
        normalized = text
        for pattern, replacement in replacements:
            normalized = re.sub(pattern, replacement, normalized)
        return normalized

    def _with_topic_particle(self, speaker: str) -> str:
        last_character = speaker[-1]
        if "가" <= last_character <= "힣":
            has_final_consonant = (
                (ord(last_character) - ord("가")) % 28
            ) != 0
            return speaker + ("은" if has_final_consonant else "는")
        return speaker

    def _prompt(self, request: StoryGenerateRequest) -> str:
        return self._render_prompt_template(request)

    def _expansion_prompt(
        self,
        request: StoryGenerateRequest,
        generated: GeneratedStory,
    ) -> str:
        profile = {
            "babyName": request.baby_name,
            "ageMonths": request.age_months,
            "interests": request.interests,
            "favoriteItems": request.favorite_items,
            "theme": request.theme.value,
        }
        draft = {
            "title": generated.title,
            "characters": generated.characters,
            "scenes": generated.scenes,
        }
        return (
            "아래 동화 초안은 너무 짧다. 핵심 사건과 등장인물은 유지하되 "
            "줄거리 요약이 아닌 완성된 유아용 한국어 동화로 확장한다.\n"
            "강제 조건:\n"
            "1. scenes는 반드시 7개 이상 8개 이하로 쓴다.\n"
            "2. 각 scene은 공백 포함 115자 이상인 자연스러운 한 문단으로 쓴다.\n"
            "3. 전체 본문은 공백 포함 800자 이상 1000자 이하로 쓴다.\n"
            "4. 1~2장면은 기, 3~4장면은 승, 5~6장면은 전, "
            "7장면 이후는 결의 역할을 하게 하되 해당 글자는 본문에 쓰지 않는다.\n"
            "5. 앞 장면의 결과로 다음 장면이 시작되고, 주인공이 초반 단서를 "
            "활용해 가장 큰 문제를 직접 해결한다.\n"
            "6. title, characters, scenes 필드만 가진 유효한 JSON 객체 하나만 출력한다.\n"
            "아이 정보:\n"
            + json.dumps(profile, ensure_ascii=False)
            + "\n확장할 초안:\n"
            + json.dumps(draft, ensure_ascii=False)
        )

    def _add_scene_details(
        self,
        request: StoryGenerateRequest,
        generated: GeneratedStory,
    ) -> GeneratedStory:
        enriched = generated
        minimum_chars = STORY_RULES[2]

        for detail_attempt in range(2):
            current_chars = self._content_length(enriched)
            if current_chars >= minimum_chars:
                return enriched

            scene_count = len(enriched.scenes)
            minimum_detail_chars = max(
                50,
                ceil((minimum_chars - current_chars) / scene_count) + 15,
            )
            detail_format = {
                "type": "object",
                "properties": {
                    "details": {
                        "type": "array",
                        "minItems": scene_count,
                        "maxItems": scene_count,
                        "items": {
                            "type": "string",
                            "minLength": minimum_detail_chars,
                            "maxLength": minimum_detail_chars + 100,
                        },
                    },
                },
                "required": ["details"],
                "additionalProperties": False,
            }
            detail_prompt = (
                "아래 동화의 각 장면에 바로 이어 붙일 새로운 한국어 묘사 문단을 만든다. "
                "기존 문장을 다시 말하거나 요약하지 않는다. 행동 과정, 주변 변화, "
                "표정과 감각 묘사를 추가해 사건을 더 생생하게 만든다. "
                f"details 배열은 반드시 {scene_count}개이고 순서는 장면과 같다. "
                f"각 detail은 공백 포함 최소 {minimum_detail_chars}자 이상 쓴다. "
                "details 필드만 가진 유효한 JSON 객체 하나만 출력한다.\n"
                "아이 이름: "
                + request.baby_name
                + "\n동화 장면:\n"
                + json.dumps(enriched.scenes, ensure_ascii=False)
            )
            detail_result = self._request_json(
                detail_prompt,
                temperature=0.45,
                response_format=detail_format,
                num_predict=2048,
            )
            details = detail_result.get("details")
            if (
                not isinstance(details, list)
                or len(details) != scene_count
                or any(
                    not isinstance(detail, str)
                    or not detail.strip()
                    for detail in details
                )
            ):
                raise StoryGenerationError(
                    "STORY_LLM_STORY_STRUCTURE_INVALID"
                )

            enriched = GeneratedStory(
                title=enriched.title,
                scenes=[
                    scene
                    + " "
                    + self._normalize_baby_name_particles(
                        self._normalize_narration_style(detail.strip()),
                        request.baby_name,
                    )
                    for scene, detail in zip(enriched.scenes, details)
                ],
                characters=enriched.characters,
                story_pattern=enriched.story_pattern,
            )
            logger.info(
                "STORY_LLM_DETAILS_ADDED attempt=%d charsBefore=%d "
                "charsAfter=%d scenes=%d",
                detail_attempt + 1,
                current_chars,
                self._content_length(enriched),
                scene_count,
            )

        return enriched

    def _render_prompt_template(
        self,
        request: StoryGenerateRequest,
    ) -> str:
        minimum_scenes, maximum_scenes, minimum_chars, maximum_chars = STORY_RULES
        minimum_dialogues, maximum_dialogues = DIALOGUE_RULES
        forms = self._name_forms(request.baby_name)
        blueprint = self._select_story_blueprint(request)
        profile = {
            'babyName': request.baby_name,
            'ageMonths': request.age_months,
            'interests': request.interests,
            'favoriteItems': request.favorite_items,
            'theme': request.theme.value,
        }
        prompt_path = Path(__file__).resolve().parents[1] / (
            'story_generation_prompt_ko.txt'
        )
        template = prompt_path.read_text(encoding='utf-8')
        profile_block = (
            '```json\n'
            + json.dumps(profile, ensure_ascii=False, indent=2)
            + '\n```'
        )
        template = re.sub(
            r'```json\s*\{.*?\}\s*```',
            lambda _match: profile_block,
            template,
            count=1,
            flags=re.DOTALL,
        )
        template = template.replace(
            '`{subject}`는 두 손',
            '`{subject}` 두 손',
        )
        template = template.replace(
            '`{subject}`가 물었지요',
            '`{subject}` 물었지요',
        )
        quote = chr(34)
        character_example = (
            f'[{quote}{{topic}}{quote}, '
            f'{quote}친구 이름{quote}]'
        )
        character_result = (
            f'[{quote}{request.baby_name}{quote}, '
            f'{quote}친구 이름{quote}]'
        )
        template = template.replace(
            character_example,
            character_result,
        )
        replacements = {
            '{topic}': forms.topic,
            '{subject}': forms.subject,
            '{object}': forms.object,
            '{vocative}': forms.vocative,
            '{고전동화 제목}': blueprint.source_title,
            '{고전동화 핵심 내용}': blueprint.core,
            '{사건 단계 목록}': json.dumps(
                blueprint.beats,
                ensure_ascii=False,
            ),
            '{최소 대사 수}': str(minimum_dialogues),
            '{최대 대사 수}': str(maximum_dialogues),
            '{최소 장면 수}': str(minimum_scenes),
            '{최대 장면 수}': str(maximum_scenes),
            '{최소 글자 수}': str(minimum_chars),
            '{최대 글자 수}': str(maximum_chars),
        }
        for placeholder, value in replacements.items():
            template = template.replace(placeholder, value)
        return template

    def _content_length(self, generated: GeneratedStory) -> int:
        return len("\n\n".join(generated.scenes))

    def _validate_story_quality(self, generated: GeneratedStory) -> None:
        minimum_scenes, _, minimum_chars, _ = STORY_RULES
        if len(generated.scenes) < minimum_scenes:
            logger.warning(
                "STORY_LLM_SCENE_COUNT_INVALID actual=%d minimum=%d",
                len(generated.scenes),
                minimum_scenes,
            )
            raise StoryGenerationError(
                "STORY_LLM_STORY_TOO_FEW_SCENES"
            )
        content_length = self._content_length(generated)
        if content_length < minimum_chars:
            logger.warning(
                "STORY_LLM_LENGTH_INVALID actual=%d minimum=%d scenes=%d",
                content_length,
                minimum_chars,
                len(generated.scenes),
            )
            raise StoryGenerationError("STORY_LLM_STORY_TOO_SHORT")

    def _dialogue_count(self, generated: GeneratedStory) -> int:
        content = "\n\n".join(generated.scenes)
        return len(DIALOGUE_PATTERN.findall(content))

    def _dialogue_character_ratio(
        self,
        generated: GeneratedStory,
    ) -> float:
        content = "\n\n".join(generated.scenes)
        dialogue_characters = sum(
            len(match.group(0))
            for match in DIALOGUE_PATTERN.finditer(content)
        )
        return dialogue_characters / max(1, len(content))

    def _repetition_ratio(
        self,
        generated: GeneratedStory,
    ) -> float:
        content = ' '.join(generated.scenes)
        sentences = [
            re.sub(r'\s+', ' ', match.group(0)).strip()
            for match in re.finditer(
                r'.+?(?:[.!?。！？]|$)(?=\s+|$)',
                content,
            )
            if len(match.group(0).strip()) >= 12
        ]
        seen: set[str] = set()
        repeated_characters = 0
        for sentence in sentences:
            normalized = re.sub(
                r'[^가-힣A-Za-z0-9]',
                '',
                sentence,
            )
            if normalized in seen:
                repeated_characters += len(sentence)
            else:
                seen.add(normalized)
        return repeated_characters / max(1, len(content))
