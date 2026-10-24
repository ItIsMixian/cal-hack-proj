"""Create missing Orrery docs and build a dependency-free offline source reader."""
import argparse
import html
import json
import os
from pathlib import Path

TEMPLATES = {
    'AGENTS.md': '# 项目文档入口\n\n先读本文件、docs/HANDOFF.md、docs/PROGRESS.md、docs/core/principles.md，再按任务读相关State、有效ADR、活动Plan和真实代码。\n\nState写当前事实；ADR写决定和理由；Plan不是完成证据；验证结果放Validation。只更新事实变化影响的文档，不重复堆流水。已有约定需项目成员共同确认。\n',
    'docs/README.md': '# 项目文档\n\n从PROGRESS.md和core/principles.md开始。decisions保存决定，design保存设计，state保存当前事实，implementation/plans保存计划，validation保存验证，library保存参考。\n',
    'docs/core/principles.md': '# 项目原则\n\n待共同填写：黑客松要演示的目标、最低可用闭环、限制和明确不做的事。\n',
    'docs/PROGRESS.md': '# 当前工作\n\n待填写当前目标和相关Plan/State入口。计划不表示实现完成。\n',
    'docs/HANDOFF.md': '# 必要交接\n\n只记录其他来源没有的接续信息、实际阻挡与安全注意。\n',
    'docs/DEVLOG.md': '# 变更记录\n\n按完整交付或重要变更记录，不逐次测试追加流水。\n',
    'docs/backlog.md': '# 待评估想法\n\n这里的想法尚未批准或实现。\n',
    'docs/decisions/README.md': '# 决策索引\n\n重要决定每篇聚焦一个问题：背景、选择、理由、替代方案和后果。注明Proposed/Accepted/Superseded；接受不等于实现。编号须核对项目已有ADR，不覆盖历史。\n',
    'docs/design/README.md': '# 设计\n\n保存已经讨论的设计细节，链接对应有效决定，注明未确认部分。\n',
    'docs/implementation/plans/README.md': '# 实施计划\n\n每个计划说明结果、范围、不做什么和验收方式；不要把计划当验证结果。\n',
    'docs/state/project-structure.md': '# 项目结构\n\n待按真实仓库填写模块边界、代码入口、已实现能力与已知缺口。不要将模板内容当项目事实。\n',
    'docs/validation/README.md': '# 验证记录\n\n记录日期、确切版本、检查方法、结果和未覆盖项；没有执行就写Pending。\n',
    'docs/library/README.md': '# 参考资料\n\n研究与参考不自动成为项目决定。\n',
}

def is_link(path):
    return path.is_symlink() or bool(getattr(path.lstat(), 'st_file_attributes', 0) & 0x400)

def safe_path(root, relative):
    parts = Path(relative).parts
    if Path(relative).is_absolute() or '..' in parts:
        raise ValueError('Unsafe relative path')
    current = root
    for part in parts:
        current = current / part
        if os.path.lexists(current) and is_link(current):
            raise ValueError('Refusing link/reparse path: ' + str(current))
    return current

def initialize(root, dry):
    for name, content in TEMPLATES.items():
        dest = safe_path(root, name)
        if dest.exists():
            print('SKIP', name)
            continue
        print('WOULD CREATE' if dry else 'CREATE', name)
        if not dry:
            dest.parent.mkdir(parents=True, exist_ok=True)
            with dest.open('x', encoding='utf-8', newline='\n') as stream:
                stream.write(content)

def build(root):
    docs = safe_path(root, 'docs')
    records = []
    agent = safe_path(root, 'AGENTS.md')
    paths = [agent] if agent.is_file() else []
    if docs.is_dir():
        for directory, dirs, files in os.walk(docs, followlinks=False):
            dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d != '_site'
                             and not is_link(Path(directory) / d))
            paths.extend(Path(directory) / f for f in sorted(files) if f.endswith('.md'))
    total = 0
    for path in paths:
        if is_link(path):
            continue
        size = path.stat().st_size
        total += size
        if size > 2_000_000 or total > 20_000_000 or len(records) >= 1000:
            raise ValueError('Documentation size limit exceeded')
        records.append({'path': path.relative_to(root).as_posix(), 'text': path.read_text(encoding='utf-8-sig')})
    if not records:
        raise ValueError('No AGENTS.md or docs/*.md found')
    data = json.dumps(records, ensure_ascii=True).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'">
<title>Orrery · 本地文档</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f5f1;color:#24352d;font:16px system-ui,sans-serif}header{padding:20px 28px;background:#173e31;color:#fff}header small{display:block;margin-top:6px;color:#b8d6c6}main{display:grid;grid-template-columns:300px 1fr;height:calc(100vh - 100px)}aside{padding:18px;border-right:1px solid #cdd6ce;overflow:auto}input{padding:12px;width:100%;border:1px solid #9bae9f;border-radius:6px;font:inherit}button{display:block;width:100%;padding:10px;margin-top:5px;text-align:left;background:none;border:0;border-radius:6px;color:inherit;cursor:pointer;overflow-wrap:anywhere}button:hover,button[aria-current=true]{background:#dce8df}article{padding:24px 36px;overflow:auto}h1{font-size:20px;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.8 ui-monospace,Consolas,monospace}#count{font-size:13px;color:#5b7162;margin:12px 0}@media(max-width:700px){main{grid-template-columns:1fr;height:auto}aside{max-height:35vh}article{padding:18px}}
</style><header>Orrery · 本地文档<small>离线 Markdown 原文阅读 · 无服务 · 无自动任务状态</small></header>
<main><aside><input id="search" type="search" aria-label="搜索文档" placeholder="搜索标题或正文"><div id="count"></div><nav id="nav"></nav></aside><article><h1 id="title"></h1><pre id="body"></pre></article></main>
<script>const docs=__DATA__;let selected=0;const nav=document.getElementById('nav'),search=document.getElementById('search');
function show(i){selected=i;document.getElementById('title').textContent=docs[i].path;document.getElementById('body').textContent=docs[i].text;render();}
function render(){nav.replaceChildren();const q=search.value.toLocaleLowerCase();let n=0;docs.forEach((d,i)=>{if(!(d.path+'\\n'+d.text).toLocaleLowerCase().includes(q))return;n++;const b=document.createElement('button');b.textContent=d.path;b.setAttribute('aria-current',String(i===selected));b.onclick=()=>show(i);nav.appendChild(b)});document.getElementById('count').textContent=n+' / '+docs.length+' 篇文档';}search.addEventListener('input',render);show(0);
</script></html>'''.replace('__DATA__', data)
    output = safe_path(root, 'docs/_site/orrery-docs.html')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding='utf-8')
    print(output)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['init', 'build'])
    parser.add_argument('--target', type=Path, required=True)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    raw = args.target.expanduser().absolute()
    for part in [raw, *raw.parents]:
        if os.path.lexists(part) and is_link(part):
            parser.error('Target must not traverse a link/reparse point')
    root = raw.resolve()
    if args.action == 'init':
        initialize(root, args.dry_run)
    elif args.dry_run:
        parser.error('--dry-run is supported only for init')
    else:
        build(root)

if __name__ == '__main__':
    main()
