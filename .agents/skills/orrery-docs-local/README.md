# Orrery 临时本地文档版

给黑客松协作者使用的轻量文档Skill。仅文档维护＋离线阅读，不是完整Orrery发行版。

## 安装Skill

解压后把整个`orrery-docs-local`文件夹放进你的Agent支持的skills目录。例如使用支持`.agents/skills`的宿主时，可放到项目的`.agents/skills/orrery-docs-local/`；也可以让Agent直接读取本目录的`SKILL.md`。不要覆盖已有`project-orrery`安装。宿主自动发现路径以各自设置为准。

然后告诉Agent：**使用 orrery-docs-local 为这个黑客松项目初始化并维护文档；保留已有文件。**

## 三条命令

需要Python 3.10或更高版本，无需pip安装依赖。在解压的Skill目录打开终端：

```sh
python scripts/orrery_docs.py init --target "你的项目目录" --dry-run
python scripts/orrery_docs.py init --target "你的项目目录"
python scripts/orrery_docs.py build --target "你的项目目录"
```

Windows若`python`不可用可改为`py -3`，macOS/Linux通常用`python3`。
最后用浏览器打开项目中的`docs/_site/orrery-docs.html`。无需启动服务器。修改文档后重新运行build即可。

## 两个人怎么用

共享Git仓库里的AGENTS和docs作者文档，各自用自己的Agent/分支修改，正常审阅合并。首次一起明确principles里的目标，再记录关键技术选择。State写已经做到什么，Plan写准备做什么，Validation写实际测过什么。

生成的`docs/_site/`建议加入项目自己的`.gitignore`，本安装器不会修改你的已有gitignore。不要把密钥、私有聊天或不想分享的内容写进作者文档；阅读页会包含AGENTS和docs下的Markdown内容，仅供本机阅读，不自动上传。

## 明确限制

- 不含Graph、Agent任务状态、任务账本/验收系统、自动协调、Hooks、Team同步、AI问答或后台服务。
- 阅读器展示可搜索的Markdown原文，不提供完整富文本排版、图片预览或自动刷新。页面导航可选择文档；Markdown链接仍以原文显示。
- 初始化只创建缺失文件。已有AGENTS不覆盖，请让Agent按项目实际情况合并入口。
- 这份临时包不会自动升级成完整版，不声称完整Orrery已通过发布验收。
- 卸载只需移走Skill目录；项目作者文档由你保留，不提供自动删除命令。

来源：Orrery文档治理约定，2026-10-24临时裁剪包；未改动或打包主仓库的未提交内容。代码许可见LICENSE。
