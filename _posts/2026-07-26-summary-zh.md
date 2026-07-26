---
layout: default
title: "Horizon Summary: 2026-07-26 (ZH)"
date: 2026-07-26
lang: zh
---

> 从 26 条内容中筛选出 5 条重要资讯。

---

1. [vLLM v0.26.0 发布：支持 Inkling 模型及 DeepSeek-V4 优化](#item-1) ⭐️ 8.0/10
2. [Claude 5 的上下文工程新规则](#item-2) ⭐️ 8.0/10
3. [开放权重人工智能模仿 Kubernetes 成为基础设施标准](#item-3) ⭐️ 8.0/10
4. [Ruff v0.16.0 默认启用 413 条规则](#item-4) ⭐️ 8.0/10
5. [携程被罚后公布 19 项整改措施](#item-5) ⭐️ 8.0/10

---

<a id="item-1"></a>
## [vLLM v0.26.0 发布：支持 Inkling 模型及 DeepSeek-V4 优化](https://github.com/vllm-project/vllm/releases/tag/v0.26.0) ⭐️ 8.0/10

vLLM v0.26.0 引入了全新的 Inkling 模型家族，提供完整支持；对 DeepSeek-V4 进行了显著性能优化（端到端 TPOT 提升达 2.94%）；并通过 head\_dtype 支持生成模型的 fp32 lm\_head。此外，该版本还包含灵活注意力后端、KV 卸载功能成熟以及具备多模态能力的 Rust 前端。 该版本通过新 Inkling 模型家族和对 DeepSeek-V4 的深度性能优化，大幅扩展了 vLLM 的模型支持，巩固了其作为领先开源推理引擎的地位。fp32 lm\_head 支持和灵活注意力后端提高了部署的准确性和适应性。 Inkling 是一个 975B 参数的混合专家模型，41B 活跃参数，支持最多 1M token 上下文。该版本包含来自 212 位贡献者的 411 次提交，关键技术新增包括 Inkling 的 piecewise CUDA graph 支持和 Hopper FA4 相对注意力。

github · khluu · 7月25日 10:38

**背景**: vLLM 是一个开源的高吞吐 LLM 推理引擎。Inkling 是 Thinking Machines Lab 新推出的开放权重模型，是一个在 45 万亿 tokens 上训练的 975B 参数 MoE transformer。DeepSeek-V4 是一个流行的 LLM，在此版本中受益于专门的路由内核和融合操作。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://thinkingmachines.ai/news/introducing-inkling/">Inkling: Our Open-Weights Model - Thinking Machines Lab</a></li>
<li><a href="https://docs.vllm.ai/en/latest/design/cuda_graphs/">CUDA Graphs - vLLM</a></li>

</ul>
</details>

**标签**: `#vLLM`, `#LLM inference`, `#release`, `#performance`, `#AI`

---

<a id="item-2"></a>
## [Claude 5 的上下文工程新规则](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) ⭐️ 8.0/10

Anthropic 发布了专门针对 Claude 5 的上下文工程新指南，详细说明了优化提示词和有效管理内存的策略。指南强调结构化上下文格式，并建议利用 Claude 的自动内存功能。 这些规则影响了开发者如何用 Claude 5 构建可靠的 AI 代理，但也引发了对 Anthropic 特定工具依赖增加以及自动内存可靠性潜在问题的担忧。社区反响不一，凸显了性能提升与灵活性之间的权衡。 新指南据说包括防止自动内存越界的技术，例如抑制不必要的内存写入，并推荐为任务上下文提供冗长指令。然而，社区成员报告称 Claude 5 的自动内存仍可能产生不合理的跳跃，且由于初始失败，token 使用量可能增加。

hackernews · mellosouls · 7月25日 20:42 · [社区讨论](https://news.ycombinator.com/item?id=49051361)

**背景**: 上下文工程是指在推理过程中设计并维护提供给 LLM 的最优 token 集合的实践，包括提示词和从内存中检索的任何额外上下文。它超越了基本的提示工程，通过管理 AI 代理如何检索和使用长期内存，对于复杂的多步骤任务至关重要。Anthropic 发布了针对 Claude 5 的具体指南，以提高代理工作流程的可靠性和一致性。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents">Effective context engineering for AI agents \ Anthropic</a></li>
<li><a href="https://github.com/anthropics/claude-code/issues/44829">Feature request: Suppress auto-memory system prompt when autoMemoryEnabled=false · Issue #44829 · anthropics/claude-code</a></li>

</ul>
</details>

**社区讨论**: 评论者对新规则表示怀疑，认为这是通过 Anthropic 特定的内存功能走向供应商锁定的举动。一些人报告了自动内存的实际问题，例如意外删除和模型初始失败时 token 消耗过多。另一些人将冗长的指令风格与更简单的对话方式进行了不利比较。

**标签**: `#context engineering`, `#Claude 5`, `#LLM`, `#Anthropic`, `#prompt engineering`

---

<a id="item-3"></a>
## [开放权重人工智能模仿 Kubernetes 成为基础设施标准](https://tobi.knaup.me/2026-07-25-open-weight-ai-is-having-its-kubernetes-moment/) ⭐️ 8.0/10

一篇文章认为，开放权重 AI 模型正沿着与 Kubernetes 相同的轨迹发展，成为 AI 部署的默认基础设施层。文章强调开放权重模型为推理成本提供了基准，并促进了协作开发，类似于 Kubernetes 在容器编排中的作用。 这一比较意义重大，因为它表明开放权重模型可能标准化 AI 基础设施，减少供应商锁定，并促进更广泛的采用。如果开放权重模型成为事实标准，它们可能降低成本并推动跨行业创新，就像 Kubernetes 对云原生计算所做的那样。 开放权重模型与开源 AI 的不同之处在于它们缺少训练代码和数据，但仍允许自由使用和修改模型权重。文章指出，美国实验室需要在宽松许可下发布有竞争力的开放权重模型，以便初创公司在此基础上构建，这与 Kubernetes 社区的协作模式相呼应。

hackernews · tknaup · 7月25日 14:49 · [社区讨论](https://news.ycombinator.com/item?id=49048034)

**背景**: 开放权重模型是一种其参数（权重）公开发布的 AI 模型，允许任何人下载、使用和修改。然而，与开源软件不同，开放权重模型通常不包含训练代码或数据集。Kubernetes 是一个开源容器编排平台，已成为部署和管理容器化应用的行业标准。这一比较表明，开放权重模型也可能类似地成为 AI 工作负载的默认基础设施层，为构建和部署模型提供共同基础。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://hai.stanford.edu/ai-definitions/what-is-an-open-weight-model">What is an Open-Weight Model? - Stanford HAI</a></li>
<li><a href="https://opensource.org/ai/open-weights">Open Weights: not quite what you’ve been told</a></li>
<li><a href="https://promptmetheus.com/resources/llm-knowledge-base/open-weights-model">Open-weights Model | LLM Knowledge Base</a></li>

</ul>
</details>

**社区讨论**: 评论者讨论了禁止中国模型的可行性，指出权重只是数字，其来源无法追溯。一些人强调了 AI 定价（代币经济学）的波动性，并认为开放权重模型可以提供成本基准。其他人设想未来公司合作开发共享的开放权重模型，类似于 Linux 或 Kubernetes，以减少重复劳动。

**标签**: `#open-weight AI`, `#Kubernetes`, `#open source`, `#AI models`, `#infrastructure`

---

<a id="item-4"></a>
## [Ruff v0.16.0 默认启用 413 条规则](https://simonwillison.net/2026/Jul/25/ruff/#atom-everything) ⭐️ 8.0/10

Ruff v0.16.0 将默认 lint 规则从 59 条增加到 413 条，导致使用未固定依赖项的项目出现破坏性变更。此版本包括了来自 B、UP 和 RUF 等新类别的规则。 默认规则的急剧扩展显著提升了 Python 开发者的代码质量检查能力，无需额外配置即可捕获语法错误和运行时错误等严重问题。然而，这可能导致依赖先前较小规则集的项目出现 CI 失败。 此更新包括标记语法错误（PLE0118）和即时运行时错误（PLE0100）的规则。拥有全面测试套件的项目可以安全地使用 \`ruff check . --fix --unsafe-fixes\` 应用自动化修复，正如作者在三个主要项目上演示的那样。

rss · Simon Willison · 7月25日 22:44

**背景**: Ruff 是一个用 Rust 编写的快速 Python linter 和代码格式化工具，由 Astral 开发。在 v0.16.0 之前，默认规则集自 v0.1.0 以来基本未变，尽管规则总数从 708 条增长到 968 条。新的默认规则旨在引起对先前默认未启用的严重问题的关注，使 Ruff 开箱即用更有效。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://docs.astral.sh/ruff/rules/">Rules | Ruff - Astral</a></li>
<li><a href="https://docs.astral.sh/ruff/rules/load-before-global-declaration/">load-before-global-declaration (PLE0118) | Ruff</a></li>

</ul>
</details>

**标签**: `#ruff`, `#python`, `#linting`, `#astral`

---

<a id="item-5"></a>
## [携程被罚后公布 19 项整改措施](https://mp.weixin.qq.com/s/6pfOO4iorcdUFb2zLNhFSw) ⭐️ 8.0/10

2026 年 7 月 25 日，携程在收到国家市场监督管理总局的反垄断处罚后，宣布了 19 项整改措施。这些措施包括停止独家合作、取消不合理的&\#x27;全网最低价&\#x27;要求以及下架部分促销类别。 这一行动反映了中国在科技领域持续的反垄断执法，特别是针对在线旅游行业中的反竞争行为。它为其他使用独家协议和价格平价条款的平台树立了先例，可能重塑行业实践。 关键措施包括全面下线&\#x27;一级委托分销（特牌）&\#x27;合作模式、取消&\#x27;智选特惠&\#x27;等促销类别，并停止要求&\#x27;全网最低价&\#x27;。携程还承诺建立新的流量分配机制，并加强反垄断合规管理体系建设。

telegram · zaihuapd · 7月25日 11:56

**背景**: 携程是中国领先的在线旅游平台。近年来，中国监管机构加强了反垄断执法，针对独家交易和最惠国待遇条款等损害竞争的行为。国家市场监管总局的处罚要求携程在规定时间内纠正这些行为，此前已有类似针对其他科技巨头的行动。

<details><summary>参考链接</summary>
<ul>
<li><a href="https://www.zaobao.com.sg/news/china/story20260725-9419359">涉垄断被罚后 携程确定立即停止独家合作 | 联合早报</a></li>
<li><a href="https://www.ithome.com/0/981/515.htm">携程集团就市场监管总局行政处罚决定公布 19 项整改措施：停止独家合...</a></li>
<li><a href="https://news.qq.com/rain/a/20260117A01RKF00">携程合作模式的三层逻辑：反垄断如何重塑酒店分销权力天平？</a></li>

</ul>
</details>

**标签**: `#antitrust`, `#regulation`, `#Ctrip`, `#online travel`, `#China tech`

---