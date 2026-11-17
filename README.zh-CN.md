<div align="center">

# dsh-ui-toggle-plugin

**把 DSH WebUI 的六个界面开关收进一个设置页。**

[![platform](https://img.shields.io/badge/platform-DSH%20WebUI-2b7cd3?style=flat-square)](#快速开始)
![tests](https://img.shields.io/badge/tests-37%20passing-3fb950?style=flat-square)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

[![中文](https://img.shields.io/badge/README-中文-red?style=flat-square)](./README.md) [![English](https://img.shields.io/badge/README-English-blue?style=flat-square)](./README.en.md) [![详细中文](https://img.shields.io/badge/README-详细中文-orange?style=flat-square)](./README.zh-CN.md)

</div>

## 这是什么

一个 **DeepSeek Harness (DSH) WebUI** 插件：在设置里新增 **UI 开关** 分区，用六个开关控制宿主界面自身的元素。

| 开关 | 效果 |
| :-- | :-- |
| **隐藏侧栏顶部品牌区** | 整个移除左上角品牌按钮（鱼形标志 `sidebar.brand.mark` 与「DeepSeek Harness」文字标志 `sidebar.brand.name`）。设置仍可从设置按钮进入。 |
| **左下角仅保留设置按钮** | 用设置按钮替换账号/登录菜单（`settings.launcher`），设置面板功能完全不受影响。 |
| **全局面板图标横排** | 面板入口并排显示、放不下自动换行；展开态**只保留图标**，文字标签隐藏（每个入口保留 aria-label）。收起态仍保持原有竖排布局。 |
| **隐藏「新会话」按钮** | 隐藏侧栏顶部的新会话大按钮；新建会话的快捷键不受影响。 |
| **隐藏「收起侧边栏」按钮** | 隐藏侧栏的收起/展开按钮；快捷键仍可收起与展开。顶部 logo 行由宿主固定高度，因此当开关使其清空后（宽态为品牌与开关同时隐藏，收起态仅需隐藏开关），该行整体收起，不留空白条。 |
| **隐藏输入框占位文案** | 隐藏输入框为空时的提示文字。宿主把它渲染为带稳定 `data-composer-placeholder` 属性的 aria-hidden div（全框架唯一一处），因此规则锚定该属性，绝不匹配文案本身。输入功能不受影响，输入框保留 aria-label。 |

每个开关都**即时生效**、无需刷新，并保存在本浏览器的 `localStorage` 中。

## 兼容的 DSH 版本

peer 范围 `>=0.2.0-0 <0.3.0-0` 接纳**所有 DSH 0.2.x 版本**（含预发布）：DSH 发布 0.2.x 新版本时无需更新本插件，只有 DSH 0.3.0 需要重新评估（范围明确排除 0.3.0 及其预发布）。

| DSH 版本 | 状态 | 验证方式 |
| --- | --- | --- |
| 0.2.2-rc.3 | 支持 | Host 与 Client 类型检查、生产构建、37 项自动化测试、`--frozen-lockfile` 安装，以及对照 0.2.2-rc.3 安装包源码的逐项契约核对（slot 键、负优先级遮蔽机制、launcher owner share、section props、CSS 锚点、locale 服务签名）；0.2.1-rc.5 → 0.2.2-rc.3 升级指南中无涉及本插件扩展面的变更 |
| 0.2.1-rc.2 | 支持 | Host 与 Client 类型检查、生产构建、37 项自动化测试、`--frozen-lockfile` 安装，以及真实 WebUI 上六个开关的端到端浏览器验证 |

0.2.x 以外的 DSH 版本不声明支持。

## 快速开始

需要 **Node.js ^22.19.0 或 ≥ 24.0.0**（与 DSH 0.2.x 相同）。

```bash
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.1.0
dsh --profile web web
```

刷新页面，打开 **设置 → UI 开关**，拨动开关即可。

<details>
<summary>升级或卸载</summary>

```bash
# 升级或降级：tag 换成 releases 页面上的任意版本
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.1.0

# 卸载
dsh plugin --profile web remove dsh-ui-toggle-plugin
```

</details>

## 许可证

MIT
