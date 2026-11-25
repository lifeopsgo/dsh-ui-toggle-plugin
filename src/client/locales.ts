/**
 * The plugin's locale namespace and dictionaries. Registered through
 * ctx.locale.register; the Settings section registration also binds the
 * translator for its nav label and injects it as the section's `t` prop.
 *
 * @module dsh-ui-toggle-plugin/client/locales
 */

export const NS = 'dsh-ui-toggle-plugin'

/** zh-CN: the section nav row, heading and switch copy. */
const zh: Record<string, string> = {
  'nav': 'UI 开关',
  'prefs.feedback': '隐藏命令菜单里的「反馈」',
  'prefs.feedback.hint': '打开「/」命令菜单时不再列出反馈；手动输入 /feedback 仍可发送',
  'health.title': '有开关在当前 DSH 版本下失效',
  'health.body': '当前 DSH 版的界面结构变了，下面这些开关找不到作用对象，打开也不会有变化。等插件更新后会自动恢复。',
  'health.badge': '失效',
  'title': 'UI 开关',
  'intro': '按需隐藏或重塑界面元素，改动即时生效并保存在本浏览器，重启后仍保留。',
  'prefs.brand': '隐藏侧栏顶部品牌区',
  'prefs.brand.hint': '隐藏左上角的标志与产品名（设置仍可从设置按钮进入）',
  'prefs.launcher': '左下角仅保留设置按钮',
  'prefs.launcher.hint': '用设置按钮替换账号/登录菜单，设置功能不受影响',
  'prefs.panels': '全局面板图标横排',
  'prefs.panels.hint': '左侧功能入口并排显示、放不下换行；展开态只保留图标，不显示文字标签与悬停的取消固定按钮（需要撤销固定时先关掉本开关）',
  'prefs.newsession': '隐藏「新会话」按钮',
  'prefs.newsession.hint': '隐藏侧栏顶部的新会话大按钮；新建会话的快捷键不受影响',
  'prefs.sidebartoggle': '隐藏「收起侧边栏」按钮',
  'prefs.sidebartoggle.hint': '隐藏侧栏的收起/展开按钮；对应快捷键仍可收起与展开。清空的顶部行会整体收起、不留空白：宽态需与品牌隐藏同时开启，收起态下仅开本开关即可',
  'prefs.inputplaceholder': '隐藏输入框占位文案',
  'prefs.inputplaceholder.hint': '隐藏输入框为空时的提示文字（「发消息或创建任务…」等）；输入功能不受影响，屏幕阅读器仍可读取输入框',
  'prefs.permission': '权限模式只保留图标',
  'prefs.permission.hint': '隐藏输入框下方权限选择器上的文字（「完全权限」等），只留下盾牌图标与下拉箭头；选择器仍可正常展开与切换',
  'launcher.settings': '设置',
}

/** English mirrors zh key for key. */
const en: Record<string, string> = {
  'nav': 'UI toggle',
  'prefs.feedback': 'Hide the Feedback command',
  'prefs.feedback.hint': 'Drops the feedback row from the "/" menu; typing /feedback still works',
  'health.title': 'A switch no longer works on this DSH version',
  'health.body': 'This DSH version changed the markup behind the switches below: they no longer find anything to act on, so flipping them changes nothing. They come back once the plugin is updated.',
  'health.badge': 'broken',
  'title': 'UI toggle',
  'intro': 'Hide or reshape interface elements as you like. Every switch applies live and stays saved in this browser across restarts.',
  'prefs.brand': 'Hide the sidebar brand area',
  'prefs.brand.hint': 'Hides the top-left mark and product name (Settings stays reachable via its button)',
  'prefs.launcher': 'Keep only Settings at the sidebar foot',
  'prefs.launcher.hint': 'Replaces the account/sign-in menu with a Settings button; Settings itself is unaffected',
  'prefs.panels': 'Lay global panel icons out horizontally',
  'prefs.panels.hint': 'Panel entries sit side by side and wrap when out of room; while expanded only the icons show — no text labels, and no hover unpin control (turn this switch off to unpin an entry)',
  'prefs.newsession': 'Hide the "New Session" button',
  'prefs.newsession.hint': 'Hides the big New Session button at the sidebar top; the new-session shortcut keeps working',
  'prefs.sidebartoggle': 'Hide the collapse-sidebar button',
  'prefs.sidebartoggle.hint': 'Hides the sidebar collapse/expand button; its keyboard shortcut still toggles the sidebar. The emptied logo row collapses instead of leaving a blank strip — in wide state that needs the brand hidden too; in the rail state this switch alone collapses it',
  'prefs.inputplaceholder': 'Hide the input placeholder',
  'prefs.inputplaceholder.hint': 'Hides the hint text the empty composer shows (Message or run a task…); typing is unaffected and screen readers still read the field',
  'prefs.permission': 'Show only the permission icon',
  'prefs.permission.hint': 'Hides the preset name on the permission selector under the composer (Full access and the other names), leaving the shield glyph and the dropdown chevron; the selector still opens and switches normally',
  'launcher.settings': 'Settings',
}

export const dictionaries = { zh, en } as const
