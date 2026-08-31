import json
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.subsidy_document_index_service import reindex_subsidy_documents


if __name__ == "__main__":
    result = reindex_subsidy_documents()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["success"] else 1)
