from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


RUN_DEV_PATH = Path(__file__).resolve().parents[1] / "run-dev.py"
SPEC = importlib.util.spec_from_file_location("run_dev", RUN_DEV_PATH)
assert SPEC is not None and SPEC.loader is not None
run_dev = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = run_dev
SPEC.loader.exec_module(run_dev)


class SubsidyInitialIndexTests(unittest.TestCase):
    def test_reads_zero_document_count(self) -> None:
        completed = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout="SUBSIDY_INDEX_COUNT=0\n",
            stderr="",
        )

        with patch.object(run_dev.subprocess, "run", return_value=completed):
            count = run_dev.subsidy_index_count(Path("python"))

        self.assertEqual(0, count)

    def test_skips_initial_index_when_documents_exist(self) -> None:
        with (
            patch.object(run_dev, "subsidy_index_count", return_value=12),
            patch.object(run_dev.subprocess, "run") as process_run,
        ):
            run_dev.ensure_subsidy_index(Path("python"), {})

        process_run.assert_not_called()

    def test_runs_initial_index_when_collection_is_empty(self) -> None:
        completed = subprocess.CompletedProcess(args=[], returncode=0)
        with (
            patch.object(run_dev, "subsidy_index_count", return_value=0),
            patch.object(run_dev.subprocess, "run", return_value=completed) as process_run,
        ):
            run_dev.ensure_subsidy_index(
                Path("python"),
                {"DATA_GO_KR_SERVICE_KEY": "test"},
            )

        process_run.assert_called_once()
        command = process_run.call_args.args[0]
        self.assertEqual(str(run_dev.SUBSIDY_INDEX_SCRIPT), command[1])


class PythonSetupStampTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "requirements.txt").write_text("fastapi\nchromadb\n", encoding="utf-8")
        venv_python = self.root / ".venv" / (
            "Scripts/python.exe" if os.name == "nt" else "bin/python"
        )
        venv_python.parent.mkdir(parents=True)
        venv_python.write_bytes(b"")
        self.install = patch.object(run_dev, "install_python_requirements").start()
        self.tts = patch.object(run_dev, "prepare_tts_models").start()
        patch.object(run_dev, "PYTHON_SERVER_ROOT", self.root).start()
        patch.object(run_dev, "python_server_dependency_error", return_value=None).start()
        patch.object(run_dev, "tts_models_ready", return_value=True).start()
        self.addCleanup(self.temp.cleanup)
        self.addCleanup(patch.stopall)

    def test_hash_is_stable_for_the_same_requirements_file(self) -> None:
        first = run_dev.python_requirements_hash()
        second = run_dev.python_requirements_hash()
        self.assertEqual(first, second)
        self.assertEqual(64, len(first))

    def test_skips_install_when_stamp_matches(self) -> None:
        run_dev.write_python_requirements_stamp(run_dev.python_requirements_hash())

        executable = run_dev.ensure_python_environment()

        self.install.assert_not_called()
        self.tts.assert_not_called()
        self.assertTrue(executable.is_file())

    def test_records_stamp_without_install_when_already_ready(self) -> None:
        executable = run_dev.ensure_python_environment()

        self.install.assert_not_called()
        self.assertEqual(
            run_dev.python_requirements_hash(),
            run_dev.read_python_requirements_stamp(),
        )
        self.assertTrue(executable.is_file())

    def test_installs_when_stamp_is_outdated(self) -> None:
        run_dev.write_python_requirements_stamp("outdated")

        run_dev.ensure_python_environment()

        self.install.assert_called_once()

    def test_installs_when_dependencies_are_missing(self) -> None:
        run_dev.write_python_requirements_stamp(run_dev.python_requirements_hash())

        with patch.object(
            run_dev,
            "python_server_dependency_error",
            return_value="chromadb: ModuleNotFoundError",
        ):
            run_dev.ensure_python_environment()

        self.install.assert_called_once()

    def test_prepares_tts_when_models_are_missing(self) -> None:
        run_dev.write_python_requirements_stamp(run_dev.python_requirements_hash())

        with patch.object(run_dev, "tts_models_ready", return_value=False):
            run_dev.ensure_python_environment()

        self.install.assert_not_called()
        self.tts.assert_called_once()

    def test_force_reinstalls_even_when_current(self) -> None:
        run_dev.write_python_requirements_stamp(run_dev.python_requirements_hash())

        run_dev.ensure_python_environment(force=True)

        self.install.assert_called_once()
        self.tts.assert_called_once()


if __name__ == "__main__":
    unittest.main()
