import torch
import random
from einops import rearrange
from infer.infer_utils import (
    decode_audio,
    get_lrc_token,
    get_negative_style_prompt,
    get_reference_latent,
    get_style_prompt,
    prepare_model,
)

class DiffRhythmModel:
    def __init__(self, repo_id="ASLP-lab/DiffRhythm-1_2", model_dir="./models"):
        self.device = self._get_device()
        self.repo_id = repo_id
        self.model_dir = model_dir
        
        self.max_frames = 2048
        self.cfm, self.tokenizer, self.muq, self.vae = self._load_models()

    def _get_device(self):
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def _load_models(self):
        print("Loading models...")
        return prepare_model(
            max_frames=self.max_frames,
            device=self.device,
            repo_id=self.repo_id
        )

    def _validate_inputs(self, ref_prompt, ref_audio_path):
        if not (ref_prompt or ref_audio_path):
            raise ValueError("Either ref_prompt or ref_audio_path must be provided")
        if ref_prompt and ref_audio_path:
            raise ValueError("Cannot provide both ref_prompt and ref_audio_path")

    def generate_audio(self, lrc_text, ref_prompt=None, ref_audio_path=None, 
                      audio_length=95, batch_infer_num=1, edit=False, 
                      ref_song=None, edit_segments=None):

        self._validate_inputs(ref_prompt, ref_audio_path)
        if edit and (not ref_song or not edit_segments):
            raise ValueError("ref_song and edit_segments required when editing")

        self.max_frames = 2048 if audio_length == 95 else 6144

        lrc_prompt, start_time = get_lrc_token(
            self.max_frames, lrc_text, self.tokenizer, self.device
        )

        if ref_audio_path:
            style_prompt = get_style_prompt(self.muq, ref_audio_path)
        else:
            style_prompt = get_style_prompt(self.muq, prompt=ref_prompt)

        negative_style_prompt = get_negative_style_prompt(self.device)

        latent_prompt, pred_frames = get_reference_latent(
            self.device, self.max_frames, edit, edit_segments, ref_song, self.vae
        )

        outputs = self._inference(
            latent_prompt, lrc_prompt, style_prompt, 
            negative_style_prompt, start_time, pred_frames, batch_infer_num
        )

        return random.choice(outputs)

    def _inference(self, latent_prompt, lrc_prompt, style_prompt, 
                  negative_style_prompt, start_time, pred_frames, batch_infer_num):
        with torch.inference_mode():
            latents, _ = self.cfm.sample(
                cond=latent_prompt,
                text=lrc_prompt,
                duration=self.max_frames,
                style_prompt=style_prompt,
                negative_style_prompt=negative_style_prompt,
                steps=32,
                cfg_strength=4.0,
                start_time=start_time,
                latent_pred_segments=pred_frames,
                batch_infer_num=batch_infer_num
            )

            outputs = []
            for latent in latents:
                latent = latent.to(torch.float32).transpose(1, 2)
                output = decode_audio(latent, self.vae)
                output = rearrange(output, "b d n -> d (b n)")
                output = (
                    output.to(torch.float32)
                    .div(torch.max(torch.abs(output)))
                    .clamp(-1, 1)
                    .mul(32767)
                    .to(torch.int16)
                    .cpu()
                )
                outputs.append(output)
            return outputs