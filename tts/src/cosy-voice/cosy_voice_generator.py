class CosyVoiceGenerator:
    def __init__(self, model_path='pretrained_models/CosyVoice2-0.5B'):
        from cosyvoice.cli.cosyvoice import CosyVoice2
        import logging

        logging.getLogger('numba').setLevel(logging.WARNING)
        self.cosyvoice = CosyVoice2(model_path)

    def _merge_audio_segments(self, waveforms):
        import torch
        if any(wave.dim() != 2 for wave in waveforms):
            raise ValueError('Invalid audio dimension, expected 2D tensor')

        return torch.cat(waveforms, dim=1)

    def _waveform_to_bytes(self, waveform):
        import torchaudio
        import io
        buffer = io.BytesIO()
        torchaudio.save(
            buffer,
            waveform,
            self.cosyvoice.sample_rate,
            format='wav',
            encoding='PCM_S',
            bits_per_sample=16
        )
        buffer.seek(0)
        byte_data = buffer.read()
        buffer.close()
        return byte_data

    def base64_to_audio_tensor(self, base64_str):
        import base64
        import io
        import librosa
        import torch
        try:
            if 'base64,' in base64_str:
                base64_str = base64_str.split('base64,', 1)[1]
            audio_bytes = base64.b64decode(base64_str)
            audio_stream = io.BytesIO(audio_bytes)
            audio, sr = librosa.load(audio_stream, sr=16000, mono=True)
            audio_tensor = torch.FloatTensor(audio).unsqueeze(0)
            return audio_tensor
        except Exception as e:
            raise ValueError(f'Audio processing failed: {str(e)}')

    def generate_speech(self, target_text, prompt_audio_b64, prompt_audio_text):
        prompt_speech = self.base64_to_audio_tensor(prompt_audio_b64)

        results = self.cosyvoice.inference_zero_shot(
            tts_text=target_text,
            prompt_text=prompt_audio_text,
            prompt_speech_16k=prompt_speech,
            stream=False
        )

        merged_waveform = self._merge_audio_segments(
            [result['tts_speech'] for result in results]
        )

        return self._waveform_to_bytes(merged_waveform)

    def construct_prompt_audio_cache_filename(self, prompt_audio_hash):
        import os
        from pathlib import Path

        CACHE_ROOT = Path(os.getenv('HF_HOME', '/app')).resolve()
        PROMPT_CACHE_ROOT = (Path(CACHE_ROOT) / 'xukaknmwla-prompt-audios').resolve()

        os.makedirs(PROMPT_CACHE_ROOT, exist_ok=True)
        return (Path(PROMPT_CACHE_ROOT) / f'{prompt_audio_hash}.wav').resolve()

    def try_read_prompt_audio_b64(self, prompt_audio_hash):
        import hashlib
        import base64

        prompt_audio_file = self.construct_prompt_audio_cache_filename(prompt_audio_hash)

        hasher = hashlib.new('sha256')
        audio_bytes = bytearray()

        # If we have correct audio file in cache, use it
        with open(prompt_audio_file, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
                audio_bytes.extend(chunk)

        digest = hasher.hexdigest()
        if digest == prompt_audio_hash:
            return base64.b64encode(audio_bytes).decode('utf-8')

        raise Exception('Prompt audio not exists')

    async def prepare_prompt_audio(self, prompt_audio_hash, prompt_audio_url):
        import aiohttp

        # If we have correct audio file in cache, use it
        try:
            return self.try_read_prompt_audio_b64(prompt_audio_hash)
        except:
            pass

        prompt_audio_file = self.construct_prompt_audio_cache_filename(prompt_audio_hash)
        # Else fetch it and store in cache
        async with aiohttp.ClientSession(raise_for_status=True, trust_env=True) as session:
            async with session.get(prompt_audio_url) as response:
                with open(prompt_audio_file, 'wb') as f:
                    async for chunk in response.content.iter_chunked(1024):
                        f.write(chunk)

        try:
            return self.try_read_prompt_audio_b64(prompt_audio_hash)
        except Exception as e:
            raise ValueError(f'Prompt audio not exists: {str(e)}')



