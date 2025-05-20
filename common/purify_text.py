import re
from bs4 import BeautifulSoup

def purify_text(text):
    soup = BeautifulSoup(text, 'html.parser')
    cleand_html = soup.get_text(separator=' ')
    cleaned_tag = re.sub(r'\[.*?\]', '', cleand_html)
    cleaned_space = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])', '', cleaned_tag)
    cleaned_space = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=，|。|！|？)', '', cleaned_space)
    cleaned_space = re.sub(r'(?<=，|。|！|？)\s+(?=[\u4e00-\u9fa5])', '', cleaned_space)
    return cleaned_space

def chunk_text(text, chunk_size=50):
    punctuation_pattern = r'(?<=[。！？])'

    sentences = re.findall(punctuation_pattern, text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if not current_chunk:
            current_chunk = sentence
            continue

        if len(current_chunk) + len(sentence) + 1 <= chunk_size:
            current_chunk += ' ' + sentence
            continue

        chunks.append(current_chunk.strip())
        current_chunk = sentence

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks
