<div align="center">

# dsh-ui-toggle-plugin

**把 DSH WebUI 的六个界面开关收进一个设置页。**

[![platform](https://img.shields.io/badge/platform-DSH%20WebUI-2b7cd3?style=flat-square)](#快速开始)
![tests](https://img.shields.io/badge/tests-35%20passing-3fb950?style=flat-square)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

[English](./README.md) · **简体中文**

</div>

## 这是什么

一个 **DeepSeek Harness (DSH) WebUI** 插件：在设置里新增 **UI 开关** 分区，用六个开关控制宿主界面自身的元素。

| 开关 | 效果 |
| :-- | :-- |
| **隐藏侧栏顶部品牌区** | 整个移除左上角品牌按钮（鱼形标志 `sidebar.brand.mark` 与「DeepSeek Harness」文字标志 `sidebar.brand.name`）。设置仍可从设置按钮进入。 |
| **左下角仅保留设置按钮** | 用设置按钮替换账号/登录菜单（`settings.launcher`），设置面板功能完全不受影响。 |
| **全局面板图标横排** | 面板入口并排显示、放不下自动换行；展开态不显示文字标签（每个入口保留 aria-label）。收起态仍保持原有竖排布局。 |
| **隐藏「新会话」按钮** | 隐藏侧栏顶部的新会话大按钮；新建会话的快捷键不受影响。 |
| **隐藏「收起侧边栏」按钮** | 隐藏侧栏的收起/展开按钮；快捷键仍可收起与展开。顶部 logo 行由宿主固定高度，因此当开关使其清空后（宽态为品牌与开关同时隐藏，收起态仅需隐藏开关），该行整体收起，不留空白条。 |
| **隐藏输入框占位文案** | 隐藏输入框为空时的提示文字。宿主把它渲染为带稳定 `data-composer-placeholder` 属性的 aria-hidden div（全框架唯一一处），因此规则锚定该属性，绝不匹配文案本身。输入功能不受影响，输入框保留 aria-label。 |

每个开关都**即时生效**、无需刷新，并保存在本浏览器的 `localStorage` 中。

## 兼容的 DSH 版本

面向 **DSH 0.2.1-rc.2** 构建与验证（peer 范围同时接纳 `0.2.0-rc.1`）。

| DSH 版本 | 状态 | 验证方式 |
| --- | --- | --- |
| 0.2.1-rc.2 | 支持 | Host 与 Client 类型检查、生产构建、35 项自动化测试、`--frozen-lockfile` 安装，以及真实 WebUI 上六个开关的端到端浏览器验证 |

其他 DSH 版本不声明支持。

## 快速开始

需要 **Node.js ^22.19.0 或 ≥ 24.0.0**（与 DSH 0.2.x 相同）。

```bash
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.0.0
dsh --profile web web
```

刷新页面，打开 **设置 → UI 开关**，拨动开关即可。

<details>
<summary>升级或卸载</summary>

```bash
# 升级或降级：tag 换成 releases 页面上的任意版本
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.0.0

# 卸载
dsh plugin --profile web remove dsh-ui-toggle-plugin
```

</details>

## 实现要点

**是设置分区，不是第二个面板。** 插件注册一个 `settings.section` 条目（`id: ui-toggle`、`order: 20`），宿主据此把它排在「内置插件」之后，并按需挂载配置页。页面样式集中在单张 `.dshui-` 前缀的样式表里。

**两类元素、两种机制。** 位于**插槽之后**的元素无法可靠地用 CSS 隐藏，因为占位者由渲染器挑选。这类座位（品牌标志与文字标志、启动器）采用**影子替换**：以显式负优先级 `-99` 注册空组件（启动器则注册仅含设置按钮的替代组件），开关关闭时注销。单一插槽由最低优先级胜出，因此能稳定顶掉宿主原有占位者且不改动它。**不在插槽中**的元素（新会话按钮、收起开关、输入框占位、面板列表容器）由 **CSS** 控制，锚定渲染器稳定的 `[data-slot]` / `data-composer-placeholder` 属性，绝不匹配每次 DSH 重建都会变化的哈希类名。

**所有 CSS 开关共用一张样式表。** 单一组装函数按当前开启项拼出规则；拨动开关只更新该元素的 `textContent`，全部关闭时移除整张表。不会出现每个开关一个 `<style>`、也不会残留孤儿规则。

**数值从拆分前的面板迁移。** 这六个开关原先存在 `dsh-capability-toggle-plugin` 面板的偏好数据里。首次启动时若本插件自己的键不存在，就从那份旧数据中读出六个界面开关字段并写入新键——升级用户不必重设。旧键只读、从不写入。

## 开发

```bash
pnpm install
pnpm typecheck   # host + client
pnpm build       # lib/index.js（宿主 ESM）+ lib/client.js（ModuleLoader 信封）
pnpm test        # 35 项测试，node --test
```

`lib/` 是刻意提交的：安装走 git tag，而 git 托管包只有让每个用户按哈希许可 `prepare` 脚本才会有构建步骤。

## 许可证

MIT
