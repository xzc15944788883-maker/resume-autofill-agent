# Resume Autofill Agent / 简历自动填写 Agent

[![MIT License](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)
![Bilingual](https://img.shields.io/badge/中文%20%2B%20English-ready-2563eb)
![Human in the loop](https://img.shields.io/badge/final%20submit-human%20confirmed-f97316)

> A bilingual agent for organizing verified candidate information and filling online application forms.
>
> 整理可复用的个人信息，并协助填写不同招聘网站的简历表单。

Many recruitment websites do not parse uploaded resumes reliably. Dates may be wrong, education entries may be duplicated, project fields may be misplaced, and uploading a resume may overwrite information entered earlier.

Resume Autofill Agent organizes resumes, certificates, projects, videos, and repository evidence into one reusable verified profile. It can process one application or a list of roles, select relevant materials, adapt wording without inventing facts, upload the resume in a safe order, correct parsing mistakes, fill form fields, check critical information, and save a reviewed draft.

简历自动填写 Agent 会把简历、证书、项目、视频和代码仓库整理成一份可复用、可溯源的个人资料。它可以处理单个网申或岗位列表，选择相关材料，在不编造事实的前提下调整表达，按安全顺序上传简历，修复解析错误，填写并核验表单，最后保存草稿。

### 常见处理方式 / Typical workflow

- 官网能解析：先上传，再逐项核验解析结果。 / If parsing works, upload first and verify every result.
- 官网解析错误：根据已核验资料修正错误字段。 / If parsing fails, rebuild the form from the verified profile.
- 不同公司字段不一样：识别标签、下拉框、日期控件和重复经历模块。 / Adapt to labels, selects, date widgets, and repeated sections.
- 附件限制不一样：自动选择最相关的简历、作品视频、压缩包和仓库链接。 / Match resumes, demo videos, archives, and repository links to each portal.
- 中途登录、验证码或页面异常：暂停并保留进度，处理后继续。 / Pause for login, CAPTCHA, or page errors without losing queue state.
- 到最终提交：必须由你确认，避免误提交。 / Require confirmation at final submit to prevent mistakes.

## What it automates / 它能自动完成什么

```text
Resumes + evidence
        ↓
Verified reusable profile
        ↓
Role-aware wording + portfolio selection
        ↓
Resume upload → parser repair → form fill → attachment check
        ↓
Verified draft queue
        ↓
Your final confirmation → submit
```

## Core features / 核心功能

- **Resume parser repair / 修复简历解析** — upload first when needed, then restore wrong or overwritten fields.
- **Multi-site application queue / 多官网批量队列** — process company-role links one by one with resumable status.
- **Evidence-first writing / 有证据的岗位适配** — rewrite for relevance without inventing employers, metrics, or ownership.
- **Portfolio selection / 作品附件选择** — match demo videos, archives, and repository links to the role and file limits.
- **Reusable candidate profile / 可复用个人资料** — remember source, confidence, conflicts, and application-only placeholders outside the public Skill.
- **Browser fallback ladder / 多级浏览器控制** — native Browser Use, Computer Use, WorkBuddy `agent-browser`, Playwright, then native Chrome/Edge + CDP.
- **Draft verification / 草稿核验** — read back identity, dates, education, repeated sections, and displayed filenames.
- **Submission confirmation / 提交前确认** — complete and review the draft, then stop before the final submit action.

## Installation / 安装

Clone the repository, then copy the skill package into your Codex skills directory.

克隆仓库，然后把 Skill 包复制到 Codex 的 skills 目录。

### Windows PowerShell

```powershell
git clone https://github.com/xzc15944788883-maker/student-resume-autofill-skill.git
Copy-Item -Recurse -Force .\student-resume-autofill-skill\skill\student-resume-autofill "$HOME\.codex\skills\student-resume-autofill"
```

### macOS / Linux

```bash
git clone https://github.com/xzc15944788883-maker/student-resume-autofill-skill.git
cp -R student-resume-autofill-skill/skill/student-resume-autofill ~/.codex/skills/
```

Restart Codex or open a new task after installation. / 安装后重启 Codex，或新建一个任务。

## 60-second quick start / 60 秒开始使用

1. Put your latest resume, older resumes, certificates, portfolio files, and a text file of application URLs in one authorized workspace. / 把最新简历、旧简历、证书、作品附件和岗位链接放进一个授权工作目录。
2. Open the target application page, or create `application-queue.json` from the included template. / 打开目标网申页面，或从模板创建 `application-queue.json`。
3. Start a new Codex task and use this prompt: / 新建 Codex 任务并发送：

```text
Use $student-resume-autofill. Read the resumes and evidence in this workspace, build a verified reusable profile, process the application URLs one by one, upload the resume before fields that may be overwritten, save and verify every draft, and stop before each final submission.

使用 $student-resume-autofill。读取工作空间中的简历和证明，建立可复用的已核验档案，逐个处理岗位链接；可能覆盖字段时先上传简历，保存并核验每份草稿，每次最终提交前停下等待我确认。
```

4. Complete login, CAPTCHA, passkey, or MFA yourself when requested. / 遇到登录、验证码、通行密钥或 MFA 时由你接管完成。
5. Review the draft summary, then confirm only the applications you actually want to submit. / 检查草稿汇总，只确认真正要投递的岗位。

## Browser control: how it works / 浏览器到底怎么接

The Skill probes routes in this order and switches after two identical initialization failures: native Browser Use or Computer Use → host browser skill → bundled Playwright bridge → native Chrome/Edge + local CDP. / Skill 会按以下顺序真实探测；同一种初始化错误连续两次后自动换路：原生 Browser Use 或 Computer Use → 宿主浏览器 Skill → 内置 Playwright → 原生 Chrome/Edge + 本机 CDP。

### Route A: bundled persistent browser / 方案 A：内置持久浏览器

Codex will prefer any native browser or computer-use capability already available. If none works, install the lightweight local bridge dependency once:

Codex 会优先使用已有的原生 browser 或 computer-use 能力。若都不可用，只需为本地桥接器安装一次轻量依赖：

```bash
cd skill/student-resume-autofill/scripts/browser-bridge
npm ci --ignore-scripts
node browser_bridge.cjs --doctor
node browser_bridge.cjs --url "https://company.example/application"
```

The bridge uses installed Edge, Chrome, or Chromium with a separate persistent profile. It never copies the main browser profile or extracts cookies, tokens, or passwords. Login, CAPTCHA, passkeys, and MFA remain user-controlled. / 桥接器使用已安装的 Edge、Chrome 或 Chromium，并创建独立持久配置；不会复制主浏览器资料，也不会提取 Cookie、令牌或密码。登录、验证码、通行密钥及 MFA 始终由用户操作。

### Route B: Google login-safe native Chrome + CDP / 方案 B：原生 Chrome 登录后接管

If Google rejects a Playwright-launched browser as “not secure,” do not keep retrying. Start Chrome natively, finish login first, then attach locally:

如果 Google 提示“此浏览器或应用可能不安全”，不要反复重试。先原生启动 Chrome 并完成登录，再从本机接管：

```bash
cd skill/student-resume-autofill/scripts/browser-bridge
node native_cdp_launcher.cjs --doctor --browser chrome --port 9333
node native_cdp_launcher.cjs --browser chrome --port 9333 --url "https://company.example/application"
# Finish login in the opened Chrome window, then:
node browser_bridge.cjs --cdp "http://127.0.0.1:9333"
```

The port binds to loopback only. The bridge refuses remote CDP addresses and disconnects without closing the native browser, so the isolated login state can be reused. / 端口只绑定本机回环地址；桥接器拒绝远程 CDP 地址，断开时不会关闭原生浏览器，因此隔离登录态可以复用。

## Tencent WorkBuddy / 腾讯 WorkBuddy

Yes. [Tencent WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Quickstart) can run this workflow as a separate host application. It is not a Codex plugin and is not currently installed automatically with this repository. / 可以。[腾讯 WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Quickstart) 能作为独立宿主运行本流程；它不是 Codex 插件，也不会随本仓库自动安装。

1. Install and sign in to Tencent WorkBuddy. / 安装并登录腾讯 WorkBuddy。
2. In [Skills](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market), install and enable [`agent-browser`](https://staging.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/WorkBuddy-Zero-Cost-Skill-Top-10/Agent-Browser) from SkillHub. / 在[技能页](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)从 SkillHub 安装并启用 [`agent-browser`](https://staging.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/WorkBuddy-Zero-Cost-Skill-Top-10/Agent-Browser)。
3. Zip the Skill package: / 打包本 Skill：

```powershell
python .\skill\student-resume-autofill\scripts\package_skill.py --output .\student-resume-autofill.zip
```

4. Choose **Skills → Add Skill → Upload Skill**, select the ZIP, and enable it. / 选择“技能 → 添加技能 → 上传技能”，导入 ZIP 并启用。
5. Create a task, set the resume folder as the workspace, enable both `student-resume-autofill` and `agent-browser`, and use the quick-start prompt above. Start in Plan mode; move to Craft after reviewing the plan. / 新建任务，把简历文件夹设为工作空间，同时启用两个 Skill；首次使用选 Plan，审核流程后再切 Craft。

WorkBuddy officially supports local Skill-package upload, SkillHub, and an `agent-browser` skill for page opening, reading, scrolling, clicking, screenshots, and form inspection. Keep default permissions for real personal data. / WorkBuddy 官方支持上传本地 Skill 包、SkillHub 和用于网页打开、读取、滚动、点击、截图与表单检查的 `agent-browser`；处理真实个人信息时建议保持默认权限。

## Example prompts / 使用示例

```text
Use $student-resume-autofill to read the resumes in this folder, build a verified profile, and fill the application as a saved draft without submitting.

使用 $student-resume-autofill 读取这个文件夹里的简历，建立可溯源档案，填写网申并保存草稿，不要提交。
```

```text
Use $student-resume-autofill to select the most relevant demo video and repository for this AI product role, check privacy and file limits, and prepare the application attachments.

使用 $student-resume-autofill 为这个 AI 产品岗位选择最相关的演示视频和代码仓库，检查隐私及文件限制，并准备网申附件。
```

```text
Use $student-resume-autofill to inspect the open application page, upload my resume first, fill verified fields, and save a draft. If native browser control fails, use the bundled Playwright bridge. Do not submit.

使用 $student-resume-autofill 检查已打开的网申页面，先上传简历，再填写已核验字段并保存草稿。若原生浏览器控制失败，使用内置 Playwright 桥接器。不要提交。
```

```text
Use $student-resume-autofill to turn these 30 application URLs into a verified draft queue. Skip duplicates and closed roles, adapt only evidence-backed content, and stop before each final submission.

使用 $student-resume-autofill 把这 30 个岗位链接处理成已核验草稿队列；跳过重复或已关闭岗位，只做有证据的岗位适配，每次最终投递前停下确认。
```

## Safety model / 安全原则

The skill treats user confirmation and current official records as higher priority than resumes, and treats old resumes as low-priority gap fillers. Model suggestions never become facts without confirmation. Sensitive declarations and irreversible actions always remain under user control.

本 Skill 将用户当前确认和官方材料置于简历之上，旧简历只作为低优先级补充；模型建议在确认前绝不视为事实。敏感声明和不可逆操作始终由用户最终控制。

Real personal information must stay outside the skill directory. The included templates use placeholders only, and the privacy guard can scan for common Chinese identity numbers, mobile numbers, email addresses, and long numeric identifiers.

真实个人信息必须保存在 Skill 目录之外。内置模板只含占位符；隐私工具可扫描常见中国身份证号、手机号、邮箱及长数字标识。

## Repository layout / 仓库结构

```text
skill/student-resume-autofill/
├── SKILL.md
├── agents/openai.yaml
├── assets/
│   ├── student-profile-template.json
│   └── application-queue-template.json
├── references/
│   ├── intake-and-profile.md
│   ├── intake-and-profile.zh-CN.md
│   ├── fill-and-safety.md
│   ├── fill-and-safety.zh-CN.md
│   ├── browser-control.md
│   ├── browser-control.zh-CN.md
│   ├── batch-application.md
│   └── platform-adapters.md
└── scripts/
    ├── profile_guard.py
    ├── package_skill.py
    └── browser-bridge/
        ├── browser_bridge.cjs
        ├── native_cdp_launcher.cjs
        ├── package.json
        └── package-lock.json
```

## Privacy guard / 隐私工具

```bash
python skill/student-resume-autofill/scripts/profile_guard.py init --output profile.json
python skill/student-resume-autofill/scripts/profile_guard.py sanitize --input private.json --output shared.json
python skill/student-resume-autofill/scripts/profile_guard.py audit --path skill/student-resume-autofill
```

## License / 许可证

Released under the [MIT License](LICENSE). / 使用 [MIT License](LICENSE) 开源。
