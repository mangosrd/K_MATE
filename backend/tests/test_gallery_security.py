import os
import sys
import unittest
from types import SimpleNamespace


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from routers.gallery import _gallery_image_response


class GallerySecurityTests(unittest.TestCase):
    def setUp(self):
        self.image = SimpleNamespace(
            id="gallery-kyuhyun-02",
            image_url="/gallery/kyuhyun/photo-01.png",
            title="Premium portrait",
            order=2,
            unlock_cost=5,
        )

    def test_locked_image_does_not_disclose_original_url(self):
        response = _gallery_image_response(self.image, unlocked=False)

        self.assertFalse(response.unlocked)
        self.assertIsNone(response.image_url)

    def test_unlocked_image_includes_original_url(self):
        response = _gallery_image_response(self.image, unlocked=True)

        self.assertTrue(response.unlocked)
        self.assertEqual(response.image_url, self.image.image_url)


if __name__ == "__main__":
    unittest.main()
