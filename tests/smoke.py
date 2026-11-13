"""Prueba de humo de Corrillo: abre cada juego con tres combinaciones de ajustes al azar y pulsa botones
al azar durante 140 pasos, en un navegador con tamaño de móvil. Falla si aparece algún error de JavaScript.

Requisitos:  pip install playwright   (usa el Chrome instalado; si no, cambia channel='chrome' por nada y ejecuta `playwright install chromium`)
Uso:         python tests/smoke.py [id1 id2 …]   (sin ids prueba todos; tarda unos 10-15 minutos)
"""
import asyncio, random, sys
from playwright.async_api import async_playwright
import pathlib
URL=(pathlib.Path(__file__).resolve().parent.parent/'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(channel='chrome')
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(('pageerror',str(e))))
        pg.on('console',lambda m:errs.append(('console',m.text)) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_selector('.gcard')
        ids=sys.argv[1:] or await pg.evaluate('Corrillo.games.map(g=>g.id)'); print(len(ids),ids)
        
        for gid in ids:
            for variant in range(3):
                await pg.evaluate('localStorage.clear()')
                # variar ajustes: alterna selects/toggles
                await pg.goto(URL+'?g='+gid+str(variant)+'#/j/'+gid); await pg.wait_for_selector('.setup')
                if variant:
                    for _ in range(variant*3):
                        els=await pg.query_selector_all('.setup .chip, .setup .switch, .setup .stepper button:not([disabled])')
                        if els: await random.choice(els).click()
                pass
                dis=await pg.evaluate('document.querySelector(".bar .btn").disabled')
                if dis:
                    print(gid,variant,'bloqueado:',await pg.inner_text('.bar .warn')); continue
                await pg.click('.bar .btn'); await pg.wait_for_selector('.play', timeout=5000)
                seen=set()
                for step in range(140):
                    for inp in await pg.query_selector_all('.stage input[type=text]'): await inp.fill('resp')
                    for tr in await pg.query_selector_all('.stage .dial-track, .stage .wl.live'):
                        bb=await tr.bounding_box(); await pg.mouse.click(bb['x']+bb['width']*random.random(), bb['y']+30)
                    btns=await pg.query_selector_all('.stage button:not([disabled]), .stage .spinbox')
                    btns=[x for x in btns if await x.is_visible()]
                    if not btns: 
                        await pg.wait_for_timeout(300); continue
                    labels=[(await x.inner_text()).strip() for x in btns]
                    cand=[(x,l) for x,l in zip(btns,labels) if l not in ('Ajustes','Menú','Terminar fiesta','📤 Compartir resultado')]
                    x,l=random.choice(cand or list(zip(btns,labels)))
                    seen.add(l[:25])
                    try: await x.click(timeout=2000)
                    except Exception as e: pass
                    if not await pg.query_selector('.play'): break
                    pass
                print(gid,variant,'ok',len(seen),'botones distintos')
                if await pg.query_selector('.play'):
                    await pg.click('.top .icon'); await pg.click('.modal .btn:not(.primary)'); await pg.wait_for_selector('.setup')
        print('ERRORES',len(errs)); [print(e) for e in errs[:30]]
        if errs: sys.exit(1)
        await b.close()
asyncio.run(main())
