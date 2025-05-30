import os
import tempfile
from pathlib import Path
from typing import List
from acestep.pipeline_ace_step import ACEStepPipeline

class ACEStepModel:
    def __init__(self, checkpoint_dir: str = "./checkpoint"):
        self.checkpoint_dir = checkpoint_dir
        self._ensure_checkpoint_exists()
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"
        self.pipeline = ACEStepPipeline(
            checkpoint_dir=self.checkpoint_dir,
            dtype="float32",
            torch_compile=False,
        )

    def _ensure_checkpoint_exists(self):
        if not Path(self.checkpoint_dir).exists():
            self.download_model()

    def download_model(self):
        from huggingface_hub import snapshot_download
        snapshot_download('ACE-Step/ACE-Step-v1-3.5B', local_dir=self.checkpoint_dir)

    def generate_audio(self, 
                     audio_duration: float,
                     prompt: str,
                     lyrics: str,
                     infer_step: int,
                     guidance_scale: float,
                     scheduler_type: str,
                     cfg_type: str,
                     omega_scale: float,
                     actual_seeds: List[int],
                     guidance_interval: float,
                     guidance_interval_decay: float,
                     min_guidance_scale: float,
                     use_erg_tag: bool,
                     use_erg_lyric: bool,
                     use_erg_diffusion: bool,
                     oss_steps: List[int],
                     guidance_scale_text: float = 0.0,
                     guidance_scale_lyric: float = 0.0) -> bytes:
        format="wav"
        params = (
            format,
            audio_duration,
            prompt,
            lyrics,
            infer_step,
            guidance_scale,
            scheduler_type,
            cfg_type,
            omega_scale,
            ", ".join(map(str, actual_seeds)),
            guidance_interval,
            guidance_interval_decay,
            min_guidance_scale,
            use_erg_tag,
            use_erg_lyric,
            use_erg_diffusion,
            ", ".join(map(str, oss_steps)),
            guidance_scale_text,
            guidance_scale_lyric,
        )

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmpfile:
            self.pipeline(*params, save_path=tmpfile.name)
            with open(tmpfile.name, "rb") as f:
                return f.read()