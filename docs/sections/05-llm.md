# 05 · llm — 从 ANN 到 LLM（七步详稿）

- **锚点：** `#llm`
- **侧栏：** 从 ANN 到 LLM（30′；可压到 18—20′）
- **标题：** 从 ANN 到 LLM
- **课纲边界：** 只讲模型怎样理解、训练、保存和调用；工具循环与自主行动留到第二部分 Agent

## 本章要交付的六个学习结果

初学者学完后必须能够用自己的话回答：

1. LLM 是什么，以及为什么它仍然属于神经网络
2. 相比上一章的简单 ANN，LLM 为处理语言增加了什么
3. 为什么“下一 Token 预测”能形成总结、抽取、问答和生成能力
4. LLM 怎样从语料、Loss、反向传播和参数更新中训练出来
5. 一个训练好的 LLM 在磁盘和内存中究竟长什么样
6. 网页或 Python 程序怎样通过请求调用推理服务

## 唯一叙事顺序

`LlmContextDemo` 不再按零散组件堆知识点，而是严格使用以下七步：

### 5.1 它是什么：从 ANN 连续走到 LLM

- BX-42519 多段文字冲突作为问题入口
- `AnnToLlmGapDiagram`：ANN 可以“认出文字”，但本题需要联系多段语境
- `llm-upgrade-grid`：一项保持不变、四项关键改进
  - 保持：仍是层、权重、Loss、反向传播组成的神经网络
  - 改进：Token 序列、Transformer、开放式序列输出、大规模预训练/对齐
- `AnnLlmSideBySide`：Softmax(10) 与 Softmax(|V|) 对照
- `Definition`：给出通俗与精确定义

本节记忆条：

> LLM = 神经网络底座 + Token 序列 + Transformer + 下一 Token 目标 + 大规模预训练

### 5.2 文字怎样进去：Token → ID → 向量 → 位置

- `TokenizeDiagram`
- 三个概念严格分开：Tokenizer 负责切分编号；Embedding 是可训练向量表；Position 表达先后关系

本节记忆条：

> 文字 → Token → Token ID → Embedding 向量 + 位置信息

### 5.3 网络怎样读写：Transformer 与逐 Token 生成

- `AttentionHeatmapDiagram` + `AttentionLab`：有重点地联系上下文，但关联权重不是事实证据
- `InlinePythonLab(attention)`：直接计算一次 Query/Key 相似度、Softmax 权重和 Value 加权汇总
- `TransformerStackDiagram`：Attention + MLP + 残差/归一化，堆叠为骨干
- `TransformerReferenceFigure`：在中文简化图之后展示论文原始编码器—解码器架构，并用四步导读区分 Encoder、Decoder、重复 Block 与现代生成式 LLM；图片本地保存，图注保留论文、Wikimedia Commons 与 CC BY-SA 4.0 许可链接
- `LlmPipeline`：Token 到 LM Head 的五步前向流程
- 唯一主线公式：`P(t_{n+1} | t_1...t_n)`
- `GenerationLoopDiagram` + `TokenLab`：选一个 Token、追加、再预测

本节记忆条：

> 读：Attention 联系上下文；写：预测一个 Token，再循环

### 5.4 怎样训练：误差怎样变成参数更新

- 五步训练数据链：治理语料 → 错位构造目标 → 前向与交叉熵 → 反向传播/优化器 → 验证并保存检查点
- `LanguageTrainingShift`：训练答案来自原文下一个 Token
- `LlmTrainingWorkbench`：随机初始化、训练开始、训练中、检查点四状态；同步显示预测、Loss 和参数状态
- `LlmLifecycleDiagram`：预训练 / 指令微调与对齐 / 推理必须分开
- `InlinePythonLab(language)`：可运行的微型神经语言模型，真实执行 Softmax、交叉熵、梯度更新、检查点保存和推理

本节记忆条：

> 预测 → 算 Loss → 反向传播 → 更新参数 → 重复；训练改变的是参数

### 5.5 训练后剩什么：检查点解剖

- `LlmCheckpointExplorer` 正式进入主线，不再作为散落的备用组件
- 四类文件：`config.json`、`tokenizer.json`、`model.safetensors`、`generation_config.json`
- 张量浏览：Embedding、Q/K/V、MLP、Norm、LM Head
- 明确加载关系：检查点被推理服务加载到 CPU/GPU；一次聊天通常不改权重

本节记忆条：

> 训练成品 = Tokenizer + 模型结构配置 + 训练后权重张量（+ 生成默认设置）

### 5.6 怎样调用：应用与推理服务

- `LlmCallLab`：应用组织 messages → HTTPS 请求 → 推理服务编码/生成 → 结构化响应
- 展示 request / response 的主要字段：model、messages、temperature、max_output_tokens、output、usage、stop_reason
- `ContextWindowDiagram`：系统提示、资料、对话历史和生成输出共同占用上下文窗口
- 静态 HTML 安全边界：密钥不可放在浏览器；生产调用应经过受控后端
- `InlinePythonLab(llm_call)`：可运行的无网络教学模拟器，完整打印 request、服务内部四步和 response

本节记忆条：

> 应用 → 请求(messages + 参数) → 推理服务 → Tokenizer/模型生成 → 响应

### 5.7 会什么、不会什么：能力与 Agent 缺口

- `WhyNextTokenDiagram`：语言结构、知识共现、长程依赖和规模效应
- `CapabilityBoundaryStrip`：总结、抽取、问答、改写等能力；幻觉、系统外未知和职业判断边界
- BX-42519 输出边界：可以形成矛盾点/缺失证据/核对建议；不能直接形成已核验事实或审计结论
- 结尾明确：LLM 只处理当前上下文；不会根据结果主动选择工具并循环，因此引出 Agent

## 讲师压缩策略

30分钟完整讲七步。压到18—20分钟时：

- 必须保留：5.1 定义与改进、5.2 Token、5.3 下一Token与Transformer、5.4 训练循环、5.5 检查点、5.6 调用、5.7 边界
- 可以压缩：Attention 数值互动、Python 训练日志逐行解释、生成采样参数
- 不可删除：检查点解剖和调用流程；它们直接对应“训练后长什么样、程序怎样使用”两个核心学习结果

## 对应代码

- `app/page.tsx`：`LlmContextDemo`、`LlmChapterRoute`、`LlmTrainingWorkbench`、`LlmCallLab`、`LlmCheckpointExplorer`
- `app/page.tsx`：`kernelExamples.language`、`kernelExamples.llm_call`
- `app/llm-diagrams.tsx`：Token / 生成 / Attention / Transformer / 生命周期 / 能力边界图示
- `app/course-interactives.tsx`：`LanguageTrainingShift`、`AttentionLab`
