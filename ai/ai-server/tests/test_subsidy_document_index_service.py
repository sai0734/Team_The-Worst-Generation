from app.services.subsidy_document_index_service import (
    DOCUMENT_ROOT,
    build_document_records,
    extract_docx_blocks,
    extract_docx_paragraphs,
    resolve_document_path,
)


DEMO_DOCUMENT = DOCUMENT_ROOT / "aibom_family_plus_policy_catalog.docx"


def test_demo_word_document_is_split_into_policy_chunks():
    paragraphs = extract_docx_paragraphs(DEMO_DOCUMENT)
    blocks = extract_docx_blocks(DEMO_DOCUMENT)
    records = build_document_records()

    assert "2026 서울특별시 아이봄동 육아지원 시범사업 안내" in paragraphs
    assert sum(block.style == "Heading1" for block in blocks) == 6
    assert len(records) == 6
    assert {
        metadata["policy_title"]
        for _document, metadata in records.values()
    } == {
        "아이봄 첫걸음 성장수당",
        "아이봄 365 돌봄패스",
        "아이봄 건강·발달 안심바우처",
        "아이봄 주거안심 패키지",
        "아이봄 육아준비 올인원",
        "아이봄 가족동행 정착지원",
    }
    assert all(
        metadata["source_name"] == DEMO_DOCUMENT.name
        for _document, metadata in records.values()
    )
    assert all(
        metadata["sido"] == "서울특별시"
        and metadata["sigungu"] == "아이봄동"
        and metadata["document_type"] == "시연용 가상 정책 문서"
        for _document, metadata in records.values()
    )
    assert all("[지원 대상]" in document for document, _metadata in records.values())


def test_document_download_path_cannot_escape_document_root():
    assert resolve_document_path(DEMO_DOCUMENT.name) == DEMO_DOCUMENT.resolve()
    assert resolve_document_path("../secret.docx") is None
    assert resolve_document_path("folder/secret.docx") is None
