---
layout: default
title: "Horizon Summary: 2026-07-26 (ZH)"
date: 2026-07-26
lang: zh
---

> 从 28 条内容中筛选出 6 条重要资讯。

---

1. [Sglang v0.5.16：引入 DSpark 推测解码与 Inkling 支持](#item-1) ⭐️ 9.0/10
2. [开放权重 AI 迎来其 Kubernetes 时刻](#item-2) ⭐️ 9.0/10
3. [Ruff v0.16.0 默认规则从 59 条扩展到 413 条](#item-3) ⭐️ 9.0/10
4. [vLLM v0.26.0 新增 Inkling 模型和 DeepSeek-V4 优化](#item-4) ⭐️ 8.0/10
5. [AMD 能否打破 NVIDIA 的 CUDA 护城河？战略与挑战分析](#item-5) ⭐️ 8.0/10
6. [微软将借 TPM 芯片封堵盗版 Windows 激活](#item-6) ⭐️ 8.0/10

---

<a id="item-1"></a>
## [Sglang v0.5.16：引入 DSpark 推测解码与 Inkling 支持](https://github.com/sgl-project/sglang/releases/tag/v0.5.16) ⭐️ 9.0/10

Sglang v0.5.16 引入了基于置信度的 DSpark 推测解码算法，在 DeepSeek-V4-Pro 上达到 383.7 tok/s，并支持 975B 参数的多模态 MoE 模型 Inkling，在 Blackwell 硬件上实现高达 71.7k tok/s 的输入吞吐量。 该版本通过新颖的推测解码方法和支持最大的开源多模态模型之一，显著提升了 LLM 推理性能，对研究及生产部署均有裨益。 DSpark 采用半自回归草稿生成与基于置信度的验证窗口，而 Inkling 是一个 975B 参数、41B 活跃参数的 MoE 模型，融合了滑动窗口、全注意力和 Mamba2 线性注意力；NVFP4 GEMM 现需依赖 FlashInfer。

github · Qiaolin-Yu · 7月25日 00:13

**背景**: 推测解码通过快速草稿模型生成候选 token，再由目标模型并行验证，从而加速 LLM 推理。Inkling 等混合专家模型（MoE）每个 token 仅激活部分参数，实现了高容量与可控计算。Blackwell 是 NVIDIA 最新的 GPU 架构，专为大规模 AI 工作负载优化。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://www.marktechpost.com/2026/07/15/thinking-machines-lab-releases-inkling-a-975b-parameter-open-weights-multimodal-moe-with-41b-active-parameters-and-controllable-thinking-effort/">Thinking Machines Lab Releases Inkling: A 975B-Parameter Open-Weights Multimodal MoE With 41B Active Parameters And Controllable Thinking Effort - MarkTechPost</a></li>
<li><a href="https://hyper.ai/en/papers/DSpark">DSpark : Confidence-Scheduled Speculative Decoding with... | HyperAI</a></li>
<li><a href="https://thinkingmachines.ai/news/introducing-inkling/">Inkling: Our Open-Weights Model - Thinking Machines Lab</a></li>

</ul>
</details>

**标签**: `#speculative decoding`, `#LLM inference`, `#sglang`, `#MoE`, `#high-performance computing`

---

<a id="item-2"></a>
## [开放权重 AI 迎来其 Kubernetes 时刻](https://tobi.knaup.me/2026-07-25-open-weight-ai-is-having-its-kubernetes-moment/) ⭐️ 9.0/10

一篇博客文章认为，开放权重 AI 模型正成为行业标准，类似于 Kubernetes 成为容器编排标准的过程。这一转变源于对成本基准和协作开发的需求。 开放权重模型的兴起可能重塑 AI 的定价、监管和开发方式，使 AI 更加开放和协作，类似于开源软件运动的影响。这与 Kubernetes 给云计算带来的转变相呼应。 该博客将当前 AI 格局与 Kubernetes 早期阶段进行比较，强调开放权重模型为推理成本提供了基准。但不同于开源软件，开放权重模型通常缺少训练代码，引发了关于真正开放性的讨论。

hackernews · tknaup · 7月25日 14:49 · [社区讨论](https://news.ycombinator.com/item?id=49048034)

**背景**: 开放权重 AI 模型是指其训练后的参数（权重）公开发布，任何人都可以下载和使用。这与开源 AI 不同，后者还包括训练代码和数据。Kubernetes 的类比指的是一个协作的开源项目如何成为容器管理的事实标准，暗示开放权重 AI 可能走类似的道路。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://hai.stanford.edu/ai-definitions/what-is-an-open-weight-model">What is an Open-Weight Model? - Stanford HAI</a></li>
<li><a href="https://opensource.org/ai/open-weights">Open Weights: not quite what you’ve been told</a></li>
<li><a href="https://opensourcesai.com/guides/open-weight-vs-open-source-ai/">Open Weight vs Open Source AI | OpenSourcesAI</a></li>

</ul>
</details>

**社区讨论**: 评论者讨论了按来源禁止模型的可行性，认为权重只是数字且无法追溯。他们还批评了 AI 定价的&\#x27;代币经济学&\#x27;，指出开放权重模型为成本提供了合理性检查。一些人希望出现类似 Linux 的协作模型开发，公司们共同贡献于一个共享的开放模型。

**标签**: `#open-weight`, `#AI`, `#Kubernetes`, `#open source`, `#regulation`

---

<a id="item-3"></a>
## [Ruff v0.16.0 默认规则从 59 条扩展到 413 条](https://simonwillison.net/2026/Jul/25/ruff/#atom-everything) ⭐️ 9.0/10

Ruff v0.16.0 于 2026 年 7 月 23 日发布，将默认启用的 lint 规则从 59 条增加到 413 条，导致依赖未锁定 ruff 依赖的现有 CI 流水线出现破坏性变更。 这一大幅扩展意味着许多 Python 项目在 lint 过程中会遇到数百条新的警告和错误，显著提升代码质量，但也需要开发者立即关注并更新代码库。 自 v0.1.0 以来，Ruff 中的规则总数从 708 条增加到 968 条，许多新启用的规则能捕获之前默认未标记的语法错误和运行时错误。

rss · Simon Willison · 7月25日 22:44

**背景**: Ruff 是一个用 Rust 编写的超快速 Python 代码检查器和格式化工具，旨在替代 Flake8、isort 和 Black 等工具。它由 Astral 公司开发，该公司专注于高性能 Python 工具。默认规则集自 v0.1.0 以来未更新，此次发布使默认规则与工具不断增长的能力保持一致。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://docs.astral.sh/ruff/linter/">The Ruff Linter | Ruff - Astral</a></li>
<li><a href="https://github.com/astral-sh/ruff">GitHub - astral-sh/ruff: An extremely fast Python linter and ... ruff · PyPI Ruff - Astral Ruff: Complete Guide to Python&#x27;s Fastest Linter | pydevtools GitHub - sartcod/ruff: An extremely fast Python linter and ... Ruff: A Modern Python Linter for Error-Free and Maintainable ...</a></li>

</ul>
</details>

**标签**: `#Python`, `#Ruff`, `#linting`, `#development tools`, `#breaking change`

---

<a id="item-4"></a>
## [vLLM v0.26.0 新增 Inkling 模型和 DeepSeek-V4 优化](https://github.com/vllm-project/vllm/releases/tag/v0.26.0) ⭐️ 8.0/10

vLLM v0.26.0 引入了对 Thinking Machines Lab 的 Inkling 模型家族的完整支持，对 DeepSeek-V4 进行了显著的性能优化，通过 head\_dtype 支持 fp32 lm\_head，以及可按 KV-cache 组选择的自定义注意力后端。 此次发布巩固了 vLLM 作为领先开源大模型推理引擎的地位，支持了 Inkling（1T 参数、多模态）等前沿模型，并针对 DeepSeek-V4 在 NVIDIA、AMD 和 Intel GPU 上提供了供应商特定的优化。 此次发布包含来自 212 位贡献者的 411 次提交，新功能包括 Inkling 的分段 CUDA 图支持、DeepSeek-V4 的专用路由内核，以及针对 Blackwell GPU 的 ModelOpt NVFP4 量化。注意力后端现在可按 KV-cache 组选择，滑动窗口支持也成为显式后端能力。

github · khluu · 7月25日 10:38

**背景**: vLLM 是一个用于大语言模型的高吞吐量、低延迟推理引擎，广泛应用于生产环境。Inkling 模型是 Thinking Machines Lab 推出的 1T 参数多模态模型，采用了相对注意力、短卷积和共享专家汇聚等新颖架构组件。FlashAttention-4 \(FA4\) 是注意力算法的最新迭代，通过内核流水线在 Hopper GPU 上提升了性能。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://vllm.ai/blog/2026-07-15-inkling">TML Inkling on vLLM: Day-0 Support with Optimized Performance</a></li>
<li><a href="https://modal.com/blog/reverse-engineer-flash-attention-4">We reverse-engineered Flash Attention 4</a></li>
<li><a href="https://build.nvidia.com/spark/nvfp4-quantization">NVFP4 Quantization | DGX Spark</a></li>

</ul>
</details>

**标签**: `#vLLM`, `#LLM inference`, `#performance`, `#release`, `#optimization`

---

<a id="item-5"></a>
## [AMD 能否打破 NVIDIA 的 CUDA 护城河？战略与挑战分析](https://newsletter.semianalysis.com/p/can-amd-break-the-cuda-moat-amd-advancing) ⭐️ 8.0/10

SemiAnalysis 发布了一份详细分析，探讨 AMD 挑战 NVIDIA CUDA 霸主地位的努力，重点介绍了代理内核生成、软件质量改进以及 Helios MI455X 平台等策略，同时也讨论了生产问题和金融工程手段。 这项分析之所以重要，是因为它揭示了 AMD 是否能在目前由 NVIDIA CUDA 生态系统主导的 AI 加速器市场中实现有效竞争。其结果将影响 AI 计算成本、创新速度以及 GPU 行业的权力平衡。 分析涵盖了代理内核生成——利用 LLM 代理自动优化内核——作为潜在的软件护城河。还详细介绍了 Helios 机架（72 个 MI455X GPU、18 个 Venice CPU、2.9 exaflops），并指出 MI455X 拥有 432GB HBM4，但 Infinity Fabric 带宽（896 GB/s）落后于 NVIDIA NVLink 6（3.6 TB/s）。

rss · Semianalysis · 7月25日 00:33

**背景**: NVIDIA 的 CUDA 平台通过成熟的软件生态系统和丰富的库支持建立了强大的护城河，使得 AMD 等竞争对手在 AI 工作负载中难以取得进展。AMD 正试图通过硬件改进、开源软件计划以及现在的代理内核生成来应对，以自动化和优化 GPU 代码。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://www.emergentmind.com/topics/agentic-kernel-generation">Agentic Kernel Generation</a></li>
<li><a href="https://arxiv.org/html/2601.15727">Towards Automated Kernel Generation in the Era of LLMs</a></li>
<li><a href="https://www.servethehome.com/amds-epyc-venice-instinct-mi455x-helios-hardware-on-display-for-first-time-at-ces-2026/">AMD’s EPYC Venice, Instinct MI 455 X , &amp; Helios ... - ServeTheHome</a></li>

</ul>
</details>

**标签**: `#AI hardware`, `#GPU computing`, `#CUDA`, `#AMD`, `#software ecosystem`

---

<a id="item-6"></a>
## [微软将借 TPM 芯片封堵盗版 Windows 激活](https://www.techspot.com/news/113232-microsoft-using-tpm-chips-crack-down-pirated-windows.html) ⭐️ 8.0/10

微软正在为其 KMS 批量激活系统加入基于 TPM 芯片的硬件验证，要求 KMS 服务器必须先确认其硬件身份经微软认证且未被篡改，之后才能处理批量激活请求。 这一举措可能封杀广泛使用的基于 KMS 的盗版工具（如 Online KMS），这些工具依赖伪造服务器每 180 天激活 Windows，将对企业软件许可的执行产生重大影响。 TPM 证明功能将从下一版 Windows Server 起成为强制要求，自 2026 年 8 月起 Windows Server 2025 将收到准备提示。但 Massgrave 组织声称其 TSforge 方法可绕过微软整个 DRM 激活架构。

telegram · zaihuapd · 7月25日 15:55

**背景**: KMS（密钥管理服务）是微软用于企业部署的批量激活技术，允许组织在其网络内部激活 Windows 和 Office 而无需连接微软。盗版版本长期通过设置伪造的 KMS 服务器来响应激活请求以进行利用。TPM（可信平台模块）是一种提供安全加密功能的硬件芯片，TPM 证明是一种确保数据结构使用唯一秘密进行签名的机制，可防止篡改。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://learn.microsoft.com/en-us/windows-server/get-started/kms-client-activation-keys">Key Management Services ( KMS ) client activation ... | Microsoft Learn</a></li>
<li><a href="https://massgrave.dev/">Microsoft Activation Scripts | MAS</a></li>
<li><a href="https://www.encryptionconsulting.com/introducing-the-tpm/">The cost effective architecture of TPM | Encryption Consulting</a></li>

</ul>
</details>

**标签**: `#Windows`, `#TPM`, `#anti-piracy`, `#KMS`, `#security`

---