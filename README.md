# Bench2Dex 🤖
**A Bimanual Manipulation Benchmark across Dexterous Hands with Simulated Fingertip Visuo-Tactile Support**

This repository hosts the official Bench2Dex project website. Bench2Dex is a simulation benchmark with 26 bimanual manipulation tasks 🧩, 12 dexterous-hand embodiments ✋, and 1.3K human-teleoperated demonstrations 🎮.

## Project Resources 📚
- 🌐 [Project Website](https://bench2dex.github.io/) — overview, task demonstrations, and evaluation results.
- 🏆 [Leaderboard](https://bench2dex.github.io/leaderboard/) — policy comparisons and per-task scores.
- 📄 [Paper: arXiv:2609.15726](https://arxiv.org/abs/2609.15726) — the published preprint.
- 💻 [Benchmark Source Code](https://github.com/Bench2Dex/Bench2Dex) — the main benchmark repository.
- 📖 [Documentation](https://bench2dex.github.io/doc/) — environment setup, policy usage, and task descriptions.

## Datasets & Weights 📦
We provide benchmark assets, human teleoperation datasets, and pre-trained policy checkpoints on both Hugging Face and ModelScope.

### 🤗 Hugging Face
- Assets: [Bench2Dex Assets](https://huggingface.co/datasets/Bench2Dex/Assets)
- Dataset: [Bench2Dex Teleopdata](https://huggingface.co/datasets/Bench2Dex/teleopdata)
- Checkpoints: [Bench2Dex Policy Checkpoints](https://huggingface.co/Bench2Dex/policy_ckpt)

### 🔮 ModelScope
- Assets: [Bench2Dex Assets](https://modelscope.cn/datasets/Bench2Dex/Bench2Dex)
- Dataset: [Bench2Dex Teleopdata](https://modelscope.cn/datasets/Bench2Dex/teleopdata)
- Checkpoints: [Bench2Dex Policy Checkpoints](https://modelscope.cn/models/Bench2Dex/New_Policy)

## Contributing

We welcome pull requests with evaluation results for new policies on Bench2Dex.

## Citation 📝
If you use Bench2Dex in your research, please cite our paper.

```bibtex
@article{yang2026bench2dex,
  title={Bench2Dex: Benchmarking Visuo-Tactile Bimanual Dexterous Manipulation Across Dexterous Hands},
  author={Yang, Zhenjie and Zhang, Yideng and Zhang, Dongjie and Jiang, Chenyu and Liu, Xianshuai and Li, Yufeng and Ge, Zuhao and Jiao, Xingyu and Zhang, Zheng and He, Kaiyu and others},
  journal={arXiv preprint arXiv:2609.15726},
  year={2026}
}
```
