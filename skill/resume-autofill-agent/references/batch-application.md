# Batch Application Workflow / 批量投递流程

## Goal / 目标

Turn one verified profile into a controlled queue of role-aware application drafts across different company portals. Automate repetitive reading, rewriting, uploads, field entry, and verification; keep the final decision with the user. / 把一份已核验档案转成跨公司官网、按岗位适配的投递草稿队列。自动完成重复的信息读取、内容改写、附件上传、字段填写和核验，把最终投递决定留给用户。

## Queue setup / 建立队列

1. Copy `assets/application-queue-template.json` outside the Skill directory. / 将模板复制到 Skill 目录外。
2. Add one unique company-role URL per item. Do not queue duplicate company-role pairs. / 每条只放一个唯一“公司—岗位—链接”，不得重复。
3. Keep mode `verified_draft` by default. / 默认保持 `verified_draft` 模式。
4. Rank by role fit and deadline; process one item at a time. / 按岗位匹配度和截止时间排序，每次处理一条。

Use these statuses: `pending`, `in_progress`, `needs_user`, `draft_saved`, `submitted`, `skipped`, `failed`. / 使用这些状态：待处理、处理中、需用户操作、草稿已保存、已投递、已跳过、失败。

## Per-application loop / 单条处理循环

1. Verify the company, role, domain, deadline, and whether the listing is still open. / 核验公司、岗位、域名、截止时间和招聘状态。
2. Select only evidence relevant to the role; never broaden claims. / 只选择岗位相关证据，不扩大事实。
3. Open the form, detect upload/parser behavior, and upload the resume first when parsing may overwrite values. / 打开表单，识别简历解析行为；可能覆盖字段时先上传简历。
4. Fill one section at a time and re-read critical values. / 分模块填写并回读关键值。
5. Prepare role-relevant attachments and verify displayed filenames. / 准备岗位相关附件并核对页面文件名。
6. Save a draft, record unresolved fields and evidence used, then update the queue. / 保存草稿，记录未解决字段和所用证据，再更新队列。
7. Stop at the final submit action. Request immediate confirmation for this exact company and role. / 停在最终提交前，针对当前公司和岗位请求即时确认。

## Stop rules / 停止规则

Set `needs_user` and continue with another queue item only when safe if the site requires login, CAPTCHA, MFA, a legal declaration, family or health data, an unsupported attachment conversion, or an ambiguous required answer. / 遇到登录、验证码、MFA、法律声明、家庭或健康信息、不支持的附件转换、含义不明的必填项时，标记为 `needs_user`；只有在安全的情况下才继续下一条。

Do not defeat rate limits, anti-bot checks, portal terms, geographic restrictions, or duplicate-application controls. Do not submit to roles outside the user's stated target. / 不绕过频率限制、反机器人检查、网站条款、地域限制或重复投递控制；不投递到用户目标范围之外的岗位。

## Completion summary / 完成汇总

Report counts for drafts saved, needs-user items, failures, skips, and confirmed submissions. For each item, retain the URL, timestamp, resume variant, attachments, unresolved fields, and verification outcome. / 汇总草稿数、待用户处理数、失败数、跳过数和已确认投递数；每条保留链接、时间、简历版本、附件、未解决字段及核验结果。
