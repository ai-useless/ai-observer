import logging
import sys

logger = logging.getLogger('uvicorn')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
logger.addHandler(handler)

RED = '\033[31m'
GREEN = '\33[32m'
BOLD = '\033[1m'
RESET = '\033[0m'

