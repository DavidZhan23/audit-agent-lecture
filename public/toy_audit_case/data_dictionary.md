# 数据字典与关联关系

| 文件 | 数据类型 | 记录数 | 用途 |
|---|---|---:|---|
| employees.csv | 员工主数据 | 8 | 用employee_id关联员工、部门与所在城市。 |
| expense_claims.csv | 报销明细 | 26 | 核心事实表，每行一笔报销；toy sample共26笔。 |
| invoice_registry.csv | 发票查验与重复库 | 26 | 包含发票真伪、平台金额和重复使用线索。 |
| approvals.csv | 审批记录 | 10 | 用approval_id关联报销，识别事前审批和有效例外。 |
| flight_records.csv | 航班行程 | 6 | 用trip_id和employee_id核对真实抵达城市。 |
| hotel_records.csv | 酒店入住 | 6 | 用trip_id核对员工所在城市和住宿金额。 |
| customer_visits.csv | 客户拜访CRM | 6 | 核对业务目的、客户地点和联系人状态。 |
| receipt_ocr.csv | 票据OCR与图像检查 | 7 | 表示从票据图片中提取的文字、金额、明细和完整性分数。 |
| employee_calendar.csv | 员工日历 | 4 | 用employee_id和event_date核对业务日程和个人日程。 |

## 主要关联键

- 报销主键：`claim_id`
- 员工关联：`employee_id`
- 行程关联：`trip_id`
- 发票关联：`invoice_no`
- 审批关联：`approval_id`
- 时间对齐：`claim_date`、`flight_date`、`check_in_date`、`visit_date`、`event_date`

## 证据链示例

`BX-42017` → 在报销表取得 `employee_id=E1004` 和 `trip_id=T2017` → 连接航班、酒店、CRM、日历和发票表 → 形成可复核的行程矛盾证据链。
