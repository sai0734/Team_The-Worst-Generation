from app.services import subsidy_index_service


class FakeCollection:
    def __init__(self, rows):
        self.rows = dict(rows)
        self.upserted_documents: list[str] = []

    def get(self, include=None):
        ids = list(self.rows)
        return {
            "ids": ids,
            "documents": [self.rows[document_id][0] for document_id in ids],
            "metadatas": [self.rows[document_id][1] for document_id in ids],
        }

    def upsert(self, ids, documents, metadatas):
        self.upserted_documents.extend(documents)
        for document_id, document, metadata in zip(ids, documents, metadatas):
            self.rows[document_id] = (document, metadata)

    def delete(self, ids):
        for document_id in ids:
            self.rows.pop(document_id, None)


def test_parse_xml_response_reads_items_and_total_count():
    xml = """
    <wantedList>
      <totalCount>2</totalCount>
      <resultCode>0</resultCode>
      <resultMessage>SUCCESS</resultMessage>
      <servList><servId>A</servId><servNm>부모급여</servNm></servList>
      <servList><servId>B</servId><servNm>아동수당</servNm></servList>
    </wantedList>
    """

    items, total = subsidy_index_service._parse_xml_response(xml)

    assert total == 2
    assert [item["servId"] for item in items] == ["A", "B"]


def test_local_policy_uses_its_own_target_and_life_stage():
    record = subsidy_index_service._policy_record(
        {
            "servId": "LOCAL-1",
            "servNm": "출산가정 지원",
            "servDgst": "출산가정에 필요한 서비스를 지원합니다.",
            "trgterIndvdlArray": "출산가정",
            "lifeNmArray": "임신·출산,영유아",
            "ctpvNm": "서울특별시",
            "sggNm": "송파구",
            "aplyMtdNm": "인터넷, 방문",
        },
        prefix="local",
        source="복지로 지자체",
        local=True,
    )

    assert record is not None
    document_id, document, metadata = record
    assert document_id == "local-LOCAL-1"
    assert "대상: 출산가정" in document
    assert metadata["target"] == "출산가정"
    assert metadata["is_infant"] is True
    assert metadata["sido"] == "서울특별시"
    assert metadata["sigungu"] == "송파구"
    assert metadata["application_method"] == "인터넷, 방문"


def test_sync_collection_upserts_only_changes_and_deletes_stale_rows():
    unchanged_metadata = {"title": "부모급여"}
    collection = FakeCollection(
        {
            "national-A": ("정책명: 부모급여", unchanged_metadata),
            "local-OLD": ("종료 정책", {"title": "종료 정책"}),
        }
    )
    records = {
        "national-A": ("정책명: 부모급여", unchanged_metadata),
        "local-B": ("정책명: 출산지원금", {"title": "출산지원금"}),
    }

    counts = subsidy_index_service._sync_collection(collection, records)

    assert counts == {
        "insertedCount": 1,
        "updatedCount": 0,
        "unchangedCount": 1,
        "deletedCount": 1,
    }
    assert collection.upserted_documents == ["정책명: 출산지원금"]
    assert set(collection.rows) == {"national-A", "local-B"}
