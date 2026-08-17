# Student Resume Autofill Skill / 学生简历自动填写 Skill

A bilingual, evidence-first Codex skill for building reusable student profiles, preparing portfolio attachments, and safely filling recruitment or school application drafts.

一个中英文双语、以证据为基础的 Codex Skill：整理可复用学生档案、准备作品附件，并安全填写招聘或升学网申草稿。

## Highlights / 核心能力

- Starts from available resumes and files; asks for a resume only when none exists. / 优先读取已有简历与文件，完全没有时才索要简历。
- Tracks source, priority, confidence, conflicts, and application-only placeholders. / 记录来源、优先级、置信度、冲突和网申专用占位值。
- Rewrites content for the target role without inventing facts. / 根据岗位优化表达，但不编造事实。
- Manages videos, archives, demos, and repository links as portfolio evidence. / 将视频、压缩包、演示和代码仓库作为作品证据管理。
- Uploads resumes before manual filling when parsers may overwrite fields. / 网站可能覆盖字段时，先上传简历再手动填写和复核。
- Saves and verifies drafts; never submits, signs, or consents without explicit confirmation. / 保存并验证草稿，未经明确确认不提交、不签署、不授权。
- Includes a dependency-free privacy guard for initialization, sanitization, and PII-pattern audits. / 内置无第三方依赖的档案初始化、脱敏与隐私模式扫描工具。
- Controls live forms through an available native browser/computer-use tool or the bundled isolated Playwright bridge. / 可使用宿主原生 browser/computer-use，或内置的隔离 Playwright 桥接器直接操作真实表单。
- Verifies browser control with a real page probe and switches routes after repeated initialization failures. / 通过真实页面探测验证控制能力；初始化连续失败时自动切换方案。

## Installation / 安装

Clone the repository, then copy the skill package into your Codex skills directory.

克隆仓库，然后把 Skill 包复制到 Codex 的 skills 目录。

### Windows PowerShell

```powershell
git clone https://github.com/YOUR_GITHUB_ACCOUNT/student-resume-autofill-skill.git
Copy-Item -Recurse -Force .\student-resume-autofill-skill\skill\student-resume-autofill "$HOME\.codex\skills\student-resume-autofill"
```

### macOS / Linux

```bash
git clone https://github.com/YOUR_GITHUB_ACCOUNT/student-resume-autofill-skill.git
cp -R student-resume-autofill-skill/skill/student-resume-autofill ~/.codex/skills/
```

Restart Codex or open a new task after installation. / 安装后重启 Codex，或新建一个任务。

### Optional browser bridge / 可选浏览器桥接器

Codex will prefer any native browser or computer-use capability already available. If none works, install the lightweight local bridge dependency once:

Codex 会优先使用已有的原生 browser 或 computer-use 能力。若都不可用，只需为本地桥接器安装一次轻量依赖：

```bash
cd skill/student-resume-autofill/scripts/browser-bridge
npm install --ignore-scripts
node browser_bridge.cjs --doctor
```

The bridge uses installed Edge, Chrome, or Chromium with a separate persistent profile. It never copies the main browser profile or extracts cookies, tokens, or passwords. Login, CAPTCHA, passkeys, and MFA remain user-controlled. / 桥接器使用已安装的 Edge、Chrome 或 Chromium，并创建独立持久配置；不会复制主浏览器资料，也不会提取 Cookie、令牌或密码。登录、验证码、通行密钥及 MFA 始终由用户操作。

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
├── assets/student-profile-template.json
├── references/
│   ├── intake-and-profile.md
│   ├── intake-and-profile.zh-CN.md
│   ├── fill-and-safety.md
│   ├── fill-and-safety.zh-CN.md
│   ├── browser-control.md
│   └── browser-control.zh-CN.md
└── scripts/
    ├── profile_guard.py
    └── browser-bridge/
        ├── browser_bridge.cjs
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

