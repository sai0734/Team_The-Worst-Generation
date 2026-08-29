from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


AI_SERVER_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = AI_SERVER_ROOT / "data" / "subsidy_documents" / "aibom_family_plus_policy_catalog.docx"


def _policy_blocks(
    title: str,
    overview: str,
    target: str,
    criteria: str,
    benefit: str,
    application: str,
    contact: str,
) -> list[tuple[str, str]]:
    return [
        ("Heading1", title),
        ("Heading2", "사업 개요"),
        ("Normal", overview),
        ("Heading2", "지원 대상"),
        ("Normal", target),
        ("Heading2", "선정 기준"),
        ("Normal", criteria),
        ("Heading2", "지원 내용"),
        ("Normal", benefit),
        ("Heading2", "신청 방법과 필요 서류"),
        ("Normal", application),
        ("Heading2", "문의"),
        ("Normal", contact),
    ]


# 사람이 읽는 정상적인 정책 안내서 구조다. Heading1 하나가 검색용 정책 청크 하나가 된다.
DOCUMENT_BLOCKS: list[tuple[str, str]] = [
    ("Title", "2026 서울특별시 아이봄동 육아지원 시범사업 안내"),
    ("Subtitle", "아이봄 패밀리 플러스 · RAG 시연용 가상 정책 안내서"),
    (
        "Normal",
        "이 안내서는 문서 기반 검색과 근거 제시 과정을 시연하기 위해 작성했습니다. "
        "문서에 등장하는 지역, 기관, 연락처와 지원사업은 모두 가상이며 실제 신청할 수 없습니다.",
    ),
]

