import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
export async function runSmoke(window, observer) {
  const target = path.resolve('output/desktop-smoke');
  await mkdir(target, { recursive: true });
  await window.webContents.executeJavaScript(`Promise.all(Array.from(document.images, image => image.decode().catch(()=>{}))).then(()=>document.fonts.ready).then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))`);
  const report = { initial: await observer.request('status'),
    renderer: await window.webContents.executeJavaScript(`({title: document.title, text: document.body.innerText, native: window.mirrorvilleDesktop?.version, node: typeof require, images: Array.from(document.images, image=>({file:new URL(image.currentSrc).pathname, width:image.naturalWidth}))})`),
    ipc: await window.webContents.executeJavaScript(`window.mirrorvilleDesktop.request('status')`),
    invalidRejected: await window.webContents.executeJavaScript(`window.mirrorvilleDesktop.request('capture', {enabled:'true',browserTopics:false}).then(()=>false,()=>true)`) };
  if (report.initial.enabled || report.renderer.native !== 1 || report.renderer.node !== 'undefined' || !report.invalidRejected) throw new Error('Desktop smoke failed');
  await writeFile(path.join(target, 'report.json'), JSON.stringify(report, null, 2));
  try {
    const capture = await Promise.race([window.webContents.capturePage(), new Promise((_, reject) => setTimeout(() => reject(new Error('Capture timed out')), 5000))]);
    await writeFile(path.join(target, 'app.png'), capture.toPNG());
  } catch { await writeFile(path.join(target, 'capture-unavailable.txt'), 'The Windows compositor did not return a capture; DOM and private IPC checks completed.'); }
}
