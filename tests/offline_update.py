"""Instalación con foto ausente y actualización incompatible A/B en un servidor local real."""
import asyncio
import base64
import hashlib
import http.server
import json
import os
import pathlib
import re
import threading
from playwright.async_api import async_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORKER = (ROOT / 'sw.js').read_text(encoding='utf-8')
CORE = (ROOT / 'js/core/core.js').read_bytes()
NEXT_CORE = CORE + b'\nwindow.corrilloTestBuild="B";\n'
NEXT_HASH = 'sha256-' + base64.b64encode(hashlib.sha256(NEXT_CORE).digest()).decode()
NEXT_WORKER = re.sub(r"const VERSION = '[^']+'", "const VERSION = 'corrillo-vtestB'", WORKER)
NEXT_WORKER = re.sub(r'("js/core/core.js":\s*)"[^"]+"', lambda m: m[1] + json.dumps(NEXT_HASH), NEXT_WORKER)
FILES = json.loads(re.search(r'const FILES = (\[[\s\S]*?\]);', WORKER)[1])
IMAGES = sum(name.startswith('img/') for name in FILES)


class Handler(http.server.SimpleHTTPRequestHandler):
    next_version = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/img/precios/ps5.jpg':
            self.send_error(404)
            return
        content = NEXT_WORKER.encode('utf-8') if path == '/sw.js' and self.next_version else NEXT_CORE if path == '/js/core/core.js' and self.next_version else None
        if content is not None:
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            super().do_GET()


async def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        async with async_playwright() as p:
            channel = os.environ.get('CHROME_CHANNEL', 'chrome')
            browser = await p.chromium.launch(channel=None if channel == 'chromium' else channel)
            context = await browser.new_context(viewport={'width': 390, 'height': 844})
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
            await page.evaluate('navigator.serviceWorker.ready')
            await page.wait_for_function('navigator.serviceWorker.controller !== null')
            await expect(page.locator('#offline-status')).to_contain_text('Disponible sin conexión')
            await expect(page.locator('#offline-status')).to_contain_text(f'Fotos: {IMAGES - 1} de {IMAGES}', timeout=20000)
            await page.goto(page.url.split('#')[0] + '#/j/rompehielos')
            await page.get_by_role('button', name='Empezar', exact=True).click()
            await expect(page.locator('.play')).to_be_visible()
            before = await page.locator('.stage').inner_text()
            Handler.next_version = True
            await page.evaluate('navigator.serviceWorker.getRegistration().then(reg=>reg.update())')
            await page.wait_for_function('navigator.serviceWorker.getRegistration().then(reg=>!!reg.waiting)')
            old_core = await page.evaluate("fetch('js/core/core.js').then(r=>r.text())")
            assert 'corrilloTestBuild' not in old_core, 'A recibió un script incompatible de B'
            assert await page.evaluate('window.corrilloTestBuild || null') is None
            assert await page.locator('.stage').inner_text() == before, 'La actualización interrumpió la partida'
            await page.get_by_label('Salir de la partida', exact=True).click()
            await page.locator('.modal').get_by_role('button', name='Salir', exact=True).click()
            await expect(page.locator('.setup')).to_be_visible()
            await page.get_by_role('link', name='Volver al menú', exact=True).click()
            await page.get_by_role('button', name='Actualizar a la nueva versión', exact=True).click()
            await page.wait_for_function('window.corrilloTestBuild === "B"')
            assert 'corrillo-vtestB' in await page.evaluate('caches.keys()')
            await context.set_offline(True)
            await page.reload()
            await expect(page.locator('.gcard')).to_have_count(28)
            await page.evaluate('Math.random=()=>0')
            await page.goto(page.url.split('#')[0] + '#/j/precio')
            await page.get_by_role('button', name='Empezar', exact=True).click()
            await expect(page.get_by_label('Foto no disponible', exact=True)).to_be_visible()
            assert errors == [], errors
            await browser.close()
            print('OK: foto ausente, esenciales offline, A inmutable, aceptación de B y arranque offline de B.', flush=True)
    finally:
        await asyncio.to_thread(server.shutdown)
        server.server_close()


if __name__ == '__main__':
    asyncio.run(main())
