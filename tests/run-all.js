/* ATLAS OF PUBLICATIONS — end-to-end run (Playwright chromium)
   13 flows / network view + YouTube layer + hidden room, screenshots, error count. */
const {chromium}=require('/home/user/node_modules/playwright');
const fs=require('fs');
const URL=process.env.URL||'http://127.0.0.1:8000/index.html';
const OUT='/home/user/shots';
if(!fs.existsSync(OUT))fs.mkdirSync(OUT,{recursive:true});

const report=[];const errs=[];
let pass=0,fail=0;
function check(name,cond,extra){
  const ok=!!cond; ok?pass++:fail++;
  report.push((ok?'  ok  ':'  FAIL')+'  '+name+(extra!==undefined&&!ok?'   ['+extra+']':(extra!==undefined?'   '+extra:'')));
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:2,locale:'ja-JP'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push('pageerror: '+e.message+'  @ '+((e.stack||'').split('\n')[1]||'').trim()));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});

  /* ---- 1. load / structure ---- */
  await page.goto(URL,{waitUntil:'load'});await sleep(600);
  check('1.1 #papers renders 10 rows',await page.locator('#papers .paper').count()===10,await page.locator('#papers .paper').count());
  check('1.2 network has 10 nodes',await page.locator('#mapsvg .node').count()===10);
  check('1.3 network has 8 edges',await page.locator('#mapsvg .edge').count()===8);
  check('1.4 2 live edges into the unnamed paper',await page.locator('#mapsvg .edge.live').count()===2);
  check('1.5 cluster hulls published',await page.locator('#mapsvg .hull').count()===3);
  check('1.6 channel banner + avatar drawn',await page.locator('.banner .wm').count()===1&&await page.locator('.avatar').count()===1);
  check('1.7 handle line present',(await page.locator('.chinfo .handle').innerText()).includes('@minato.shirasuna'));
  check('1.8 channel tabs (4)',await page.locator('#ctabs button').count()===4);
  check('1.9 index rows are plain (no thumbnails)',await page.locator('#papers .thumb').count()===0);
  check('1.10 unique element ids',await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length}));
  check('1.11 no external subresources',await page.evaluate(()=>[...document.querySelectorAll('link,script,img,iframe')].map(e=>e.src||e.href||'').filter(u=>u&&!u.startsWith(location.origin)&&!u.startsWith('data:')).length===0));
  check('1.12 no external requests',await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>!r.name.startsWith('http://127.0.0.1')&&!r.name.startsWith('http://localhost')).length===0));
  check('1.13 stats line counts nodes/edges/density',/ノード 10/.test(await page.locator('#mapnote').innerText())&&/エッジ 8/.test(await page.locator('#mapnote').innerText()),await page.locator('#mapnote').innerText());
  check('1.14 copy says YouTube (not NLP)',(await page.locator('.chinfo .def').innerText()).includes('YouTube'));
  await page.screenshot({path:OUT+'/01-desktop-dark.png',fullPage:true});

  /* ---- 1b. channel header: 登録 + タブ ---- */
  check('1b.1 subscribe button label',(await page.locator('#subtxt').innerText()).includes('更新を受け取る'));
  await page.click('#subbtn');await sleep(300);
  check('1b.2 subscribe toggles',(await page.locator('#subtxt').innerText()).includes('登録済み'));
  check('1b.3 登録 record unlocked',await page.evaluate(()=>JSON.parse(localStorage.getItem('atlas-ach')||'[]').includes('sub')));
  check('1b.4 toast promises 0 bytes',(await page.locator('#toasts').innerText()).includes('0 bytes'));
  await page.click('#ctabs button[data-tab="index"]');await sleep(900);
  const scrolled=await page.evaluate(()=>window.scrollY);
  check('1b.5 tab scrolls to a section',scrolled>200,scrolled);
  check('1b.6 tab marks itself current',await page.locator('#ctabs button[data-tab="index"]').getAttribute('aria-current')==='true');
  await page.evaluate(()=>window.scrollTo(0,0));await sleep(400);

  /* ---- 2. cat is visible before anything ---- */
  check('2.1 cat dock visible on load',await page.locator('#catdock button').isVisible());
  check('2.2 cat badge visible before key',await page.locator('#catdock .badge').isVisible());
  check('2.3 door hidden before key',await page.locator('#doordock[hidden]').count()===1);

  /* ---- 3. node → drawer ---- */
  await page.click('#mapsvg .hit[data-id="p3"]');await sleep(320);
  check('3.1 drawer opens on node click',await page.locator('#drawer.on').count()===1);
  check('3.2 drawer shows YouTube-era title',(await page.locator('#dbody').innerText()).includes('Vertical Video'));
  await page.click('#dbody [data-goto="p3"]');await sleep(700);
  check('3.3 index row focused and drawer closed',await page.locator('#drawer.on').count()===0&&await page.locator('#p-p3').count()===1);

  /* ---- 4. palette (all commands, no hidden easter egg) ---- */
  await page.keyboard.press('?');await sleep(200);
  check('4.1 palette opens',await page.locator('#palette.on').count()===1);
  check('4.2 palette lists all 9 commands',await page.locator('#cmdlist li').count()===9,await page.locator('#cmdlist li').count());
  await page.screenshot({path:OUT+'/03-palette.png'});
  await page.keyboard.type('lay');await page.keyboard.press('Enter');await sleep(300);
  check('4.3 filter+enter runs and closes',await page.locator('#palette.on').count()===0&&(await page.locator('#achline').innerText()).includes('組み替え'));
  await page.keyboard.press('d');await sleep(250);
  check('4.4 d switches to paper theme',await page.evaluate(()=>document.documentElement.dataset.theme)==='light');
  await page.screenshot({path:OUT+'/04-desktop-paper.png',fullPage:true});
  await page.keyboard.press('d');await sleep(200);
  await page.keyboard.press('l');await sleep(250);
  check('4.5 l draws lineage labels',await page.locator('#mapsvg .edgelab').count()===8);
  await page.keyboard.press('l');await sleep(150);

  /* ---- 5. player = timeline ---- */
  await page.locator('#player').scrollIntoViewIfNeeded();await sleep(200);
  check('5.1 player has the AS OF scrubber',await page.locator('#player .yscrub').count()===1);
  check('5.2 year bars drawn (6)',await page.locator('#ybars i').count()===6);
  await page.locator('#asof').evaluate(el=>{el.value=2023;el.dispatchEvent(new Event('input',{bubbles:true}))});
  await sleep(400);
  check('5.3 scrub back to 2023',(await page.locator('#asofval').innerText()).includes('2023'));
  check('5.4 6 ghost nodes (2024-2026)',await page.locator('#mapsvg .ghost').count()===6,await page.locator('#mapsvg .ghost').count());
  await page.screenshot({path:OUT+'/06-asof-ghost.png'});
  await page.click('#mapsvg .ghost .hit',{force:true});await sleep(400);
  check('5.5 ghost click yields a fragment',(await page.locator('#rfrag').innerText()).replace(/\s/g,'').includes('1/4'));
  await page.click('#asofreset');await sleep(300);
  await page.click('#p-room');await sleep(300);
  check('5.6 room button blocked without the key',await page.locator('#room.on').count()===0);

  /* ---- 6. cat → key → door → room ---- */
  await page.click('#catbtn2');await sleep(120);
  await page.click('#catbtn2');await sleep(120);
  check('6.1 badge still says ?',(await page.locator('#catdock .badge').innerText()).trim()==='?');
  await page.click('#catbtn2');await sleep(400);
  check('6.2 key returned: badge disappears',await page.locator('#catdock .badge').isHidden());
  check('6.3 body marked keyed',await page.evaluate(()=>document.body.classList.contains('keyed')));
  check('6.4 door visible',await page.locator('#doordock:not([hidden])').count()===1);
  check('6.5 cat fragment a collected',(await page.locator('#rfrag').innerText()).replace(/\s/g,'').includes('2/4'));
  await page.screenshot({path:OUT+'/07-cat-key-door.png'});
  await page.click('#p-room');await sleep(400);
  check('6.6 player button opens the room after the key',await page.locator('#room.on').count()===1);
  check('6.7 terminal 2nd line is 前回来た',(((await page.locator('#rterm').textContent())||'').split('\n').filter(x=>x.trim())[1]||'').includes('前回来た'));
  await page.screenshot({path:OUT+'/07b-room-game.png'});

  /* ---- 7. attention game ---- */
  const fillEven=async()=>{
    const n=await page.locator('#rbody .grow input').count();
    const base=Math.floor(100/n),first=100-base*(n-1);
    for(let i=0;i<n;i++){await page.locator('#rbody .grow input').nth(i).fill(String(i===0?first:base))}
  };
  const scores=[];
  for(let s=0;s<3;s++){
    await fillEven();await sleep(150);
    check('7.'+(s+1)+' total reaches 100',(await page.locator('#gsum').innerText())==='100');
    await page.click('#gscorebtn');await sleep(280);
    scores.push(await page.locator('#rbody .gpass').last().innerText());
    if(s<2){await page.click('#gnext');await sleep(280)}
  }
  check('8.1 even split scores in 40-78',scores.every(t=>{const m=t.match(/(\d+) \/ 100/);return m&&+m[1]>=40&&+m[1]<=78}),scores.map(t=>t.match(/(\d+) \/ 100/)[1]).join('/'));
  await page.click('#gfinish');await sleep(300);
  check('8.2 average shown',/平均 \d+/.test(await page.locator('#rbody .gpass').last().innerText()));
  await page.click('#greset');await sleep(300);
  const near=await page.evaluate(()=>window.ATLAS.perfect(0));
  for(let i=0;i<near.length;i++){await page.locator('#rbody .grow input').nth(i).fill(String(near[i]))}
  await sleep(150);
  if(await page.locator('#gfill').isVisible().catch(()=>false)){await page.click('#gfill');await sleep(250)}
  await page.click('#gscorebtn');await sleep(300);
  const pm=(await page.locator('#rbody .gpass').last().innerText()).match(/(\d+) \/ 100/);
  check('8.3 near-perfect scores >=98',pm&&+pm[1]>=98,pm&&pm[1]);
  await page.screenshot({path:OUT+'/08-game-result.png'});

  /* ---- 9. experiments ---- */
  await page.click('#rnav button:nth-child(2)');await sleep(300);
  check('9.1 five runs listed',await page.locator('#flist li').count()===5);
  check('9.2 #0302 mentions the session-order bug',(await page.locator('#flist li[data-x="#0302"]').innerText()).includes('振動'));
  for(const id of ['#0338','#0302','#0291']){await page.click('#flist li[data-x="'+id+'"]');await sleep(220)}
  check('9.3 3 runs read -> 失敗 record',(await page.locator('#achline').innerText()).includes('失敗'));
  check('9.4 #0291 yields fragment c',(await page.locator('#rfrag').innerText()).replace(/\s/g,'').includes('3/4'));
  await page.screenshot({path:OUT+'/09-experiment.png'});

  /* ---- 10. history → reveal → choice ---- */
  await page.click('#rnav button:nth-child(3)');await sleep(300);
  check('10.1 ten papers with history',await page.locator('#rbody .histpaper').count()===10);
  await page.click('[data-hist2="p10"]');await sleep(400);
  check('10.2 fragment d collected',(await page.locator('#rfrag').innerText()).replace(/\s/g,'').includes('4/4'));
  check('10.3 chain revealed',await page.evaluate(()=>document.body.dataset.chain)==='1');
  check('10.4 mutual link visible',(await page.locator('#rbody').innerText()).includes('相互リンク'));
  await page.screenshot({path:OUT+'/11-reveal-choice.png'});
  await page.click('[data-choice="log"]');await sleep(300);
  check('10.5 choice recorded in terminal',((await page.locator('#rterm').textContent())||'').includes('log'));
  await page.click('#rclose');await sleep(300);
  await page.click('#catbtn');await sleep(400);
  check('10.6 after reveal the cat speaks',((await page.locator('#toasts').innerText())||'').length>0);
  check('10.7 index gained 1 extra row',await page.locator('#pc-row').count()===1);
  check('10.8 投稿から N 日 on the unnamed node',await page.locator('#mapsvg .node .edgelab').count()>=1);

  /* ---- 11. oracle / play / filters / persistence ---- */
  await page.keyboard.press('y');await sleep(200);
  await page.locator('#mapwrap').scrollIntoViewIfNeeded();await sleep(400);
  const box=await page.locator('#mapwrap').boundingBox();
  await page.mouse.click(box.x+box.width*0.30,box.y+box.height*0.30);await sleep(400);
  check('11.1 oracle point placed',await page.locator('#mapsvg .mylab').count()===1);
  await page.keyboard.press('y');await sleep(150);
  await page.locator('#player').scrollIntoViewIfNeeded();await sleep(200);
  await page.click('#p-play');
  let played=2021;
  for(let i=0;i<24;i++){await sleep(300);played=+(await page.locator('#asof').inputValue());if(played>=2026)break}
  await sleep(300);
  check('11.2 PLAY drives to 2026',played>=2026,played);
  await page.keyboard.press('Escape');await sleep(300);
  check('11.3 再生 record unlocked',await page.evaluate(()=>JSON.parse(localStorage.getItem('atlas-ach')||'[]').includes('replay')));
  await page.click('#chips .chip:nth-child(1)');await sleep(300);
  check('11.4 theme filter dims other clusters',await page.locator('#mapsvg .node.dim').count()>0);
  await page.click('#chips .chip:nth-child(1)');await sleep(250);
  await page.reload({waitUntil:'load'});await sleep(600);
  check('11.5 fragments survive reload',(await page.locator('#rfrag').innerText()).replace(/\s/g,'').includes('4/4'));
  check('11.6 key state survives reload',await page.locator('#doordock:not([hidden])').count()===1);
  check('11.7 oracle survives reload',await page.locator('#mapsvg .mylab').count()===1);
  await ctx.close();

  /* ---- 12. mobile 390 ---- */
  const m=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'ja-JP'});
  const mp=await m.newPage();
  mp.on('pageerror',e=>errs.push('mobile pageerror: '+e.message));
  await mp.goto(URL,{waitUntil:'load'});await sleep(600);
  const overflow=await mp.evaluate(()=>document.scrollingElement.scrollWidth-window.innerWidth);
  check('12.1 no horizontal overflow on 390px',overflow<=1,'overflow='+overflow);
  await mp.screenshot({path:OUT+'/13-mobile-dark.png',fullPage:true});
  await mp.click('#catbtn2');await mp.click('#catbtn2');await mp.click('#catbtn2');await sleep(300);
  await mp.click('#doorbtn');await sleep(400);
  check('12.2 room reachable on mobile',await mp.locator('#room.on').count()===1);
  await mp.screenshot({path:OUT+'/15-mobile-room.png'});
  await m.close();

  /* ---- 13. print / reduced motion ---- */
  const p=await browser.newContext({viewport:{width:900,height:1200},locale:'ja-JP'});
  const pp=await p.newPage();
  await pp.goto(URL,{waitUntil:'load'});await sleep(400);
  await pp.emulateMedia({media:'print'});
  check('13.1 print hides player and cat',await pp.locator('#catdock').isHidden());
  await pp.screenshot({path:OUT+'/16-print.png',fullPage:true});
  await pp.emulateMedia({media:'screen',reducedMotion:'reduce'});
  await pp.reload({waitUntil:'load'});await sleep(500);
  check('13.2 reduced-motion renders static network',(await pp.locator('#renderinfo').innerText())==='static');
  check('13.3 reduced-motion stops the halo animation',await pp.evaluate(()=>getComputedStyle(document.querySelector('#mapsvg .halo')).animationName==='none'));
  await p.close();

  await browser.close();
  const out=['ATLAS — run-all summary','',...report,'',
    'pageerrors / console errors: '+errs.length,...errs.map(e=>'   '+e),
    '',`flows passed ${pass} / ${pass+fail}`].join('\n');
  fs.writeFileSync('/home/user/tests/last-run.txt',out);
  console.log(out);
  process.exit(fail||errs.length?1:0);
})().catch(e=>{
  const out=['ATLAS — run-all summary (aborted)','',...report,'','HARNESS ERROR: '+e.message,'',
    'pageerrors / console errors: '+errs.length,...errs.map(x=>'   '+x),'',
    `flows passed ${pass} / ${pass+fail}`].join('\n');
  fs.writeFileSync('/home/user/tests/last-run.txt',out);
  console.error(out);process.exit(2);
});
