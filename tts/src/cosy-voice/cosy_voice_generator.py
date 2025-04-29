VOICE_LIBRARY = {
    "huyihu": {
        "audio_path": "preset_voices/huyihu.mp3",
        "prompt_text": "你好，我是胡一虎！春回大地，春意盎然，今天，我想带您去拜访春天，走进一座山清水秀的城市。"
    },
    "jay": {
        "audio_path": "preset_voices/jay.mp3",
        "prompt_text": "其实我觉得，嗯..我不太适合谈恋爱，因为我觉得自己是一个，比较，额，怎么讲呢，比较只有专注在音乐上面，然后篮球啊什么的，朋友啊，我觉得我对朋友反而会过于爱情。"
    },
    "liyunlong": {
        "audio_path": "preset_voices/liyunlong.mp3",
        "prompt_text": "我李云龙只有一个原则，你们，只许占便宜，不许吃亏，赔本的买卖咱不干，只要枪声一响，你们都得给老子捞点东西回来，我这人不择食，什么都要，吃的，穿的，枪炮，弹药，弄多了我不嫌多，弄少了我不高兴，谁要是弄不着，那我就要骂娘了，不，咱也不是啥都要，要是给我弄回来个日本娘们我可不要。"
    },
    "laohu": {
        "audio_path": "preset_voices/laohu.mp3",
        "prompt_text": "我呢也接受过西方媒体的采访，我记得有一次去这个BBC，我们一个代表团去BBC，因为他知道我在中国有点影响力可能是，就专门把我给这个请出来，然后到他们那个报道室里面，专门一个BBC的一个特别有名的一个记者。"
    },
    "dongqing": {
        "audio_path": "preset_voices/dongqing.mp3",
        "prompt_text": "很高兴能够作为时尚发布嘉宾，出席今晚的时尚盛典，今天晚上有一个很大的感受，是这个行业涌现出了很多新人，我一方面在质疑自己，是不是已经不够时尚的同时，也很庆幸能够有这样一个机会，因为认识新鲜的面孔，就是在认识这个世界。"
    },
    "miqi": {
        "audio_path": "preset_voices/miqi.mp3",
        "prompt_text": "嗨，大家好，是我，米老鼠，对了，要不要进我的妙妙屋，噢！太好了，噢！我差点忘了，要让妙妙屋出现，我们必须要念奇妙的咒语，米斯噶，木斯噶，米老鼠！"
    },
    "juzuo": {
        "audio_path": "preset_voices/juzuo.mp3",
        "prompt_text": "大家好，我是局座张召忠，哎呀，这个，很多小伙伴说经常看我，电视上的妆化得不错，有很多的化妆师，他说我自己的妆化得还可以，其实这一年我做电视二十六七年了，一直都是我自己化妆。"
    },
    "xiaoge": {
        "audio_path": "preset_voices/xiaoge.mp3",
        "prompt_text": "情人节到了，现在都过情人节了，本来我们都过，7月7号，就是七夕牛郎织女香，现在这个西方人也等着他们的节日啊，大家互相感染一下，只要快乐就OK。"
    },
    "laozhu": {
        "audio_path": "preset_voices/laozhu.mp3",
        "prompt_text": "皇朝是咱首创的，封子为王有何不可啊，哎，整个皇朝，都是天子的家园呐，那些藩王又是咱的皇儿，所以说呀，封子为王这件事，没什么可以商议的。"
    }
}

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

    def generate_speech(self, voice_name, target_text):
        import os
        from cosyvoice.utils.file_utils import load_wav

        """
        Generate voice in fast replication mode
        :param voice_name
        :param target_text
        """
        voice_info = VOICE_LIBRARY.get(voice_name)
        if not voice_info:
            raise ValueError(f"Voice configuration not found: {voice_name}")

        if not os.path.exists(voice_info["audio_path"]):
            raise FileNotFoundError(f"The audio file does not exist: {voice_info['audio_path']}")

        prompt_speech = load_wav(voice_info["audio_path"], 16000)

        results = self.cosyvoice.inference_zero_shot(
            tts_text=target_text,
            prompt_text=voice_info["prompt_text"],
            prompt_speech_16k=prompt_speech,
            stream=False
        )

        merged_waveform = self._merge_audio_segments(
            [result["tts_speech"] for result in results]
        )

        return self._waveform_to_bytes(merged_waveform)
