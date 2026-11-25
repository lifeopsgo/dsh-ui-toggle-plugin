# dsh-ui-toggle-plugin

[![中文](https://img.shields.io/badge/README-中文-red?style=flat-square)](./README.md) [![English](https://img.shields.io/badge/README-English-blue?style=flat-square)](./README.en.md) [![详细中文](https://img.shields.io/badge/README-详细中文-orange?style=flat-square)](./README.zh-CN.md)

一个 DSH（DeepSeek Harness）网页界面插件：在「设置 → UI 开关」里提供八个界面开关，点完立刻生效，不用刷新、不用重启。

DSH 升级后如果界面结构变化导致某个开关失效，设置页会在开关列表上方提示，并标出是哪几个。

## 八个开关

| 开关 | 作用 |
| --- | --- |
| 隐藏侧边栏顶部品牌区 | 左上角的鱼形图标和「DeepSeek Harness」文字不再显示 |
| 左下角只留设置按钮 | 左下角的账号菜单换成单个设置按钮，设置功能不受影响 |
| 面板图标横排 | 侧边栏的面板按钮（插件、堡垒机等）从竖着排变成横着排，并且只留图标、不显示文字；该模式下也不显示悬停的取消固定按钮，要撤销固定先关掉这个开关 |
| 隐藏「新会话」按钮 | 侧边栏顶部的新会话按钮不再显示，快捷键 ⌥⌘N 仍可用 |
| 隐藏「收起侧边栏」按钮 | 侧边栏的收起按钮不再显示，快捷键仍可用 |
| 隐藏输入框提示文字 | 输入框为空时的灰色占位提示不再显示，不影响输入 |
| 隐藏命令菜单里的「反馈」 | 输入 `/` 打开命令菜单时不再列出反馈行；手动输入 `/feedback` 仍能执行 |
| 权限模式只保留图标 | 输入框下方的权限选择器只留盾牌图标和下拉箭头，「完全权限」这类文字不再显示，仍可正常展开与切换 |

设置保存在浏览器里，关掉浏览器再打开仍然记得。之前用旧版插件（dsh-capability-toggle-plugin）设过这六项的话，第一次启动会自动搬过来，不用重新设置。

## 安装

```bash
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.1.0
dsh --profile web web
```

装好后刷新网页，打开 **设置 → UI 开关** 拨开关即可。

卸载：`dsh plugin --profile web remove dsh-ui-toggle-plugin`

## 兼容性

peer 范围接纳**所有 DSH 0.2.x 版本**（含预发布）：DSH 发布 0.2.x 新版本时不需要更新本插件，只有 DSH 0.3.0 需要重新评估。在 0.2.1-rc.2 与 0.2.2-rc.3 上验证；0.2.x 以外不声明支持。

实现细节见 [README.en.md](./README.en.md)（英文）与 [README.zh-CN.md](./README.zh-CN.md)（详细中文）。

MIT
