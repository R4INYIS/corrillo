"""Capturas reproducibles para revisión visual; no sustituye pruebas físicas en móviles."""
import asyncio
import os
import pathlib
import struct
from playwright.async_api import async_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'artifacts' / 'review'
URL = (ROOT / 'index.html').as_uri()


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel=os.environ.get('CHROME_CHANNEL', 'chrome'))
        page = await browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        await page.goto(URL)
        for width, height, zoom in [(320, 740, 1), (390, 844, 1), (844, 390, 1), (320, 740, 1.5)]:
            await page.set_viewport_size({'width': width, 'height': height})
            await page.goto(URL)
            await expect(page.locator('.gcard')).to_have_count(28)
            await page.add_style_tag(content=f'html{{font-size:{16 * zoom}px}}body{{font-size:{17 * zoom}px}}')
            label = f'{width}x{height}-texto{zoom}'

            async def capture(scene):
                dimensions = await page.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})')
                if dimensions['content'] > dimensions['viewport'] + 1:
                    offenders = await page.evaluate("Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).position!=='absolute').map(e=>[e.tagName,e.className,e.textContent.slice(0,60)]).slice(-10)")
                    raise AssertionError((label, scene, dimensions, offenders))
                await page.screenshot(path=str(OUT / f'{label}-{scene}.png'))

            await capture('menu')
            await page.goto(URL + '#/j/fiesta')
            await expect(page.locator('.setup')).to_be_visible()
            await capture('fiesta')
            await page.get_by_text('Categorías y reglas avanzadas', exact=True).click()
            await page.get_by_role('button', name='Todos compatibles', exact=True).scroll_into_view_if_needed()
            await capture('categorias')
            await page.goto(URL + '#/j/prohibidas')
            await page.get_by_text('✏️ Contenido propio', exact=True).click()
            await page.get_by_label('Palabra principal', exact=True).fill('Biblioteca')
            for i, word in enumerate(['Libros', 'Estudiar', 'Silencio', 'Leer', 'Exámenes'], 1):
                await page.get_by_label(f'Prohibida {i}', exact=True).fill(word)
            await page.get_by_label('Prohibida 5', exact=True).scroll_into_view_if_needed()
            await capture('editor')
            await page.goto(URL + '#/j/aojo')
            await page.get_by_role('button', name='Empezar', exact=True).click()
            await expect(page.locator('.play')).to_be_visible()
            await page.evaluate('''() => {
              const C=Corrillo, names=Array.from({length:20},(_,i)=>'Participante '+(i+1));
              const points=names.map((name,i)=>[name, i<4?100:100+i/100]);
              C.currentContext.show(C.h('div',{class:'center'},C.h('h2',null,'Veinte estimaciones próximas'),C.plot(points,100,null,{min:99,max:101}),C.scores(names,names.map((_,i)=>i))),C.shareBtn('Clasificación',names.map((name,i)=>(i+1)+'. '+name+' · '+i+' puntos'),'#ffc93c'));
            }''')
            await page.wait_for_timeout(100)
            await capture('grafica')
            await page.locator('.plot-dot button').first.click()
            await expect(page.locator('.modal p')).to_have_count(20)
            await capture('detalle')
            await page.get_by_role('button', name='Cerrar', exact=True).click()
            if zoom == 1 and width == 390:
                await page.evaluate("Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false})")
                async with page.expect_download() as event:
                    await page.get_by_role('button', name='📤 Compartir resultado', exact=True).click()
                download = await event.value
                target = OUT / 'compartir-20-personas.png'
                await download.save_as(str(target))
                width_png, height_png = struct.unpack('>II', target.read_bytes()[16:24])
                assert width_png == 1080 and height_png >= 2000, (width_png, height_png)
            await page.goto(URL)
        assert errors == [], errors
        await browser.close()
        print('OK: 320/390/horizontal, texto 150 %, gráfica y detalle de 20 personas y PNG completo.', OUT, flush=True)


if __name__ == '__main__':
    asyncio.run(main())
