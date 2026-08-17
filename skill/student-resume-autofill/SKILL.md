---
name: student-resume-autofill
description: Build a verified student profile from resumes and evidence, prepare portfolio attachments, fill recruitment or school application forms, resolve conflicts, and save drafts without submitting. Use for student resumes, campus recruitment, internships, graduate applications, PDF/DOCX resumes, certificates, videos, archives, repositories, and browser forms. 从简历和证明材料建立可溯源的学生档案，准备作品附件，填写招聘或升学网申，处理信息冲突并只保存草稿；适用于学生简历、校园招聘、实习、研究生申请、PDF/DOCX、证书、视频、压缩包、代码仓库和浏览器表单。
---

# Student Resume Autofill / 学生简历自动填写

## Core workflow / 核心流程

1. Inspect current attachments, workspace files, and authorized local profiles before asking questions. / 先检查当前附件、工作区文件和获准使用的本地档案，再提问。
2. Start from any usable resume or profile. Ask for a resume only when none exists. / 只要存在可用简历或档案就直接开始；完全没有时才索要简历。
3. Build a source ledger for every material fact. / 为每个重要事实记录来源。
4. Ask only about missing, conflicting, sensitive, or blocking fields, with at most three short questions at once. / 只询问缺失、冲突、敏感或阻塞字段，每次最多三个简短问题。
5. Improve wording only from verified evidence and target-role relevance. / 只依据已核验材料和岗位相关性优化表达。
6. Select and prepare the smallest relevant portfolio set. / 选择并准备最精简、最相关的作品附件。
7. Select a browser-control route, then upload the resume before manual filling when parsing may overwrite fields. / 选择浏览器控制方案；若网站会解析并覆盖字段，先上传简历，再手动填写和复核。
8. Read back critical fields and save a verified draft. Never submit, sign, consent, or make an irreversible declaration without explicit confirmation immediately before the action. / 回读关键字段并保存已核验草稿；未经操作前的明确确认，不得提交、签署、同意或作出不可逆声明。

Read the detailed intake guide in the user's preferred language: [English](references/intake-and-profile.md) | [中文](references/intake-and-profile.zh-CN.md).

按用户偏好的语言读取详细采集指南：[English](references/intake-and-profile.md) | [中文](references/intake-and-profile.zh-CN.md)。

## Source priority / 来源优先级

Use this order: / 按以下顺序处理冲突：

1. Current explicit user confirmation / 用户当前明确确认；
2. Current official record or active-form value entered by the user / 当前官方材料或用户在表单中亲自填写的值；
3. Latest verified resume or profile / 最新且已核验的简历或档案；
4. Older resumes, marked low priority / 旧简历，标记为低优先级；
5. Model suggestions, never treated as facts until confirmed / 模型建议，确认前绝不视为事实。

Keep conflicting versions with source, date/version, confidence, and selection reason. / 保留冲突版本，并记录来源、日期或版本、置信度及采用理由。

## Supplement without fabrication / 补充但不编造

Allow evidence-preserving transformations: reorganize verified material, rewrite bullets as action-method-result, derive demonstrated skills, shorten or translate text, and apply a user-authorized form-only placeholder rule. / 可进行不改变事实的加工：重组已核验材料、按行动-方法-结果改写、提取已有证据支持的技能、精简或翻译，以及使用用户授权的表单专用占位规则。

Never invent employers, dates, metrics, awards, authorship, credentials, family details, health or political information, declarations, or project ownership. Never turn an application placeholder into a remembered fact. / 不得编造雇主、日期、指标、奖项、署名、证书、家庭信息、健康或政治信息、声明及项目归属；不得把网申占位值写成长期事实。

## Portfolio and repositories / 作品附件与代码仓库

