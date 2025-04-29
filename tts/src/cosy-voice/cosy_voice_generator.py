class CosyVoiceGenerator:
    def __init__(self, model_path="pretrained_models/CosyVoice2-0.5B"):
        from cosyvoice.cli.cosyvoice import CosyVoice2
        self.cosyvoice = CosyVoice2(model_path)

    def _merge_audio_segments(self, waveforms):
        import torch
        if any(wave.dim() != 2 for wave in waveforms):
            raise ValueError("Invalid audio dimension, expected 2D tensor")

        return torch.cat(waveforms, dim=1)

    def _waveform_to_bytes(self, waveform):
        import torchaudio
        import io
        buffer = io.BytesIO()
        torchaudio.save(
            buffer,
            waveform,
            self.cosyvoice.sample_rate,
            format="wav",
            encoding="PCM_S",
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
            if "base64," in base64_str:
                base64_str = base64_str.split("base64,", 1)[1]
            audio_bytes = base64.b64decode(base64_str)
            audio_stream = io.BytesIO(audio_bytes)
            audio, sr = librosa.load(audio_stream, sr=16000, mono=True)
            audio_tensor = torch.FloatTensor(audio).unsqueeze(0)
            return audio_tensor
        except Exception as e:
            raise ValueError(f"Audio processing failed: {str(e)}")

    def generate_speech(self, target_text, prompt_audio_b64, prompt_audio_text):
        prompt_speech = self.base64_to_audio_tensor(prompt_audio_b64)

        results = self.cosyvoice.inference_zero_shot(
            tts_text=target_text,
            prompt_text=prompt_audio_text,
            prompt_speech_16k=prompt_speech,
            stream=False
        )

        merged_waveform = self._merge_audio_segments(
            [result["tts_speech"] for result in results]
        )

        return self._waveform_to_bytes(merged_waveform)
