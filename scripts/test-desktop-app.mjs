import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authNavigation, ORIGIN, trustedFrame, validOperation, validAuthReturn } from '../desktop/app/policy.mjs';
test('native capture commands reject unknown methods, unexpected fields, nonboolean consent', () => {
  assert.ok(validOperation('capture',{enabled:true,browserTopics:false}));
  for (const body of [{enabled:1,browserTopics:false},{enabled:true},{enabled:true,browserTopics:false,title:'secret'},null,[]]) assert.equal(validOperation('capture',body),false);
  assert.ok(validOperation('pause',{})); assert.ok(validOperation('clear',{}));
  assert.equal(validOperation('exec',{}),false); assert.equal(validOperation('observations',{path:'/private'}),false);
});

test('Codex selection permits known-shape IDs, never renderer supplied paths',()=>{
  const id='12345678-1234-1234-1234-123456789abc';
  assert.ok(validOperation('codexSources',{}));assert.ok(validOperation('codexSelect',{threadIds:[id]}));
  for(const body of [{threadIds:['../../auth.json']},{threadIds:[id,id]},{threadIds:[id],path:'private'},{threadIds:'all'}]) assert.equal(validOperation('codexSelect',body),false);
});
test('only this app main frame may access the native observer', () => {
  const frame = {url:ORIGIN+'/'}, contents = {mainFrame:frame};
  assert.ok(trustedFrame({sender:contents,senderFrame:frame},{webContents:contents}));
  assert.equal(trustedFrame({sender:{},senderFrame:frame},{webContents:contents}),false);
  assert.equal(trustedFrame({sender:contents,senderFrame:{url:ORIGIN+'/'}},{webContents:contents}),false);
  frame.url='https://untrusted.example'; assert.equal(trustedFrame({sender:contents,senderFrame:frame},{webContents:contents}),false);
});
test('external login permits only known provider and exact local redirect', () => {
  const base='https://auth.spacetimedb.com/oidc/auth?state=expected&redirect_uri=';
  assert.equal(authNavigation(base+encodeURIComponent(ORIGIN+'/callback')).state,'expected');
  for(const value of [base+encodeURIComponent('https://untrusted.example/callback'),base.replace('auth.spacetimedb.com','evil.example')+encodeURIComponent(ORIGIN+'/callback'),'javascript:alert(1)','file:///etc/passwd']) assert.equal(authNavigation(value),null);
});
test('auth return requires a current matching state and code/error, including protected sign-out', () => {
  const pending={state:'random-expected-state',expires:1000,logout:false};
  const callback=new URL(ORIGIN+'/callback?state=random-expected-state&code=synthetic-code');
  assert.ok(validAuthReturn(callback,pending,900));
  assert.equal(validAuthReturn(callback,pending,1001),false);
  assert.equal(validAuthReturn(callback,null,900),false);
  callback.searchParams.set('state','forged'); assert.equal(validAuthReturn(callback,pending,900),false);
  callback.searchParams.set('state',pending.state); callback.searchParams.delete('code');
  assert.equal(validAuthReturn(callback,pending,900),false);
  assert.ok(validAuthReturn(callback,{...pending,logout:true},900));
});
