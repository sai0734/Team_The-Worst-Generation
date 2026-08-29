import hashlib
import logging
import os
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from app.subsidy_config import (
    SUBSIDY_DOCUMENT_COLLECTION_NAME,
    SUBSIDY_EMBEDDING_MODEL,
)


AI_SERVER_ROOT = Path(__file__).resolve().parents[2]
DOCUMENT_ROOT = AI_SERVER_ROOT / "data" / "subsidy_documents"
CHROMA_PATH = AI_SERVER_ROOT / "data" / "chroma_subsidies"
SUPPORTED_SUFFIXES = {".docx"}
WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
CORE_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
DUBLIN_CORE_NAMESPACE = "http://purl.org/dc/elements/1.1/"
INDEX_BATCH_SIZE = 50
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DocumentParagraph:
    text: str
    style: str


def _word_tag(name: str) -> str:
    return f"{{{WORD_NAMESPACE}}}{name}"


def extract_docx_blocks(path: Path) -> list[DocumentParagraph]:
    """Word 문단의 본문과 제목 스타일을 함께 읽는다."""
    with zipfile.ZipFile(path) as archive:
        document_xml = archive.read("word/document.xml")

    root = ET.fromstring(document_xml)
    blocks: list[DocumentParagraph] = []
    for paragraph in root.iter(_word_tag("p")):
        text = "".join(
            node.text or ""
            for node in paragraph.iter(_word_tag("t"))
        ).strip()
        if text:
            paragraph_properties = paragraph.find(_word_tag("pPr"))
            paragraph_style = (
                paragraph_properties.find(_word_tag("pStyle"))
                if paragraph_properties is not None
                else None
            )
            style = (
                paragraph_style.attrib.get(_word_tag("val"), "Normal")
                if paragraph_style is not None
                else "Normal"
            )
            blocks.append(DocumentParagraph(text=text, style=style))
    return blocks


def extract_docx_paragraphs(path: Path) -> list[str]:
    """호환용 본문 추출 함수. 제목 스타일이 필요하면 extract_docx_blocks를 사용한다."""
    return [block.text for block in extract_docx_blocks(path)]


def _docx_metadata(path: Path) -> dict[str, str]:
    with zipfile.ZipFile(path) as archive:
        if "docProps/core.xml" not in archive.namelist():
            return {}
        root = ET.fromstring(archive.read("docProps/core.xml"))

    title = root.findtext(f"{{{DUBLIN_CORE_NAMESPACE}}}title", default="").strip()
    subject = root.findtext(f"{{{DUBLIN_CORE_NAMESPACE}}}subject", default="").strip()
    creator = root.findtext(f"{{{DUBLIN_CORE_NAMESPACE}}}creator", default="").strip()
    keywords = root.findtext(f"{{{CORE_NAMESPACE}}}keywords", default="").strip()
    metadata = {
        key.strip(): value.strip()
        for item in keywords.split(";")
        if "=" in item
        for key, value in [item.split("=", 1)]
    }
    if title:
        metadata["document_title"] = title
    if subject:
        metadata["document_type"] = subject
    if creator:
        metadata["issuer"] = creator
    return metadata


def _policy_sections(
    blocks: list[DocumentParagraph],
) -> tuple[list[DocumentParagraph], list[list[DocumentParagraph]]]:
    header: list[DocumentParagraph] = []
    sections: list[list[DocumentParagraph]] = []
    current: list[DocumentParagraph] = []
    for block in blocks:
        if block.style == "Heading1":
            if current:
                sections.append(current)
            current = [block]
        elif current:
            current.append(block)
        else:
            header.append(block)
    if current:
        sections.append(current)
    return header, sections


def _generic_chunks(
    blocks: list[DocumentParagraph],
    max_chars: int = 1400,
) -> list[list[DocumentParagraph]]:
    chunks: list[list[DocumentParagraph]] = []
    current: list[DocumentParagraph] = []
    current_length = 0
    for block in blocks:
        paragraph_length = len(block.text) + 1
        if current and current_length + paragraph_length > max_chars:
            chunks.append(current)
            current = []
            current_length = 0
        current.append(block)
        current_length += paragraph_length
    if current:
        chunks.append(current)
    return chunks


def _render_blocks(blocks: list[DocumentParagraph]) -> str:
    rendered: list[str] = []
    for block in blocks:
        if block.style == "Heading1":
            rendered.append(f"정책: {block.text}")
        elif block.style == "Heading2":
            rendered.append(f"[{block.text}]")
        else:
            rendered.append(block.text)
    return "\n".join(rendered)


