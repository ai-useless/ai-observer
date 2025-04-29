import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
common_dir = os.path.abspath(
    os.path.join(
        os.path.join(
            os.path.join(current_dir, '..'), '..',
        ), 'common',
    ),
)
if common_dir not in sys.path:
    sys.path.append(common_dir)

from purify_text import purify_text, chunk_text
from logger import logger, RED, BOLD, RESET, GREEN

__all__ = [
    'purify_text', 'chunk_text',
    'logger', 'RED', 'BOLD', 'RESET', 'GREEN'
]
