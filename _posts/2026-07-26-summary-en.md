---
layout: default
title: "Horizon Summary: 2026-07-26 (EN)"
date: 2026-07-26
lang: en
---

> From 28 items, 6 important content pieces were selected

---

1. [Sglang v0.5.16: DSpark Speculative Decoding and Inkling Support](#item-1) ⭐️ 9.0/10
2. [Open-weight AI is having its Kubernetes moment](#item-2) ⭐️ 9.0/10
3. [Ruff v0.16.0 expands default lint rules from 59 to 413](#item-3) ⭐️ 9.0/10
4. [vLLM v0.26.0 Adds Inkling Model, DeepSeek-V4 Optimizations](#item-4) ⭐️ 8.0/10
5. [Can AMD Break NVIDIA&\#x27;s CUDA Moat? Analysis of Strategies and Challenges](#item-5) ⭐️ 8.0/10
6. [Microsoft to Use TPM Chips to Block Pirated Windows Activation](#item-6) ⭐️ 8.0/10

---

<a id="item-1"></a>
## [Sglang v0.5.16: DSpark Speculative Decoding and Inkling Support](https://github.com/sgl-project/sglang/releases/tag/v0.5.16) ⭐️ 9.0/10

Sglang v0.5.16 introduces the DSpark confidence-driven speculative decoding algorithm, achieving 383.7 tok/s on DeepSeek-V4-Pro, and adds support for the 975B-parameter multimodal MoE model Inkling, reaching up to 71.7k tok/s input throughput on Blackwell hardware. This release significantly advances LLM inference performance with a novel speculative decoding method and support for one of the largest open-weight multimodal models, benefiting both research and production deployments. DSpark uses semi-autoregressive drafting with confidence-based verification windows, while Inkling is a 975B MoE with 41B active parameters, combining sliding-window, full, and Mamba2 linear attention; NVFP4 GEMM now requires FlashInfer.

github · Qiaolin-Yu · Jul 25, 00:13

**Background**: Speculative decoding accelerates LLM inference by using a fast draft model to generate candidate tokens that are verified in parallel by the target model. Mixture-of-Experts \(MoE\) models like Inkling activate only a subset of parameters per token, enabling high capacity with manageable compute. Blackwell is NVIDIA&\#x27;s latest GPU architecture optimized for large-scale AI workloads.

<details><summary>References</summary>
<ul>
<li><a href="https://www.marktechpost.com/2026/07/15/thinking-machines-lab-releases-inkling-a-975b-parameter-open-weights-multimodal-moe-with-41b-active-parameters-and-controllable-thinking-effort/">Thinking Machines Lab Releases Inkling: A 975B-Parameter Open-Weights Multimodal MoE With 41B Active Parameters And Controllable Thinking Effort - MarkTechPost</a></li>
<li><a href="https://hyper.ai/en/papers/DSpark">DSpark : Confidence-Scheduled Speculative Decoding with... | HyperAI</a></li>
<li><a href="https://thinkingmachines.ai/news/introducing-inkling/">Inkling: Our Open-Weights Model - Thinking Machines Lab</a></li>

</ul>
</details>

**Tags**: `#speculative decoding`, `#LLM inference`, `#sglang`, `#MoE`, `#high-performance computing`

---

<a id="item-2"></a>
## [Open-weight AI is having its Kubernetes moment](https://tobi.knaup.me/2026-07-25-open-weight-ai-is-having-its-kubernetes-moment/) ⭐️ 9.0/10

A blog post argues that open-weight AI models are becoming the industry standard, similar to how Kubernetes became the standard for container orchestration. This shift is driven by the need for cost baselines and collaborative model development. The rise of open-weight models could reshape AI pricing, regulation, and development, making AI more accessible and collaborative, akin to the open-source software movement. This parallels the shift that Kubernetes brought to cloud computing. The blog compares the current AI landscape to the early days of Kubernetes, highlighting that open-weight models provide a baseline for inference costs. However, unlike open-source software, open-weight models often lack training code, leading to debates about true openness.

hackernews · tknaup · Jul 25, 14:49 · [Discussion](https://news.ycombinator.com/item?id=49048034)

**Background**: Open-weight AI models are those whose trained parameters \(weights\) are publicly released, allowing anyone to download and use them. This is different from open-source AI, which also includes training code and data. The Kubernetes analogy refers to how a collaborative open-source project became the de facto standard for container management, suggesting a similar path for open-weight AI.

<details><summary>References</summary>
<ul>
<li><a href="https://hai.stanford.edu/ai-definitions/what-is-an-open-weight-model">What is an Open-Weight Model? - Stanford HAI</a></li>
<li><a href="https://opensource.org/ai/open-weights">Open Weights: not quite what you’ve been told</a></li>
<li><a href="https://opensourcesai.com/guides/open-weight-vs-open-source-ai/">Open Weight vs Open Source AI | OpenSourcesAI</a></li>

</ul>
</details>

**Discussion**: Commenters discuss the feasibility of banning models by origin, arguing that weights are just numbers and cannot be traced. They also critique the &\#x27;tokenomics&\#x27; of AI pricing, noting that open-weight models provide a sanity check on costs. Some express hope for collaborative model development similar to Linux, where companies contribute to a shared open model.

**Tags**: `#open-weight`, `#AI`, `#Kubernetes`, `#open source`, `#regulation`

---

<a id="item-3"></a>
## [Ruff v0.16.0 expands default lint rules from 59 to 413](https://simonwillison.net/2026/Jul/25/ruff/#atom-everything) ⭐️ 9.0/10

Ruff v0.16.0, released on July 23, 2026, increased the default set of lint rules from 59 to 413, causing breaking changes in existing CI pipelines that rely on unpinned ruff dependencies. This dramatic expansion means that many Python projects will encounter hundreds of new warnings and errors during linting, significantly improving code quality but requiring immediate attention from developers to update their codebases. The number of rules in Ruff has grown from 708 to 968 since v0.1.0, and many of the newly enabled rules catch syntax errors and runtime errors that were previously not flagged by default.

rss · Simon Willison · Jul 25, 22:44

**Background**: Ruff is an extremely fast Python linter and code formatter written in Rust, designed as a drop-in replacement for tools like Flake8, isort, and Black. It is developed by Astral, a company focused on high-performance Python tooling. The default rule set had not been updated since v0.1.0, and this release aligns the defaults with the tool&\#x27;s growing capabilities.

<details><summary>References</summary>
<ul>
<li><a href="https://docs.astral.sh/ruff/linter/">The Ruff Linter | Ruff - Astral</a></li>
<li><a href="https://github.com/astral-sh/ruff">GitHub - astral-sh/ruff: An extremely fast Python linter and ... ruff · PyPI Ruff - Astral Ruff: Complete Guide to Python&#x27;s Fastest Linter | pydevtools GitHub - sartcod/ruff: An extremely fast Python linter and ... Ruff: A Modern Python Linter for Error-Free and Maintainable ...</a></li>

</ul>
</details>

**Tags**: `#Python`, `#Ruff`, `#linting`, `#development tools`, `#breaking change`

---

<a id="item-4"></a>
## [vLLM v0.26.0 Adds Inkling Model, DeepSeek-V4 Optimizations](https://github.com/vllm-project/vllm/releases/tag/v0.26.0) ⭐️ 8.0/10

vLLM v0.26.0 introduces full support for the Inkling model family from Thinking Machines Lab, significant performance improvements for DeepSeek-V4, fp32 lm\_head support via head\_dtype, and a flexible attention backend selectable per KV-cache group. This release consolidates vLLM&\#x27;s position as the leading open-source LLM inference engine by supporting cutting-edge models like Inkling \(1T parameters, multimodal\) and delivering vendor-specific optimizations for DeepSeek-V4 across NVIDIA, AMD, and Intel GPUs. The release includes 411 commits from 212 contributors, with features such as piecewise CUDA graph support for Inkling, a specialized routing kernel for DeepSeek-V4, and ModelOpt NVFP4 quantization for Blackwell GPUs. The attention backend can now be selected per KV-cache group, and sliding-window support is an explicit backend capability.

github · khluu · Jul 25, 10:38

**Background**: vLLM is a high-throughput, low-latency inference engine for large language models, widely used in production. The Inkling model is a 1T-parameter multimodal model from Thinking Machines Lab that uses novel architecture components like relative attention, short convolution, and shared expert sinks. FlashAttention-4 \(FA4\) is the latest iteration of the flash attention algorithm that improves performance on Hopper GPUs through kernel pipelining.

<details><summary>References</summary>
<ul>
<li><a href="https://vllm.ai/blog/2026-07-15-inkling">TML Inkling on vLLM: Day-0 Support with Optimized Performance</a></li>
<li><a href="https://modal.com/blog/reverse-engineer-flash-attention-4">We reverse-engineered Flash Attention 4</a></li>
<li><a href="https://build.nvidia.com/spark/nvfp4-quantization">NVFP4 Quantization | DGX Spark</a></li>

</ul>
</details>

**Tags**: `#vLLM`, `#LLM inference`, `#performance`, `#release`, `#optimization`

---

<a id="item-5"></a>
## [Can AMD Break NVIDIA&\#x27;s CUDA Moat? Analysis of Strategies and Challenges](https://newsletter.semianalysis.com/p/can-amd-break-the-cuda-moat-amd-advancing) ⭐️ 8.0/10

A detailed analysis from SemiAnalysis examines AMD&\#x27;s efforts to challenge NVIDIA&\#x27;s CUDA dominance, highlighting strategies like agentic kernel generation, software quality improvements, and the Helios MI455X platform, while also discussing production issues and financial engineering tactics. This analysis matters because it sheds light on whether AMD can realistically compete in the AI accelerator market, which is currently dominated by NVIDIA&\#x27;s CUDA ecosystem. The outcome will affect AI computing costs, innovation pace, and the balance of power in the GPU industry. The analysis covers agentic kernel generation — using LLM agents to automate kernel optimization — as a potential software moat. It also details the Helios rack \(72 MI455X GPUs, 18 Venice CPUs, 2.9 exaflops\) and notes that MI455X has 432GB HBM4 but Infinity Fabric bandwidth \(896 GB/s\) trails NVIDIA NVLink 6 \(3.6 TB/s\).

rss · Semianalysis · Jul 25, 00:33

**Background**: NVIDIA&\#x27;s CUDA platform has established a strong moat through its mature software ecosystem and extensive library support, making it difficult for competitors like AMD to gain traction in AI workloads. AMD is trying to counter this with hardware improvements, open-source software initiatives, and now agentic kernel generation to automate and optimize GPU code.

<details><summary>References</summary>
<ul>
<li><a href="https://www.emergentmind.com/topics/agentic-kernel-generation">Agentic Kernel Generation</a></li>
<li><a href="https://arxiv.org/html/2601.15727">Towards Automated Kernel Generation in the Era of LLMs</a></li>
<li><a href="https://www.servethehome.com/amds-epyc-venice-instinct-mi455x-helios-hardware-on-display-for-first-time-at-ces-2026/">AMD’s EPYC Venice, Instinct MI 455 X , &amp; Helios ... - ServeTheHome</a></li>

</ul>
</details>

**Tags**: `#AI hardware`, `#GPU computing`, `#CUDA`, `#AMD`, `#software ecosystem`

---

<a id="item-6"></a>
## [Microsoft to Use TPM Chips to Block Pirated Windows Activation](https://www.techspot.com/news/113232-microsoft-using-tpm-chips-crack-down-pirated-windows.html) ⭐️ 8.0/10

Microsoft is adding TPM-based hardware verification to its KMS activation system, requiring KMS servers to have a certified and unaltered hardware identity before processing volume activation requests. This move could shut down widely used KMS-based piracy tools like Online KMS, which rely on fake servers to activate Windows every 180 days, significantly impacting enterprise software licensing enforcement. The TPM proof feature will become mandatory starting from the next version of Windows Server, and Windows Server 2025 will receive preparatory prompts from August 2026. However, the Massgrave group claims its TSforge method can bypass Microsoft&\#x27;s entire DRM activation architecture.

telegram · zaihuapd · Jul 25, 15:55

**Background**: KMS \(Key Management Service\) is a volume activation technology used by Microsoft for enterprise deployments, allowing organizations to activate Windows and Office within their network without connecting to Microsoft. Pirated versions have long exploited KMS by setting up fake KMS servers that respond to activation requests. TPM \(Trusted Platform Module\) is a hardware chip that provides secure cryptographic functions, and TPM proof is a mechanism that ensures data structures are signed with a unique secret, preventing tampering.

<details><summary>References</summary>
<ul>
<li><a href="https://learn.microsoft.com/en-us/windows-server/get-started/kms-client-activation-keys">Key Management Services ( KMS ) client activation ... | Microsoft Learn</a></li>
<li><a href="https://massgrave.dev/">Microsoft Activation Scripts | MAS</a></li>
<li><a href="https://www.encryptionconsulting.com/introducing-the-tpm/">The cost effective architecture of TPM | Encryption Consulting</a></li>

</ul>
</details>

**Tags**: `#Windows`, `#TPM`, `#anti-piracy`, `#KMS`, `#security`

---