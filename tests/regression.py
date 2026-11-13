"""Casos reproducibles de interfaz y PWA. Uso: python tests/regression.py.
Requiere Playwright y Chrome. En CI: CHROME_CHANNEL=chromium (playwright install chromium).
"""
import asyncio
import functools
import http.server
import os
import pathlib
import threading
import unittest
from playwright.async_api import async_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'index.html').as_uri()


class Regression(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        asyncio.get_running_loop().set_debug(False)
        self.p = await async_playwright().start()
        channel = os.environ.get('CHROME_CHANNEL', 'chrome')
        self.browser = await self.p.chromium.launch(channel=None if channel == 'chromium' else channel)
        self.context = await self.browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        self.page = await self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        await self.page.goto(URL)

    async def asyncTearDown(self):
        await self.browser.close()
        await self.p.stop()
        self.assertEqual(self.errors, [])

    async def seed(self, game, players, settings):
        await self.page.evaluate('''({game,players,settings}) => {
          const g=Corrillo.games.find(g=>g.id===game);
          Corrillo.store.set('cfg:'+game,{players,s:settings,known:(g.cats||[]).map(c=>c.id)});
        }''', {'game': game, 'players': players, 'settings': settings})
        await self.page.goto(URL + '#/j/' + game)

    async def test_reduce_players_and_duplicate_names(self):
        await self.seed('impostor', [''] * 6, {'impostors': 4})
        row = self.page.locator('.srow').filter(has=self.page.get_by_text('Número de jugadores', exact=True))
        for _ in range(3):
            await row.get_by_role('button', name='Menos', exact=True).click()
        impostors = self.page.locator('.srow').filter(has=self.page.get_by_text('Impostores', exact=True))
        await expect(impostors.locator('b')).to_have_text('1')
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('cfg:impostor').s.impostors"), 1)
        await self.page.get_by_label('Nombre 1', exact=True).fill('Ana')
        await self.page.get_by_label('Nombre 2', exact=True).fill(' ana ')
        await expect(self.page.get_by_role('button', name='Empezar', exact=True)).to_be_disabled()
        await self.page.get_by_label('Nombre 2', exact=True).fill('Luis')
        await self.page.get_by_role('button', name='Empezar', exact=True).click()
        await expect(self.page.locator('.play')).to_be_visible()

    async def test_filters_and_random_respect_group(self):
        await self.page.get_by_text('Encontrar juego para el grupo', exact=True).click()
        await self.page.get_by_label('Jugadores', exact=True).select_option('2')
        await self.page.get_by_label('Duración aproximada', exact=True).select_option('5')
        await self.page.get_by_label('Estilo', exact=True).select_option('accion')
        hrefs = await self.page.locator('.gcard').evaluate_all('(els)=>els.map(e=>e.hash)')
        self.assertTrue(hrefs)
        await self.page.get_by_role('button', name='🎲 Al azar', exact=True).click()
        self.assertIn(await self.page.evaluate('location.hash'), hrefs)

    async def test_custom_truth_dare_and_backup_roundtrip(self):
        await self.page.goto(URL + '#/j/verdadreto')
        await self.page.get_by_text('✏️ Contenido propio', exact=True).click()
        await self.page.get_by_label('Tus verdades', exact=True).fill('¿Cuál sería tu plan perfecto?')
        await self.page.get_by_label('Tus retos', exact=True).fill('Imita a {j}.')
        await self.page.get_by_role('button', name='Guardar', exact=True).click()
        await expect(self.page.get_by_text('2 guardadas', exact=True)).to_be_visible()
        await self.page.reload()
        self.assertEqual(await self.page.evaluate("Corrillo.content.verdadreto.reto.custom[0]"), 'Imita a {j}.')
        await self.page.goto(URL + '#/datos')
        async with self.page.expect_download() as download_info:
            await self.page.get_by_role('button', name='Descargar copia', exact=True).click()
        download = await download_info.value
        path = await download.path()
        await self.page.evaluate("localStorage.removeItem('corrillo:custom:verdadreto'); Corrillo.loadCustom()")
        await self.page.locator('input[type=file]').set_input_files(path)
        await self.page.get_by_role('button', name='Restaurar', exact=True).click()
        await expect(self.page.get_by_text('Copia restaurada.', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.content.verdadreto.verdad.custom.length"), 1)

    async def test_scoreboard_migration_and_correction(self):
        await self.page.evaluate("Corrillo.store.set('night',{'Ana':2,' ana ':3})")
        await self.page.goto(URL + '#/marcador')
        await expect(self.page.locator('.score')).to_have_count(1)
        await expect(self.page.locator('.score b')).to_have_text('5 🏆')
        await self.page.get_by_role('button', name='Quitar una victoria a Ana', exact=True).click()
        await expect(self.page.locator('.score b')).to_have_text('4 🏆')
        await self.page.get_by_label('Jugador al que añadir una victoria', exact=True).fill('Luis')
        await self.page.get_by_role('button', name='Añadir victoria', exact=True).click()
        await expect(self.page.locator('.score')).to_have_count(2)

    async def test_estimate_tie_and_history_reset(self):
        await self.seed('aojo', ['Ana', 'Luis'], {'rounds': 1, 'cats': ['general']})
        await self.page.evaluate('''() => {
          Corrillo.content.cifras={general:[['Pregunta A',10,'cosas','Pregunta B',10,'cosas',0,0]]};
          Corrillo.content.estimaciones={}; Math.random=()=>0;
        }''')
        await self.page.get_by_role('button', name='Empezar', exact=True).click()
        await self.page.get_by_role('button', name='Empezar a estimar', exact=True).click()
        for i, value in enumerate([9, 11]):
            await self.page.get_by_role('button', name='Ver mi pregunta', exact=True).click()
            for _ in range(value):
                await self.page.get_by_role('button', name='Subir un poco', exact=True).click()
            await self.page.get_by_role('button', name='Ocultar y pasar el móvil' if i == 0 else 'Ocultar y continuar', exact=True).click()
        await expect(self.page.locator('.scores .score b')).to_have_text(['1 pt', '1 pt'])
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night')"), {'Ana': 1, 'Luis': 1})
        await self.page.get_by_role('button', name='Ajustes', exact=True).click()
        await self.page.get_by_text('Tarjetas disponibles', exact=True).click()
        await expect(self.page.locator('[data-deck=aojo]')).to_contain_text('quedan 1 de 2')
        await self.page.get_by_role('button', name='Reiniciar historial de este juego', exact=True).click()
        await self.page.get_by_role('button', name='Reiniciar', exact=True).click()
        await expect(self.page.locator('[data-deck=aojo]')).to_contain_text('quedan 2 de 2')

    async def test_party_safe_skip_cleans_timer_and_automatic_transition(self):
        await self.seed('fiesta', ['Ana', 'Luis'], {'limit': 2, 'order': 'lista', 'spicy': False, 'cats': ['cinco', 'prefieres']})
        await self.page.evaluate("Corrillo.store.set('cfg:cinco',{players:['Ana','Luis'],s:{secs:5,cats:['facil','picante']},known:Corrillo.games.find(g=>g.id==='cinco').cats.map(c=>c.id)})")
        await self.page.get_by_role('button', name='Empezar', exact=True).click()
        await self.page.get_by_role('button', name='¡Vamos!', exact=True).click()
        await self.page.get_by_role('button', name='Ver la consigna y empezar', exact=True).click()
        await self.page.get_by_role('button', name='Saltar al siguiente juego', exact=True).click()
        await expect(self.page.get_by_role('heading', name='¿Qué prefieres?', exact=True)).to_be_visible()
        await self.page.wait_for_timeout(5200)
        await expect(self.page.get_by_role('heading', name='¿Qué prefieres?', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('used:cinco',[]).length"), 0)
        await self.page.get_by_role('button', name='¡Vamos!', exact=True).click()
        for _ in range(2):
            await self.page.get_by_role('button', name='Siguiente dilema', exact=True).click()
        await expect(self.page.get_by_role('heading', name='5 segundos', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('used:prefieres',[]).length"), 2)

    async def test_pwa_offline_and_server_error_fallback(self):
        class Handler(http.server.SimpleHTTPRequestHandler):
            fail_css = False
            def log_message(self, *args):
                pass
            def do_GET(self):
                if self.path.split('?')[0] == '/css/styles.css' and self.fail_css:
                    self.send_response(503)
                    self.end_headers()
                    self.wfile.write(b'error simulado')
                else:
                    super().do_GET()
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            await self.page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
            await self.page.evaluate('navigator.serviceWorker.ready')
            await self.page.wait_for_function('navigator.serviceWorker.controller !== null')
            await expect(self.page.locator('#offline-status')).to_contain_text('Disponible sin conexión')
            Handler.fail_css = True
            result = await self.page.evaluate("fetch('css/styles.css',{cache:'no-store'}).then(async r=>({status:r.status,text:await r.text()}))")
            self.assertEqual(result['status'], 200)
            self.assertIn('--ink:', result['text'])
            self.assertEqual(await self.page.evaluate("caches.open('corrillo-v7').then(c=>c.match(new URL('css/styles.css',location.href).href)).then(r=>r.status)"), 200)
            await self.context.set_offline(True)
            await self.page.reload()
            await expect(self.page.locator('.gcard')).to_have_count(26)
            await self.page.get_by_role('link', name='📏 A ojo', exact=False).click()
            await self.page.get_by_role('button', name='Empezar', exact=True).click()
            await expect(self.page.locator('.play')).to_be_visible()
        finally:
            await asyncio.to_thread(server.shutdown)
            server.server_close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
