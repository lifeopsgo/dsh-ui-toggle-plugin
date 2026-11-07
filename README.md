# dsh-ui-toggle-plugin

一个 DSH（DeepSeek Harness）网页界面插件：在「设置 → UI 开关」里提供六个界面开关，点完立刻生效，不用刷新、不用重启。

## 六个开关

| 开关 | 作用 |
| --- | --- |
| 隐藏侧边栏顶部品牌区 | 左上角的鱼形图标和「DeepSeek Harness」文字不再显示 |
| 左下角只留设置按钮 | 左下角的账号菜单换成单个设置按钮，设置功能不受影响 |
| 面板图标横排 | 侧边栏的面板按钮（插件、堡垒机等）从竖着排变成横着排 |
| 隐藏「新会话」按钮 | 侧边栏顶部的新会话按钮不再显示，快捷键 ⌥⌘N 仍可用 |
| 隐藏「收起侧边栏」按钮 | 侧边栏的收起按钮不再显示，快捷键仍可用 |
| 隐藏输入框提示文字 | 输入框为空时的灰色占位提示不再显示，不影响输入 |

设置保存在浏览器里，关掉浏览器再打开仍然记得。之前用旧版插件（dsh-capability-toggle-plugin）设过这六项的话，第一次启动会自动搬过来，不用重新设置。

## 安装

```bash
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.0.0
dsh --profile web web
```

装好后刷新网页，打开 **设置 → UI 开关** 拨开关即可。

卸载：`dsh plugin --profile web remove dsh-ui-toggle-plugin`

## 兼容性

面向 DSH 0.2.1-rc.2 开发和验证（也兼容 0.2.0-rc.1）。其他版本未验证。

## 开发

```bash
pnpm install
pnpm typecheck && pnpm build && pnpm test   # 37 项测试
```

实现细节见 [README.en.md](./README.en.md)（英文）与 [README.zh-CN.md](./README.zh-CN.md)（详细中文）。

MIT
