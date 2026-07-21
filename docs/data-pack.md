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
| A | 重复发票 | BX-41610 / BX-41902 | 规则即可确定性发现 |
| B | 住宿超标准（合理例外） | BX-41002 | 规则/ML/NN 易误报；LLM/Agent 可排除 |
| C | 拆分报销 | BX-41881—84 | 规则遗漏；ML 起可发现 |
| D | 票据修改 | **BX-42306** | 规则遗漏；NN 起发现金额矛盾（**单笔主线**） |
| E | 个人消费伪装 | BX-42519 | 需语义与多源；LLM/Agent 发现 |
| F | 行程矛盾 | BX-42017 | 需跨系统取证；Agent 发现 |

## 与主线的关系

- **默认授课主线：** 情形 D / BX-42306（286 vs 86）  
- **高级扩展：** build 章 DeepDive 中用全包练习 A–F  

## 修改约定

改 CSV、情形、答案键或主线报销号时：更新本文件、`lecture-structure.md`、相关 `sections/*.md`，以及数据包内 README。  