- Inspect names and archive contents before describing or uploading. / 描述或上传前检查文件名和压缩包内容。
- Maintain project, relevance, format, size, public link, evidence status, and delivery-copy history. / 记录项目、岗位相关性、格式、大小、公开链接、证据状态及投递副本历史。
- Keep originals unchanged; rename, compress, or transcode only delivery copies. / 原件保持不变；仅对投递副本改名、压缩或转码。
- Check file type, size, count, metadata, hidden files, and privacy before upload. / 上传前检查类型、大小、数量、元数据、隐藏文件和隐私。
- Prefer a short representative demo plus a verified repository link when attachments are limited. / 附件受限时，优先短演示视频加已核验仓库链接。
- Treat account ownership, repository evidence, and the student's own contribution as separate claims. / 区分账号归属、仓库证据和学生本人贡献。
- Record connector availability only; never store tokens, cookies, or credentials. / 只记录连接是否可用，绝不保存令牌、Cookie 或凭据。

Read the detailed safety guide in the user's preferred language: [English](references/fill-and-safety.md) | [中文](references/fill-and-safety.zh-CN.md).

按用户偏好的语言读取详细安全指南：[English](references/fill-and-safety.md) | [中文](references/fill-and-safety.zh-CN.md)。

## Browser control / 浏览器控制

Use the host's native browser or computer-use capability first. If it is absent or repeatedly fails to initialize, use the bundled isolated Playwright bridge; do not keep retrying a broken adapter. / 优先使用宿主已有的浏览器或 computer-use 能力。若能力不存在或连续初始化失败，改用内置的隔离 Playwright 桥接器，不要反复重试失效适配器。

Read the browser guide before operating a live form: [English](references/browser-control.md) | [中文](references/browser-control.zh-CN.md). The bridge supports page inspection, navigation, form filling, dropdowns, keyboard input, uploads, screenshots, and guarded clicks. / 操作真实表单前读取浏览器指南：[English](references/browser-control.md) | [中文](references/browser-control.zh-CN.md)。桥接器支持页面检查、导航、填写、下拉选择、键盘输入、上传、截图及带保护的点击。

## Privacy and memory / 隐私与记忆

- Never place real private data in this skill, examples, tests, or templates. / 不得把真实隐私数据写入本 Skill、示例、测试或模板。
- Keep raw data only in the active form or an authorized profile outside the skill directory. / 原始数据仅放在当前表单或 Skill 目录外的授权档案中。
- Redact identifiers in screenshots or artifacts intended for sharing. / 对准备分享的截图和文件进行身份信息脱敏。
- Update reusable memory only when authorized, with source and confidence. / 仅在用户授权时更新长期资料，并记录来源和置信度。
- Use [profile_guard.py](scripts/profile_guard.py) to initialize, sanitize, or audit profiles. / 使用 [profile_guard.py](scripts/profile_guard.py) 初始化、脱敏或审计档案。

## Completion report / 完成报告

Report sources used, fields completed, attachment choices, unresolved conflicts, placeholders, draft-save verification, and actions still requiring user confirmation. / 报告所用来源、已填字段、附件选择、未解决冲突、占位值、草稿保存验证，以及仍需用户确认的操作。

## Resources / 资源

- English intake: [intake-and-profile.md](references/intake-and-profile.md)
- 中文采集流程：[intake-and-profile.zh-CN.md](references/intake-and-profile.zh-CN.md)
- English safety guide: [fill-and-safety.md](references/fill-and-safety.md)
- 中文安全指南：[fill-and-safety.zh-CN.md](references/fill-and-safety.zh-CN.md)
- Blank profile / 空白档案：[student-profile-template.json](assets/student-profile-template.json)
- Privacy guard / 隐私工具：[profile_guard.py](scripts/profile_guard.py)
- English browser guide: [browser-control.md](references/browser-control.md)
- 中文浏览器指南：[browser-control.zh-CN.md](references/browser-control.zh-CN.md)
- Browser bridge / 浏览器桥接器：[browser_bridge.cjs](scripts/browser-bridge/browser_bridge.cjs)
