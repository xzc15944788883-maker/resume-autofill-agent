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

桥接器使用独立浏览器配置，不复制用户主浏览器的配置、Cookie、令牌或已保存密码。

进入 `scripts/browser-bridge` 后运行：

```bash
npm install --ignore-scripts
node browser_bridge.cjs --doctor
node browser_bridge.cjs --url "https://example.com/application"
```

若宿主已经内置 `playwright` 或 `playwright-core`，桥接器会优先尝试使用，可能无需安装。`--doctor` 只检查依赖与浏览器，不打开网页。

尊重用户的浏览器偏好。用 `--executable "/path/to/chrome"` 强制选择 Chrome 或其他受支持的 Chromium 浏览器，用 `--profile "/path/to/isolated-profile"` 单独保存可复用登录态。若身份提供商在某个浏览器中无法登录，应切换到用户偏好的已安装浏览器，不要反复重试同一路线。

桥接器会移除 Playwright 默认的 `--enable-automation` 启动标记，因为部分身份提供商会拒绝暴露该标记的浏览器。这只用于兼容正常登录，不绕过验证码、MFA、风险检查或访问控制。

若仍被拒绝，不要继续重试。使用独立配置和固定的本机调试端口原生启动浏览器，在接管前完成登录，然后运行：

```bash
node browser_bridge.cjs --cdp "http://127.0.0.1:9333"
```

调试端口只能绑定到回环地址，启动前确认端口未占用，绝不暴露到网络。桥接器会拒绝非本机 CDP 地址；断开 CDP 后原生浏览器保持打开，隔离登录态可继续复用。

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
2. 登录、验证码、通行密钥或 MFA 由用户在隔离窗口中完成，不索取或保存秘密信息。
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
