import os
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from fastapi import HTTPException
from routers.memory import MAX_MEMORIES_PER_REQUEST, MAX_MEMORY_CONTENT_CHARS, validate_memory_payload
from schemas.schemas import MemoryCreateRequest, MemoryItem


class MemorySecurityTests(unittest.TestCase):
    def test_rejects_too_many_memories(self):
        request = MemoryCreateRequest(
            user_id="user-1",
            character_id="kyuhyun",
            memories=[MemoryItem(content=f"memory-{i}") for i in range(MAX_MEMORIES_PER_REQUEST + 1)],
        )

        with self.assertRaises(HTTPException) as raised:
            validate_memory_payload(request)

        self.assertEqual(raised.exception.status_code, 413)

    def test_rejects_oversized_memory(self):
        request = MemoryCreateRequest(
            user_id="user-1",
            character_id="kyuhyun",
            memories=[MemoryItem(content="x" * (MAX_MEMORY_CONTENT_CHARS + 1))],
        )

        with self.assertRaises(HTTPException) as raised:
            validate_memory_payload(request)

        self.assertEqual(raised.exception.status_code, 413)


if __name__ == "__main__":
    unittest.main()
