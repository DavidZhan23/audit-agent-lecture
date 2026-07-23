# Toy Data Pack 与案例情形

物理目录：`public/toy_audit_case/`（说明见该目录 `README.md`、`data_dictionary.md`）

## 两类数据（禁止混用）

| 类型 | 用途 | 路径 |
|------|------|------|
| 本期待审 | 推理、调查、人工复核 | `data/*.csv` + 制度 md |
| 历史训练 | 仅课堂训练/验证 | `classroom_training/ml_training_examples.csv`（300 条：240 训 + 60 验） |

把本期待审答案放进训练集 = **数据泄漏**。

## 本期待审表（9）

| 文件 | 角色 |
|------|------|
| `expense_claims.csv` | 报销核心事实 |
| `employees.csv` | 员工主数据 |
| `invoice_registry.csv` | 发票查验 / 重复线索 |
| `approvals.csv` | 审批与例外 |
| `flight_records.csv` | 航班行程 |
| `hotel_records.csv` | 酒店入住 |
| `customer_visits.csv` | CRM 拜访 |
| `receipt_ocr.csv` | OCR / 二维码 / 图像完整性 |
| `employee_calendar.csv` | 员工日历 |

制度：`policy_documents/expense_policy.md`、`special_event_notice.md`
讲师答案：`instructor_answer_key/expected_findings.csv`

## 六情形（A–F）与技术映射

与 `app/page.tsx` 中 `auditCases` / `CaseMatrix` 一致：

| 情形 | 标题 | 报销线索 | 教学意图（相对五阶段） |
|------|------|----------|------------------------|
| A | 重复发票 | BX-41610 / BX-41902 | **规则章主案例**：规则即可确定性发现 |
| B | 住宿超标准（合理例外） | BX-41002 | 规则/ML/NN 易误报；LLM/Agent 可排除 |
| C | 拆分报销 | BX-41881—84 | **ML章主案例**：规则难以穷举弱信号组合；ML提高核查优先级 |
| D | 票据修改 | **BX-42306** | **ANN章主案例**：从票据像素识别286，并与平台86形成矛盾线索 |
| E | 个人消费伪装 | BX-42519 | **LLM章主案例**：理解周日、儿童餐、生日蛋糕、CRM无拜访和日历之间的语义矛盾 |
| F | 行程矛盾 | BX-42017 | **Agent章主案例**：航班返回南京后，动态扩展查询酒店、CRM和日历 |

## 与主线的关系

- **课程顶层架构不是案例阶梯：** 三部分依次为技术基础、Agent基础与架构、Agent在审计中的应用。
- **第一部分内部案例：** A → C → D → E，用于解释规则、ML、ANN和LLM为什么逐层出现。
- **第二部分演示：** F / BX-42017用于章节07验证Agent的工具反馈循环，不替代章节06—09的通用架构正文。
- **情形B定位：** 合理例外，用于说明规则/模型可能误报以及制度上下文的重要性；不占第一部分四个主案例。
- **第三部分组合应用：** `#audit-architecture` 用九表两制度说明数据来源与证据链，`#audit-evidence` 以BX-42017形成五字段证据包；案例矩阵作为折叠扩展比较A–F。
- **统一边界：** 案例输出可复核疑点或核查优先级，不自动认定违规、错报或舞弊。

## 修改约定

改 CSV、情形、答案键或主线报销号时：更新本文件、`lecture-structure.md`、相关 `sections/*.md`，以及数据包内 README。
