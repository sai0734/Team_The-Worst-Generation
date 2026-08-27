from __future__ import annotations

import time
import unittest
from unittest.mock import patch

from app.services import subsidy_detail_service


class SubsidyDetailServiceTests(unittest.TestCase):
    def test_parse_detail_xml_collects_selection_benefit_and_application(self) -> None:
        xml = """
        <response>
          <resultCode>0</resultCode>
          <resultMessage>SUCCESS</resultMessage>
          <servDtl>
            <servId>WLF-1</servId>
            <sprtTrgtCn>영유아 가정</sprtTrgtCn>
            <slctCritCn>소득 기준 확인 필요</slctCritCn>
            <alwServCn>매월 양육비 지원 &amp;#9312; 온라인 신청</alwServCn>
            <aplyMtdCn>복지로 또는 주민센터에서 신청</aplyMtdCn>
          </servDtl>
        </response>
        """

        detail = subsidy_detail_service._parse_detail_xml(xml.encode("utf-8"))

        self.assertEqual("영유아 가정", detail["sprtTrgtCn"])
        self.assertEqual("소득 기준 확인 필요", detail["slctCritCn"])
        self.assertEqual("매월 양육비 지원 ① 온라인 신청", detail["alwServCn"])
        self.assertEqual("복지로 또는 주민센터에서 신청", detail["aplyMtdCn"])

    def test_limit_text_prevents_oversized_llm_context(self) -> None:
        self.assertEqual("가가가가가…", subsidy_detail_service._limit_text("가" * 10, 5))

    def test_build_detail_context_uses_live_text_when_fast(self) -> None:
        with patch.object(
            subsidy_detail_service,
            "_detail_text",
            return_value="live-detail",
        ):
            texts = subsidy_detail_service.build_detail_context(
                [("id-1", "목록 문서", {"title": "부모급여"})],
                timeout_seconds=1,
            )

        self.assertEqual(["live-detail"], texts)

    def test_build_detail_context_falls_back_to_index_when_slow(self) -> None:
        def slow_detail(*_args):
            time.sleep(0.3)
            return "live-detail"

        with patch.object(subsidy_detail_service, "_detail_text", side_effect=slow_detail):
            texts = subsidy_detail_service.build_detail_context(
                [(
                    "id-1",
                    "부모급여 목록 요약",
                    {
                        "title": "부모급여",
                        "sido": "서울특별시",
                        "sigungu": "",
                        "target": "영유아 가정",
                    },
                )],
                timeout_seconds=0.05,
            )

        self.assertEqual(1, len(texts))
        self.assertIn("부모급여", texts[0])
        self.assertIn("영유아 가정", texts[0])
        self.assertNotIn("live-detail", texts[0])

    def test_indexed_text_includes_official_link(self) -> None:
        text = subsidy_detail_service._indexed_text(
            "부모급여 목록 요약",
            {
                "title": "부모급여",
                "sido": "서울특별시",
                "sigungu": "",
                "link": "https://www.bokjiro.go.kr/parent",
            },
        )

        self.assertIn("공식 링크: https://www.bokjiro.go.kr/parent", text)


if __name__ == "__main__":
    unittest.main()
