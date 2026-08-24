import json
import unittest
from unittest.mock import patch

from app.schemas.story import (
    StoryGenerateRequest,
    StoryGenerationMode,
    StoryTheme,
)
from app.services.story_generation_service import (
    GeneratedStory,
    StoryGenerationError,
    StoryGenerationService,
)
from app.services.story_service import StoryService


class FakeStoryGenerationService:
    enabled = True
    model = "test-story-model"

    def __init__(self) -> None:
        self.requests: list[StoryGenerateRequest] = []

    def generate(self, request: StoryGenerateRequest) -> GeneratedStory:
        self.requests.append(request)
        return GeneratedStory(
            title=f"{request.baby_name}의 맞춤 동화",
            scenes=[
                f"{request.baby_name}의 이야기 장면 {number}"
                for number in range(1, 8)
            ],
        )


class FakeHttpResponse:
    def __init__(self, payload: dict) -> None:
        self.body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    def __enter__(self) -> "FakeHttpResponse":
        return self

    def __exit__(self, *_args) -> None:
        return None

    def read(self) -> bytes:
        return self.body


class StoryServiceTests(unittest.TestCase):
    def test_story_uses_single_llm_generation_profile(self) -> None:
        generator = FakeStoryGenerationService()
        service = StoryService(generation_service=generator)

        result = service.generate(self._request())

        self.assertEqual(
            StoryGenerationMode.LLM,
            result.generation_mode,
        )
        self.assertIn("서윤", result.content)
        self.assertEqual(7, result.scene_count)
        self.assertEqual(1, len(generator.requests))


    def test_status_exposes_llm_model(self) -> None:
        status = StoryService(
            generation_service=FakeStoryGenerationService(),
        ).get_status()

        self.assertEqual("READY", status.status)
        self.assertEqual(StoryGenerationMode.LLM, status.generation_mode)
        self.assertEqual("test-story-model", status.model)

    def test_prompt_applies_single_long_story_rule(self) -> None:
        generator = StoryGenerationService(enabled=True)

        prompt = generator._prompt(self._request())

        self.assertIn('# 유아 맞춤형 고품질 동화 생성 프롬프트', prompt)
        self.assertIn('`7`개 이상 `8`개 이하', prompt)
        self.assertIn('`800`자 이상 `1000`자 이하', prompt)
        self.assertIn('최소 115자 이상', prompt)
        self.assertIn('기승전결', prompt)
        self.assertIn('서윤이는', prompt)
        self.assertIn('서윤이가', prompt)
        self.assertIn('토끼와 거북이', prompt)
        self.assertNotIn('{topic}', prompt)
        self.assertNotIn('{사건 단계 목록}', prompt)

    def test_consonant_ending_name_forms(self) -> None:
        forms = StoryGenerationService(enabled=True)._name_forms('서윤')
        self.assertEqual('서윤이는', forms.topic)
        self.assertEqual('서윤이가', forms.subject)
        self.assertEqual('서윤이를', forms.object)
        self.assertEqual('서윤아', forms.vocative)
        self.assertEqual('서윤이랑', forms.companion)

    def test_vowel_ending_name_forms(self) -> None:
        forms = StoryGenerationService(enabled=True)._name_forms('민서')
        self.assertEqual('민서는', forms.topic)
        self.assertEqual('민서가', forms.subject)
        self.assertEqual('민서를', forms.object)
        self.assertEqual('민서야', forms.vocative)
        self.assertEqual('민서랑', forms.companion)

    def test_generated_name_particles_are_normalized(self) -> None:
        generator = StoryGenerationService(enabled=True)
        normalized = generator._normalize_baby_name_particles(
            '서윤은 지도를 폈어요. 서윤이 웃었어요. '
            '토끼가 서윤과 걸었고 서윤야 하고 불렀어요.',
            '서윤',
        )
        self.assertIn('서윤이는 지도를', normalized)
        self.assertIn('서윤이가 웃었어요', normalized)
        self.assertIn('서윤이와 걸었고 서윤아', normalized)

    def test_prompt_uses_classic_blueprint_and_name_forms(self) -> None:
        generator = StoryGenerationService(enabled=True)
        prompt = generator._prompt(self._request())
        self.assertIn('토끼와 거북이', prompt)
        self.assertIn('서윤이는', prompt)
        self.assertIn('서윤이가', prompt)
        self.assertIn('중심 목표를 하나 정한다', prompt)
        self.assertIn('원작의 문장, 대사, 표현', prompt)
        self.assertIn('"characters": ["서윤", "친구 이름"]', prompt)

    def test_repeated_sentences_are_measured(self) -> None:
        generator = StoryGenerationService(enabled=True)
        story = GeneratedStory(
            title='반복 동화',
            scenes=[
                '서윤이가 별빛 길을 걸었어요. '
                '서윤이가 별빛 길을 걸었어요. '
                '서윤이가 별빛 길을 걸었어요.',
            ],
        )
        self.assertGreater(generator._repetition_ratio(story), 0.5)

    def test_disabled_llm_is_rejected_before_network_call(self) -> None:
        generator = StoryGenerationService(enabled=False)

        with self.assertRaisesRegex(
            StoryGenerationError,
            "STORY_LLM_DISABLED",
        ):
            generator.generate(self._request())

    def test_too_short_story_is_retried_then_rejected(self) -> None:
        generator = StoryGenerationService(enabled=True)
        response = {
            'response': json.dumps(
                {
                    'title': '새 프롬프트 동화',
                    'characters': ['서윤', '토끼'],
                    'scenes': ['짧지만 구조가 올바른 장면'] * 4,
                },
                ensure_ascii=False,
            )
        }
        with patch(
            'app.services.story_generation_service.urlopen',
            return_value=FakeHttpResponse(response),
        ) as urlopen_mock:
            with self.assertRaisesRegex(
                StoryGenerationError,
                "STORY_LLM_STORY_TOO_FEW_SCENES",
            ):
                generator.generate(self._request())
        self.assertEqual(2, urlopen_mock.call_count)
        first_request = urlopen_mock.call_args_list[0].args[0]
        retry_request = urlopen_mock.call_args_list[1].args[0]
        first_payload = json.loads(first_request.data.decode("utf-8"))
        retry_payload = json.loads(retry_request.data.decode("utf-8"))
        self.assertIs(False, first_payload["think"])
        self.assertEqual(8192, first_payload["options"]["num_ctx"])
        self.assertEqual(7, first_payload["format"]["properties"]["scenes"]["minItems"])
        self.assertEqual(115, first_payload["format"]["properties"]["scenes"]["items"]["minLength"])
        self.assertIn("확장할 초안", retry_payload["prompt"])
        self.assertIn("짧지만 구조가 올바른 장면", retry_payload["prompt"])

    def test_short_draft_is_expanded_and_returned(self) -> None:
        generator = StoryGenerationService(enabled=True)
        short_response = {
            "response": json.dumps(
                {
                    "title": "짧은 초안",
                    "characters": ["서윤", "토끼"],
                    "scenes": ["짧은 장면"] * 5,
                },
                ensure_ascii=False,
            )
        }
        expanded_response = {
            "response": json.dumps(
                {
                    "title": "충분히 확장된 동화",
                    "characters": ["서윤", "토끼"],
                    "scenes": self._dialogue_story_scenes() * 3,
                },
                ensure_ascii=False,
            )
        }

        with patch(
            "app.services.story_generation_service.urlopen",
            side_effect=[
                FakeHttpResponse(short_response),
                FakeHttpResponse(expanded_response),
            ],
        ) as urlopen_mock:
            result = generator.generate(self._request())

        self.assertEqual("충분히 확장된 동화", result.title)
        self.assertGreaterEqual(len(result.scenes), 7)
        self.assertGreaterEqual(generator._content_length(result), 800)
        self.assertEqual(2, urlopen_mock.call_count)

    def test_invalid_llm_json_is_rejected(self) -> None:
        generator = StoryGenerationService(enabled=True)

        with patch(
            "app.services.story_generation_service.urlopen",
            return_value=FakeHttpResponse({"response": "not-json"}),
        ):
            with self.assertRaisesRegex(
                StoryGenerationError,
                "STORY_LLM_STORY_JSON_INVALID",
            ):
                generator.generate(self._request())

    def test_invalid_json_is_retried_once(self) -> None:
        generator = StoryGenerationService(enabled=True)
        valid_response = {
            "response": json.dumps(
                {
                    "title": "복구된 동화",
                    "characters": ["서윤", "토끼"],
                    "scenes": self._dialogue_story_scenes() * 3,
                },
                ensure_ascii=False,
            )
        }

        with patch(
            "app.services.story_generation_service.urlopen",
            side_effect=[
                FakeHttpResponse({"response": "unterminated {"}),
                FakeHttpResponse(valid_response),
            ],
        ) as urlopen_mock:
            result = generator.generate(self._request())

        self.assertEqual("복구된 동화", result.title)
        self.assertEqual(2, urlopen_mock.call_count)

    def test_packed_scene_array_is_normalized(self) -> None:
        generator = StoryGenerationService(enabled=True)
        packed_scenes = "\n\n".join(
            self._dialogue_story_scenes()
        )
        response = {
            "response": json.dumps(
                {
                    "title": "한 원소에 들어간 동화",
                    "scenes": [packed_scenes],
                },
                ensure_ascii=False,
            )
        }

        with patch(
            "app.services.story_generation_service.urlopen",
            return_value=FakeHttpResponse(response),
        ):
            result = generator._request_story(
                self._request(),
                "test prompt",
            )

        self.assertEqual(5, len(result.scenes))

    def test_single_story_paragraph_is_split_into_scenes(self) -> None:
        generator = StoryGenerationService(enabled=True)
        packed_story = (
            "서윤이는 별 지도를 펼쳤어요. 토끼가 다가왔지요. "
            "“같이 갈래?” 서윤이가 물었어요. "
            "“좋아!” 토끼가 대답했어요. 우주선이 출발했답니다. "
            "별들이 반짝였어요. 둘은 달에 도착했지요. "
            "토끼가 깡충 뛰었어요. 서윤이가 웃었답니다. "
            "두 친구는 포근한 집으로 돌아왔어요."
        )
        response = {
            "response": json.dumps(
                {
                    "title": "한 문단 동화",
                    "characters": ["서윤", "토끼"],
                    "scenes": [packed_story],
                },
                ensure_ascii=False,
            )
        }

        with patch(
            "app.services.story_generation_service.urlopen",
            return_value=FakeHttpResponse(response),
        ):
            result = generator._request_story(
                self._request(),
                "test prompt",
            )

        self.assertEqual(7, len(result.scenes))
        self.assertIn("서윤이는", result.scenes[0])

    def test_scenes_within_fixed_limit_are_kept(self) -> None:
        generator = StoryGenerationService(enabled=True)
        response = {
            "response": json.dumps(
                {
                    "title": "잘게 나뉜 동화",
                    "scenes": [
                        f"해설: 이어지는 장면 {number}이에요."
                        for number in range(1, 9)
                    ],
                },
                ensure_ascii=False,
            )
        }

        with patch(
            "app.services.story_generation_service.urlopen",
            return_value=FakeHttpResponse(response),
        ):
            result = generator._request_story(
                self._request(),
                "test prompt",
            )

        self.assertEqual(8, len(result.scenes))
        self.assertTrue(
            all(scene.strip() for scene in result.scenes)
        )

    def test_narration_report_style_is_normalized(self) -> None:
        generator = StoryGenerationService(enabled=True)

        normalized = generator._normalize_narration_style(
            "해설: 서윤이는 토끼를 바라본다. "
            "인형은 반짝인다. 모두 함께 출발한다.\n"
            "토끼: “얼른 가자!”"
        )

        self.assertIn("바라봐요.", normalized)
        self.assertIn("반짝여요.", normalized)
        self.assertIn("출발해요.", normalized)
        self.assertIn("“얼른 가자!” 토끼는 말했어요.", normalized)
        self.assertNotIn("해설:", normalized)
        self.assertNotIn("토끼:", normalized)

    def test_ascii_single_quoted_dialogue_is_recognized(self) -> None:
        generator = StoryGenerationService(enabled=True)
        story = GeneratedStory(
            title="작은따옴표 동화",
            scenes=[
                "'달님아, 안녕!' 서윤이가 인사했습니다.",
                "'같이 놀자!' 토끼가 대답했습니다.",
            ],
        )

        self.assertEqual(2, generator._dialogue_count(story))

    def test_script_labels_are_removed_from_story(self) -> None:
        generator = StoryGenerationService(enabled=True)
        normalized = generator._normalize_narration_style(
            "해설: 달빛이 반짝여요.\n"
            "서윤: “토끼야, 어디 가?”\n"
            "토끼: '달까지 깡충 뛰어갈 거야!'"
        )

        self.assertNotIn("해설:", normalized)
        self.assertNotIn("서윤:", normalized)
        self.assertNotIn("토끼:", normalized)
        self.assertIn("서윤은 말했어요", normalized)
        self.assertIn("토끼는 말했어요", normalized)

    def test_dialogue_character_ratio_is_measured(self) -> None:
        generator = StoryGenerationService(enabled=True)
        story = GeneratedStory(
            title="대화 비중 동화",
            scenes=[
                "별이 반짝이자 서윤이가 신나게 물었어요. "
                "“토끼야, 우리 같이 달까지 신나게 달려가자!” "
                "토끼는 귀를 쫑긋 세우며 대답했지요. "
                "“좋아, 내 긴 귀가 멋진 우주 안테나가 될 거야!”",
            ],
        )

        self.assertGreater(
            generator._dialogue_character_ratio(story),
            0.5,
        )

    def test_character_metadata_is_limited_to_two(self) -> None:
        generator = StoryGenerationService(enabled=True)
        story = GeneratedStory(
            title="두 친구 동화",
            scenes=[
                "서윤이가 웃으며 말했어요. “같이 가자!” "
                "토끼는 귀를 세우며 대답했지요. “좋아!”",
            ],
            characters=["서윤", "토끼"],
        )

        self.assertEqual(2, len(story.characters))

    def _dialogue_story_scenes(self) -> list[str]:
        return [
            (
                "서윤이는 반짝이는 별 지도를 펼쳐 보며 토끼 친구에게 물었어요. "
                "“토끼야, 달까지 같이 가 볼래?” 토끼는 귀를 쫑긋 세우며 대답했지요. "
                "“좋아! 내 귀를 우주 안테나로 쓰면 되지!”"
            ),
            (
                "종이 우주선이 빙글빙글 돌더니 구름 위로 쏙 올라가네요. 서윤이가 깜짝 놀라 외쳤어요. "
                "“어라, 우주선이 거꾸로 가잖아?” 토끼는 배를 잡고 웃었답니다. "
                "“괜찮아! 뒤로 가도 달은 동그라니까!”"
            ),
            (
                "별가루가 간질간질 코끝에 내려앉자 둘은 재채기를 했어요. "
                "“에취! 별들이 춤을 추기 시작했어!” 서윤이가 눈을 동그랗게 떴어요. "
                "토끼는 앞발을 흔들며 외쳤지요. “내가 지휘할게. 깡충, 깡충, 반짝!”"
            ),
            (
                "길을 잃은 줄 알았는데 분홍 인형이 지도를 가리키듯 반짝였답니다. "
                "서윤이는 인형을 꼭 안으며 외쳤어요. “토끼야, 집으로 가는 길은 여기인가 봐!” "
                "토끼는 지도를 보며 끄덕였지요. “그 인형은 행운의 나침반이야!”"
            ),
            (
                "두 친구는 웃음을 가득 싣고 방으로 돌아와 이불을 폭 덮었어요. "
                "토끼가 작은 목소리로 물었지요. “내일은 어느 별로 갈까?” "
                "서윤이는 하품하며 대답했어요. “꿈에서 만나서 정하자. 잘 자!”"
            ),
        ]

    def _request(self) -> StoryGenerateRequest:
        return StoryGenerateRequest(
            babyName="서윤",
            ageMonths=36,
            interests=["토끼", "우주"],
            favoriteItems=["분홍 인형"],
            theme=StoryTheme.BEDTIME,
        )


if __name__ == "__main__":
    unittest.main()