DOCUMENT_BLOCKS += _policy_blocks(
    "아이봄 첫걸음 성장수당",
    "출생 직후부터 영아기까지 필요한 양육비를 가정이 자유롭게 사용할 수 있도록 현금성 지역화폐를 지원하는 가상 사업입니다.",
    "아이봄동에 3개월 이상 거주하며 생후 0개월부터 35개월까지의 아이를 양육하는 모든 가구가 대상입니다.",
    "소득 제한은 없습니다. 다태아·쌍둥이, 미숙아·선천성이상아 가구는 추가 지원 대상으로 자동 심사합니다.",
    "아동 1명당 월 30만 원을 최대 24개월 지급합니다. 다태아·쌍둥이 또는 미숙아·선천성이상아는 첫 지급 시 아동 1명당 50만 원을 추가 지급합니다.",
    "보호자 신분증, 주민등록등본, 가족관계증명서와 보호자 명의 통장을 준비해 아이봄동 주민센터 또는 아이봄 온라인 창구에서 신청합니다.",
    "아이봄동 가족지원과 000-1234-1001(가상)",
)
DOCUMENT_BLOCKS += _policy_blocks(
    "아이봄 365 돌봄패스",
    "평일 낮뿐 아니라 야간과 주말의 돌봄 공백까지 한 장의 이용권으로 해결하도록 설계한 가상 돌봄 사업입니다.",
    "아이봄동에 거주하는 생후 6개월부터 95개월 아동의 가구가 대상이며 맞벌이·양육공백, 한부모·조손, 장애부모, 청소년 부모 가구를 우선 지원합니다.",
    "소득 제한은 없습니다. 일반 가구는 돌봄 필요 확인서를 제출하고 우선지원 가구는 해당 특성을 확인할 수 있는 서류를 제출합니다.",
    "지정 어린이집, 공동육아센터와 방문 돌봄에서 사용할 수 있는 이용권을 아동 1명당 월 60시간 제공합니다. 평일 야간과 주말 사용도 가능하며 본인부담금은 없습니다.",
    "재직증명서, 돌봄 공백 확인서 또는 가구 특성 확인 서류를 아이봄 가족센터에 제출하고 원하는 돌봄 방식과 시간대를 선택합니다.",
    "아이봄 가족센터 000-1234-2002(가상)",
)
DOCUMENT_BLOCKS += _policy_blocks(
    "아이봄 건강·발달 안심바우처",
    "아이의 신체 건강, 발달, 심리와 치과 검진을 한 번에 지원해 필요한 치료 시기를 놓치지 않도록 돕는 가상 사업입니다.",
    "아이봄동에 거주하는 생후 0개월부터 만 12세까지의 아동이 대상입니다. 장애아동과 미숙아·선천성이상아는 추가 지원을 받을 수 있습니다.",
    "기준중위소득 200% 이하 가구를 기본 대상으로 하며 장애아동과 미숙아·선천성이상아는 소득과 관계없이 지원합니다.",
    "아동 1명당 연 80만 원의 건강·발달 바우처를 제공합니다. 장애아동과 미숙아·선천성이상아는 연 40만 원을 추가하고 보호자 심리상담 6회를 함께 제공합니다.",
    "건강보험 자격확인서와 주민등록등본을 아이봄 보건지원센터에 제출합니다. 추가 지원 신청자는 진단서 또는 출생 관련 확인서를 함께 제출합니다.",
    "아이봄 보건지원센터 000-1234-3003(가상)",
)
DOCUMENT_BLOCKS += _policy_blocks(
    "아이봄 주거안심 패키지",
    "아이를 키우는 가정의 월세 부담과 주거 안전 문제를 함께 줄이기 위한 선택형 가상 주거 지원사업입니다.",
    "임신·출산 예정 가구부터 만 12세 이하 아동을 양육하는 아이봄동 전월세 가구가 대상입니다. 다자녀, 장애아동, 장애부모와 청소년 부모 가구를 우선 지원합니다.",
    "가구원 수별 기준중위소득 180% 이하이며 무주택 전월세 가구여야 합니다. 같은 목적의 주거 현금 지원을 받는 기간에는 중복 지급하지 않습니다.",
    "월세 가구는 월 25만 원을 최대 12개월 지원합니다. 월세 지원 대신 안전문, 미끄럼 방지, 아동용 난간 등 주거 안전개선비를 가구당 최대 250만 원까지 선택할 수 있습니다.",
    "임대차계약서, 주민등록등본, 소득 확인 자료를 아이봄동 주거복지 창구에 제출하고 월세지원 또는 안전개선 중 하나를 선택합니다.",
    "아이봄동 주거복지팀 000-1234-4004(가상)",
)
DOCUMENT_BLOCKS += _policy_blocks(
    "아이봄 육아준비 올인원",
    "출산 준비부터 영유아기까지 필요한 물품을 구매하거나 빌릴 수 있도록 포인트와 무료 대여를 결합한 가상 사업입니다.",
    "임신·출산 예정 가구와 아이봄동에 거주하는 만 5세 이하 아동의 가구가 대상입니다.",
    "소득 제한은 없습니다. 다자녀와 다태아·쌍둥이 가구는 포인트와 대여 가능 품목 수를 추가합니다.",
    "가구당 연 100만 원의 육아준비 포인트와 유모차, 아기침대, 카시트 등 대형 육아용품 2종의 무료 대여를 제공합니다. 다자녀와 다태아·쌍둥이는 연 50만 원과 대여 1종을 추가합니다.",
    "임신확인서 또는 아동이 표시된 주민등록등본을 아이봄 공동육아나눔터에 제출하고 구매 포인트와 대여 품목을 선택합니다.",
    "아이봄 공동육아나눔터 000-1234-5005(가상)",
)
DOCUMENT_BLOCKS += _policy_blocks(
    "아이봄 가족동행 정착지원",
    "가족 형태와 언어, 돌봄 경험의 차이 때문에 행정·양육 서비스를 이용하기 어려운 가정에 전담 동행자를 연결하는 가상 사업입니다.",
    "아이봄동의 다문화가정, 입양·가정위탁 가정, 한부모·조손 가정과 청소년 부모 가구가 대상입니다.",
    "소득 제한은 없습니다. 신청 가구의 동의를 받아 필요한 통번역, 상담, 돌봄과 행정서비스를 통합 설계합니다.",
    "가구별 전담 코디네이터를 1년간 배정하고 통번역, 양육상담, 신청서 작성 동행을 제공합니다. 초기 정착에 필요한 교육·돌봄 서비스 비용으로 가구당 연 60만 원을 추가 지원합니다.",
    "가구 특성을 확인할 수 있는 서류와 주민등록등본을 아이봄 통합가족센터에 제출합니다. 서류 준비가 어려우면 사전 상담 후 담당자가 발급 절차를 동행합니다.",
    "아이봄 통합가족센터 000-1234-6006(가상)",
)

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>"""

DOCUMENT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

CORE_PROPERTIES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties
  xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>2026 서울특별시 아이봄동 육아지원 시범사업 안내</dc:title>
  <dc:subject>시연용 가상 정책 문서</dc:subject>
  <dc:creator>서울특별시 아이봄동 가족지원과(가상)</dc:creator>
  <cp:keywords>sido=서울특별시;sigungu=아이봄동;effective_date=2026-08-27</cp:keywords>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-08-27T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-27T00:00:00Z</dcterms:modified>
</cp:coreProperties>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕"/><w:sz w:val="21"/></w:rPr></w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1F4E78"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:before="360" w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="2F5597"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="548235"/></w:rPr></w:style>
</w:styles>"""


def _paragraph_xml(style: str, text: str) -> str:
    return (
        f'<w:p><w:pPr><w:pStyle w:val="{escape(style)}"/></w:pPr>'
        f'<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'
    )


def _document_xml() -> str:
    body = "".join(_paragraph_xml(style, text) for style, text in DOCUMENT_BLOCKS)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f'<w:body>{body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
        '</w:body></w:document>'
    )


def create_demo_document(output_path: Path = OUTPUT_PATH) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_name(f".{output_path.name}.tmp")
    try:
        with ZipFile(temporary_path, "w", ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", CONTENT_TYPES)
            archive.writestr("_rels/.rels", ROOT_RELS)
            archive.writestr("docProps/core.xml", CORE_PROPERTIES)
            archive.writestr("word/document.xml", _document_xml())
            archive.writestr("word/styles.xml", STYLES)
            archive.writestr("word/_rels/document.xml.rels", DOCUMENT_RELS)
        temporary_path.replace(output_path)
    finally:
        temporary_path.unlink(missing_ok=True)
    return output_path


if __name__ == "__main__":
    print(create_demo_document())
