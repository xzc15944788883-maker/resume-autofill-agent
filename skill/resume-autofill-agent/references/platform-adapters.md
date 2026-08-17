# Platform Adapters / 平台适配

## Selection order / 选择顺序

Use a real probe, not an installation badge: / 必须用真实探测结果判断，不能只看“已安装”：

1. Host-native browser use or Computer Use. / 宿主原生 Browser Use 或 Computer Use。
2. Host browser skill or connector, such as Tencent WorkBuddy `agent-browser`. / 宿主浏览器 Skill 或连接器，例如腾讯 WorkBuddy 的 `agent-browser`。
3. Bundled Playwright persistent bridge. / 内置 Playwright 持久浏览器桥接器。
4. Native Chrome/Edge launch, user login, then loopback CDP attach. / 原生启动 Chrome/Edge，由用户登录后通过本机 CDP 接管。
5. Field-by-field manual fill sheet. / 逐字段手动填写清单。

After two identical initialization failures, switch routes. / 同一种初始化错误连续出现两次后切换方案。

## Codex on Windows / Windows 版 Codex

If the OpenAI Computer Use plugin exposes its runtime tools in the current task, list applications, select exactly one returned browser window, capture accessibility state, perform one action, and refresh state. Prefer Browser Use for browser-only tasks when available. Never infer that Computer Use is callable merely because its package exists on disk. / 若 OpenAI Computer Use 在当前任务中暴露了运行工具，应先列出应用、唯一选中目标浏览器窗口、获取无障碍状态，每次只执行一个动作并立即刷新。纯浏览器任务若有 Browser Use，应优先使用。不得因为磁盘上存在 Computer Use 安装包就声称当前任务可调用。

If Computer Use is installed but no runtime tool such as `node_repl`/`@oai/sky` is exposed, switch to the bundled bridge. / 若 Computer Use 已安装但当前任务没有暴露 `node_repl`/`@oai/sky` 等运行入口，改用内置桥接器。

## Tencent WorkBuddy / 腾讯 WorkBuddy

WorkBuddy can use this workflow, but it is a separate host application and is not a Codex plugin. / WorkBuddy 可以使用本流程，但它是独立宿主应用，不是 Codex 插件。

1. Install Tencent WorkBuddy from its official site and sign in. / 从官网下载并登录腾讯 WorkBuddy。
2. Open Skills, install `agent-browser` from SkillHub, and enable it. / 打开技能页，从 SkillHub 安装并启用 `agent-browser`。
3. Package the `resume-autofill-agent` folder as a ZIP, then choose Skills → Add Skill → Upload Skill. / 将 `resume-autofill-agent` 文件夹打包为 ZIP，在“技能 → 添加技能 → 上传技能”中导入。
4. Create a task, select the folder containing resumes and the authorized profile as the workspace, and enable both skills. / 新建任务，把包含简历和授权档案的文件夹设为工作空间，并启用两个 Skill。
5. Use Plan mode for the first run; use Craft mode after reviewing the plan. Keep default permissions for real personal data. / 首次使用选 Plan，审核流程后再用 Craft；处理真实个人信息时保持默认权限。
6. Ask it to build the profile, process the application queue, save verified drafts, and stop before every final submission. / 要求它建立档案、处理投递队列、保存已核验草稿，并在每次最终提交前停止。

Suggested prompt / 推荐提示词：

```text
Use resume-autofill-agent and agent-browser. Read the resumes and evidence in this workspace, build a verified profile, process the application URLs in application-queue.json one by one, upload the resume before fields that may be overwritten, save and verify each draft, and stop before every final submission for my confirmation.

使用 resume-autofill-agent 和 agent-browser。读取工作空间中的简历与证明，建立已核验档案，逐条处理 application-queue.json 中的岗位链接；可能覆盖字段时先上传简历，保存并核验每份草稿，每次最终提交前停下等待我确认。
```

Do not put raw profiles, IDs, family information, cookies, passwords, or tokens inside the imported Skill ZIP. / 不得把原始个人档案、证件、家庭信息、Cookie、密码或令牌放入导入的 Skill ZIP。
