# 浏览器控制指南

## 选择控制方案

按顺序使用第一个能通过真实页面探测的方案：

1. 宿主原生 browser 或 computer-use：列出标签页并读取目标页面。
2. 已连接的浏览器 MCP 或扩展：执行一次“列出页面”或“页面快照”。初始化错误、服务工作进程不活跃、找不到标签页都视为探测失败。
3. 内置 Playwright 桥接器：启动隔离的持久浏览器配置，让用户在该窗口中完成登录或验证码。
4. 原生浏览器启动后通过本机 CDP 接管：身份提供商拒绝 Playwright 启动的浏览器时使用。用固定的本机调试端口和独立配置正常启动 Chrome 或 Edge，让用户先完成登录，再用 `--cdp` 接入桥接器。
5. 手动填写清单：仅在所有控制方案都失败时使用。

同一种初始化错误连续出现两次后，应记录错误并切换方案。安装完成或开关已启用不等于控制成功。

## Playwright 桥接器初始化

桥接器使用独立浏览器配置，不复制用户主浏览器的配置、Cookie、令牌或已保存密码。因此第一次打开时显示“空浏览器”并要求重新登录是预期行为，不是 Google 登录丢失。

默认优先使用 Chrome。解析器把最后一次成功使用的隔离配置记录在 Skill 目录外的 `~/.resume-autofill-agent/browser-state.json`，Playwright 与原生 CDP 后续都复用该路径。升级时还会识别旧版 `student-resume-autofill` 和 `browser-profile` 目录；发现多个已初始化配置时报告 `PROFILE_CONFLICT`，旧版共享目录无法安全判断属于 Chrome 还是 Edge 时报告 `AMBIGUOUS_LEGACY_PROFILE`。两种情况都拒绝打开浏览器，绝不猜测后启动一个空配置。Skill 不得删除状态文件或已选配置目录。

进入 `scripts/browser-bridge` 后运行：

```bash
npm install --ignore-scripts
node browser_bridge.cjs --doctor --browser chrome
node browser_bridge.cjs --browser chrome --url "https://example.com/application"
```

若宿主已经内置 `playwright` 或 `playwright-core`，桥接器会优先尝试使用，可能无需安装。`--doctor` 只检查依赖与浏览器，不打开网页。

尊重用户的浏览器偏好。用 `--browser chrome` 或 `--browser edge` 选择浏览器，用 `--executable "/path/to/chrome"` 指定安装文件。启动前运行 `--doctor`，检查 `profile`、`profileSource` 与 `profileState`；成功启动会自动记忆选择。若出现冲突，用 `--profile "/path/to/已登录隔离配置"` 成功启动一次即可永久锁定。不得把 `--profile` 指向日常主 Chrome/Edge 配置目录，解析器会主动拒绝，以免并发占用导致启动失败或配置损坏。若身份提供商在某个浏览器中无法登录，应切换到用户偏好的已安装浏览器，不要反复重试同一路线。

桥接器会移除 Playwright 默认的 `--enable-automation` 启动标记，因为部分身份提供商会拒绝暴露该标记的浏览器。这只用于兼容正常登录，不绕过验证码、MFA、风险检查或访问控制。

若仍被拒绝，不要继续重试。使用独立配置和固定的本机调试端口原生启动浏览器，在接管前完成登录，然后运行：

```bash
node native_cdp_launcher.cjs --doctor --browser chrome --port 9333
node native_cdp_launcher.cjs --browser chrome --port 9333 --url "https://example.com/application"
# 先在打开的浏览器中完成登录、验证码、通行密钥或 MFA。
node browser_bridge.cjs --cdp "http://127.0.0.1:9333"
```

调试端口只能绑定到回环地址，绝不暴露到网络。只有端口、浏览器和已记忆配置完全匹配时，原生启动器才会复用已占用端口；否则报告 `UNVERIFIED_CDP_ENDPOINT` 并停止。修复旧版正在运行的浏览器时，应同时传入 `--cdp` 和对应的隔离 `--profile` 路径接管一次，以记录其身份。断开 CDP 后原生浏览器保持打开，隔离登录态可继续复用。

读取标准输出，直到出现 `@@RESUMEFILL@@{"ready":true,...}`。保持进程运行，并通过标准输入每行发送一个 JSON 对象。只把以 `@@RESUMEFILL@@` 开头的行解析为协议响应。

## 命令协议

```json
{"cmd":"pages"}
{"cmd":"snapshot","includeValues":false}
{"cmd":"goto","url":"https://example.com/application"}
{"cmd":"fill","label":"姓名","value":"示例同学"}
{"cmd":"fill","placeholder":"电子邮箱","value":"从已核验档案读取的邮箱"}
{"cmd":"select","label":"学历","value":"master"}
{"cmd":"press","label":"毕业日期","key":"ArrowDown"}
{"cmd":"upload","selector":"input[type=file]","paths":["C:/delivery/resume.pdf"]}
{"cmd":"click","role":"button","name":"保存草稿"}
{"cmd":"screenshot","path":"C:/delivery/application-check.png","fullPage":true}
```

只有在可见标签、占位文字和角色都不稳定时才使用 CSS `selector`。`snapshot` 返回可见控件及邻近文字，密码始终脱敏。只有获准的本地核验需要时才设置 `includeValues`，不得把含敏感值的快照复制到公开产物。

## 操作顺序

1. 打开准确的申请链接，核对页面标题和域名。
2. 运行 `--doctor` 并核对 `profileSource`：复用 `remembered`，出现 `PROFILE_CONFLICT` 或 `AMBIGUOUS_LEGACY_PROFILE` 时指定已登录隔离路径修复；`canonical-new` 表示首次登录。若目标页证明已记忆会话确实过期，仍保留同一路径并让用户恢复会话。登录、验证码、通行密钥或 MFA 由用户在隔离窗口中完成，不索取或保存秘密信息。
3. 获取页面快照，将可见字段映射到来源账本。
4. 若简历解析可能覆盖字段，先上传简历并等待解析完成。
5. 按逻辑模块逐段填写，回读身份、日期、教育和重复条目。
6. 只上传通过隐私检查的投递副本，并核对页面显示的文件名和上传状态。
7. 只点击“保存草稿”等可逆控件。桥接器默认拦截类似“提交”的点击；只有用户在操作前明确确认具体动作后，Agent 才能设置 `confirmIrreversible`。
8. 再次获取关键字段快照并报告未解决项。

## 安全边界

- 不克隆或复用主浏览器配置来获取登录状态。
- 不提取 Cookie、令牌、密码、浏览器数据库或凭据管理器内容。
- 表单数据保留在本地；共享日志与截图不包含敏感值。
- 不绕过验证码、MFA、访问控制或反机器人机制。
- 未经操作前的明确确认，不提交、签署、同意、撤回、付款或发送最终申请。
- 完成后关闭桥接器；只有用户希望复用登录状态时才保留隔离配置。