def build_document_records(
    document_root: Path = DOCUMENT_ROOT,
) -> dict[str, tuple[str, dict[str, Any]]]:
    records: dict[str, tuple[str, dict[str, Any]]] = {}
    if not document_root.exists():
        return records

    for path in sorted(document_root.iterdir()):
        if (
            not path.is_file()
            or path.name.startswith("~$")
            or path.suffix.lower() not in SUPPORTED_SUFFIXES
        ):
            continue

        try:
            blocks = extract_docx_blocks(path)
            document_metadata = _docx_metadata(path)
        except (OSError, KeyError, zipfile.BadZipFile, ET.ParseError) as error:
            logger.warning("SUBSIDY_DOCUMENT_SKIPPED file=%s reason=%s", path.name, error)
            continue
        if not blocks:
            continue

        header, policy_sections = _policy_sections(blocks)
        chunks = policy_sections or _generic_chunks(blocks)
        document_title = document_metadata.get("document_title", path.stem)
        document_type = document_metadata.get("document_type", "보유 문서")
        sido = document_metadata.get("sido", "")
        sigungu = document_metadata.get("sigungu", "")
        issuer = document_metadata.get("issuer", "")
        effective_date = document_metadata.get("effective_date", "")
        digest_text = "\n".join(
            [
                *(f"{block.style}\t{block.text}" for block in blocks),
                *(f"{key}={value}" for key, value in sorted(document_metadata.items())),
            ]
        )
        file_digest = hashlib.sha256(digest_text.encode("utf-8")).hexdigest()[:16]
        for chunk_index, chunk_blocks in enumerate(chunks):
            policy_title = (
                chunk_blocks[0].text
                if chunk_blocks and chunk_blocks[0].style == "Heading1"
                else document_title
            )
            chunk_text = _render_blocks(header + chunk_blocks)
            document_id = f"document-{file_digest}-{chunk_index}"
            metadata: dict[str, Any] = {
                "source_type": "owned_document",
                "source_name": path.name,
                "document_title": document_title,
                "document_type": document_type,
                "policy_title": policy_title,
                "chunk_index": chunk_index,
                "sido": sido,
                "sigungu": sigungu,
                "issuer": issuer,
                "effective_date": effective_date,
                "is_demo": "시연" in document_type,
            }
            records[document_id] = (chunk_text, metadata)
    return records


def _sync_collection(
    collection: Any,
    records: dict[str, tuple[str, dict[str, Any]]],
) -> dict[str, int]:
    existing_result = collection.get(include=["documents", "metadatas"])
    existing = {
        document_id: (document, metadata)
        for document_id, document, metadata in zip(
            existing_result.get("ids") or [],
            existing_result.get("documents") or [],
            existing_result.get("metadatas") or [],
        )
    }
    inserted_ids = [document_id for document_id in records if document_id not in existing]
    updated_ids = [
        document_id
        for document_id, value in records.items()
        if document_id in existing and existing[document_id] != value
    ]
    changed_ids = inserted_ids + updated_ids
    for offset in range(0, len(changed_ids), INDEX_BATCH_SIZE):
        batch_ids = changed_ids[offset : offset + INDEX_BATCH_SIZE]
        collection.upsert(
            ids=batch_ids,
            documents=[records[document_id][0] for document_id in batch_ids],
            metadatas=[records[document_id][1] for document_id in batch_ids],
        )
    stale_ids = list(set(existing) - set(records))
    if stale_ids:
        collection.delete(ids=stale_ids)
    return {
        "insertedCount": len(inserted_ids),
        "updatedCount": len(updated_ids),
        "unchangedCount": len(records) - len(changed_ids),
        "deletedCount": len(stale_ids),
    }


def reindex_subsidy_documents(collection: Any | None = None) -> dict[str, Any]:
    records = build_document_records()
    if not records:
        return {
            "success": False,
            "message": f"색인할 Word 문서가 없습니다: {DOCUMENT_ROOT}",
            "totalCount": 0,
        }

    if collection is None:
        embedding_function = SentenceTransformerEmbeddingFunction(
            model_name=SUBSIDY_EMBEDDING_MODEL,
        )
        client = chromadb.PersistentClient(path=os.fspath(CHROMA_PATH))
        collection = client.get_or_create_collection(
            SUBSIDY_DOCUMENT_COLLECTION_NAME,
            embedding_function=embedding_function,
        )

    counts = _sync_collection(collection, records)
    return {
        "success": True,
        "message": "보유 Word 문서 색인이 완료되었습니다.",
        "totalCount": len(records),
        **counts,
    }


def resolve_document_path(file_name: str) -> Path | None:
    """출처 다운로드 시 문서 폴더 밖으로 벗어나는 경로를 거부한다."""
    if not file_name or Path(file_name).name != file_name:
        return None
    path = (DOCUMENT_ROOT / file_name).resolve()
    root = DOCUMENT_ROOT.resolve()
    if path.parent != root or not path.is_file() or path.suffix.lower() not in SUPPORTED_SUFFIXES:
        return None
    return path
