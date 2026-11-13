"""Regresiones de reglas y privacidad acordadas en la auditoría. python tests/audit_regression.py."""
import asyncio
import pathlib
import os
import unittest
from playwright.async_api import async_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'index.html').as_uri()


class Audit(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        asyncio.get_running_loop().set_debug(False)
        self.p = await async_playwright().start()
        channel = os.environ.get('CHROME_CHANNEL', 'chrome')
        self.browser = await self.p.chromium.launch(channel=None if channel == 'chromium' else channel)
        self.context = await self.browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        self.page = await self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        await self.page.clock.install()
        await self.page.goto(URL)

    async def asyncTearDown(self):
        await self.browser.close()
        await self.p.stop()
        self.assertEqual(self.errors, [])

    async def start(self, game, players, settings):
        await self.page.evaluate('''({game,players,settings}) => {
          const g=Corrillo.games.find(g=>g.id===game);
          Corrillo.store.set('cfg:'+game,{players,s:settings,known:(g.cats||[]).map(c=>c.id)});
        }''', {'game': game, 'players': players, 'settings': settings})
        await self.page.goto(URL + '#/j/' + game)
        await self.page.get_by_role('button', name='Empezar', exact=True).click()
        await expect(self.page.locator('.play')).to_be_visible()

    async def deal(self, count):
        cards = []
        for i in range(count):
            await self.page.get_by_role('button', name='Ver mi carta', exact=True).click()
            cards.append(await self.page.locator('.stage .secret h2').inner_text())
            await self.page.get_by_role('button', name='Ocultar y empezar' if i == count - 1 else 'Ocultar y pasar el móvil', exact=True).click()
        return cards

    async def test_spy_last_chance_does_not_show_solution(self):
        players = ['Ana', 'Luis', 'Eva']
        await self.start('espia', players, {'duration': 0, 'spies': 1, 'tracking': 'track', 'guess': True, 'cats': ['ciudad']})
        cards = await self.deal(3)
        spy = next(i for i, card in enumerate(cards) if card == 'Eres espía')
        place = next(card for card in cards if card != 'Eres espía')
        await self.page.get_by_role('button', name='Ir a la votación', exact=True).click()
        await self.page.locator('.stage').get_by_role('button', name=players[spy], exact=True).click()
        self.assertNotIn(place, await self.page.locator('.stage').inner_text())
        await self.page.get_by_role('button', name='Ha fallado', exact=True).click()
        self.assertIn(place, await self.page.locator('.stage').inner_text())
        wins = await self.page.evaluate("Corrillo.store.get('night',{})")
        self.assertEqual(wins, {name: 1 for i, name in enumerate(players) if i != spy})

    async def test_survival_only_surviving_infiltrator_wins(self):
        players = ['Ana', 'Luis', 'Eva', 'Pablo', 'Mar']
        await self.start('espia', players, {'duration': 0, 'spies': 2, 'variant': 'survival', 'tracking': 'track', 'cats': ['ciudad']})
        cards = await self.deal(5)
        spies = [i for i, card in enumerate(cards) if card == 'Eres espía']
        normals = [i for i in range(5) if i not in spies]
        for index, victim in enumerate([spies[0], normals[0], normals[1]]):
            await self.page.get_by_role('button', name='Ir a la votación', exact=True).click()
            await self.page.locator('.stage').get_by_role('button', name=players[victim], exact=True).click()
            if index < 2:
                await expect(self.page.get_by_role('button', name='Seguir hablando', exact=True)).to_be_visible()
                self.assertNotIn(players[spies[1]] + ' era', await self.page.locator('.stage').inner_text())
                await self.page.get_by_role('button', name='Seguir hablando', exact=True).click()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {players[spies[1]]: 1})

    async def test_secret_is_covered_on_background_and_returns_same_player(self):
        await self.start('impostor', ['Ana', 'Luis', 'Eva'], {'cats': ['comida'], 'timer': False})
        await self.page.get_by_role('button', name='Ver mi carta', exact=True).click()
        before = await self.page.locator('.stage').inner_text()
        await self.page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange'))")
        await expect(self.page.locator('.privacy-cover')).to_be_visible()
        await expect(self.page.locator('.stage')).to_have_attribute('aria-hidden', 'true')
        await self.page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false})")
        await self.page.get_by_role('button', name='Volver a mostrar', exact=True).click()
        self.assertEqual(await self.page.locator('.stage').inner_text(), before)

    async def test_bomb_needs_no_pass_button_and_records_victim_after_explosion(self):
        await self.start('bomba', ['Ana', 'Luis', 'Eva'], {'fuse': 'custom', 'minimum': 1, 'maximum': 1, 'format': 'explosions', 'explosions': 1, 'cats': ['facil']})
        await self.page.get_by_role('button', name='Encender la mecha', exact=True).click()
        await expect(self.page.locator('.stage button')).to_have_count(0)
        await self.page.clock.fast_forward(1500)
        await expect(self.page.get_by_role('heading', name='¿A quién le ha explotado?', exact=True)).to_be_visible()
        await self.page.locator('.stage').get_by_role('button', name='Ana', exact=True).click()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {'Luis': 1, 'Eva': 1})

    async def test_pause_preserves_remaining_bomb_time(self):
        await self.start('bomba', ['Ana', 'Luis'], {'fuse': 'custom', 'minimum': 15, 'maximum': 15, 'visible': True, 'cats': ['facil']})
        await self.page.get_by_role('button', name='Encender la mecha', exact=True).click()
        await self.page.clock.fast_forward(5000)
        remaining = await self.page.locator('.stage .clock').inner_text()
        await self.page.get_by_role('button', name='☰', exact=True).click()
        await self.page.get_by_role('button', name='Pausar y cubrir pantalla', exact=True).click()
        await self.page.clock.fast_forward(60000)
        self.assertEqual(await self.page.locator('.stage .clock').inner_text(), remaining)
        await self.page.get_by_role('button', name='Reanudar', exact=True).click()
        await self.page.clock.fast_forward(11000)
        await expect(self.page.get_by_role('heading', name='¿A quién le ha explotado?', exact=True)).to_be_visible()

    async def test_cuatro_reuses_deck_and_next_team_starts_each_phase(self):
        await self.start('charadas', ['Ana', 'Luis', 'Eva', 'Pablo', 'Mar'], {'format': 'cuatro', 'teamCount': 2, 'startTeam': 1, 'deckSource': 'custom', 'deckSize': 1, 'cats': ['objetos']})
        await self.page.get_by_label('Aportaciones de esta partida', exact=True).fill('Tostadora')
        await self.page.get_by_role('button', name='Crear mazo y empezar', exact=True).click()
        for phase in range(4):
            await expect(self.page.locator('.stage h2')).to_have_text('Equipo ' + str(phase % 2 + 1))
            await self.page.get_by_role('button', name='Empezar turno', exact=True).click()
            await expect(self.page.locator('.stage .word')).to_have_text('Tostadora')
            await self.page.get_by_role('button', name='Correcto', exact=True).click()
            await self.page.get_by_role('button', name='Ver clasificación' if phase == 3 else 'Continuar', exact=True).click()
        await expect(self.page.get_by_role('heading', name='Empate total', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})

    async def test_cuatro_pass_and_timeout_keep_pending_cards_with_three_teams(self):
        await self.start('charadas', ['Ana', 'Luis', 'Eva', 'Pablo', 'Mar', 'Leo'], {'format': 'cuatro', 'teamCount': 3, 'startTeam': 1, 'deckSource': 'custom', 'deckSize': 2, 'cats': ['objetos']})
        await self.page.get_by_label('Aportaciones de esta partida', exact=True).fill('Tostadora\nNevera')
        await self.page.get_by_role('button', name='Crear mazo y empezar', exact=True).click()
        await self.page.get_by_role('button', name='Empezar turno', exact=True).click()
        first = await self.page.locator('.stage .word').inner_text()
        await self.page.get_by_role('button', name='Pasar', exact=True).click()
        second = await self.page.locator('.stage .word').inner_text()
        self.assertNotEqual(first, second)
        await self.page.get_by_role('button', name='Correcto', exact=True).click()
        await self.page.clock.fast_forward(61000)
        await self.page.get_by_role('button', name='Continuar', exact=True).click()
        await expect(self.page.locator('.stage h2')).to_have_text('Equipo 2')
        await self.page.get_by_role('button', name='Empezar turno', exact=True).click()
        await expect(self.page.locator('.stage .word')).to_have_text(first)
        await self.page.get_by_role('button', name='Correcto', exact=True).click()
        await self.page.get_by_role('button', name='Continuar', exact=True).click()
        await expect(self.page.locator('.stage h2')).to_have_text('Equipo 3')
        await expect(self.page.locator('.stage .pill')).to_contain_text('Fase 2 de 4 · 2 cartas pendientes')
        await self.page.get_by_role('button', name='Empezar turno', exact=True).click()
        await expect(self.page.locator('.stage .clock')).to_have_text('1:00')
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})

    async def test_private_ranking_has_same_order_and_no_results_before_everyone_finishes(self):
        await self.start('ranking', ['Ana', 'Luis'], {'mode': 'private', 'slots': 5, 'cats': ['comida']})
        seen = []
        for player in range(2):
            await self.page.get_by_role('button', name='Hacer mi ranking', exact=True).click()
            cards = []
            for position in range(5):
                cards.append(await self.page.locator('.stage .card.q').inner_text())
                await self.page.locator('.rank-slots button:not(:disabled)').first.click()
            seen.append(cards)
            if player == 0:
                self.assertNotIn('Vuestros rankings', await self.page.locator('.stage').inner_text())
        self.assertEqual(seen[0], seen[1])
        await expect(self.page.get_by_role('heading', name='Vuestros rankings', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})

    async def test_pista_unique_cancels_all_duplicates_and_allows_blind_guess(self):
        await self.start('pistaunica', ['Ana', 'Luis', 'Eva'], {'mode': 'coop', 'rounds': 1, 'cats': ['objetos']})
        await self.page.get_by_role('button', name='Recoger pistas', exact=True).click()
        for index, clue in enumerate(['Café', 'cafe']):
            await self.page.get_by_role('button', name='Escribir mi pista', exact=True).click()
            await self.page.get_by_label('Tu pista', exact=True).fill(clue)
            await self.page.get_by_role('button', name='Ocultar y continuar' if index == 1 else 'Ocultar y pasar el móvil', exact=True).click()
        await self.page.get_by_role('button', name='Revisar pistas', exact=True).click()
        await expect(self.page.locator('.stage input[type=checkbox]:checked:disabled')).to_have_count(2)
        await self.page.get_by_role('button', name='Confirmar pistas válidas', exact=True).click()
        await self.page.get_by_role('button', name='Ver mis pistas', exact=True).click()
        await expect(self.page.get_by_text('Se han anulado todas. Puedes intentar adivinar a ciegas.', exact=True)).to_be_visible()
        await self.page.get_by_role('button', name='Ya he dicho mi respuesta', exact=True).click()
        await self.page.get_by_role('button', name='Ha fallado', exact=True).click()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})

    async def test_feedback_prepares_public_draft_without_session_names(self):
        await self.start('rompehielos', ['PersonaPrivada', 'OtraPersona'], {'cats': ['ligero']})
        await self.page.get_by_role('button', name='☰', exact=True).click()
        await self.page.get_by_role('button', name='Esta tarjeta no encaja', exact=True).click()
        await self.page.get_by_label('Comentario del informe', exact=True).fill('Revisar redacción')
        preview = await self.page.locator('.feedback-preview').inner_text()
        self.assertNotIn('PersonaPrivada', preview)
        self.assertIn('Revisar redacción', preview)
        await self.page.get_by_role('button', name='Guardar informe local', exact=True).click()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('feedback').length"), 1)
        await expect(self.page.get_by_role('link', name='Preparar incidencia en GitHub', exact=True)).to_have_attribute('href', __import__('re').compile(r'https://github.com/R4INYIS/corrillo/issues/new\?'))

    async def test_secret_ballot_disallows_self_vote_and_persistent_tie_eliminates_nobody(self):
        await self.start('impostor', ['Ana', 'Luis', 'Eva'], {'cats': ['comida'], 'timer': False})
        await self.page.evaluate('''() => {
          const C=Corrillo,ctx=C.currentContext; window.expelled=null; window.tied=0;
          C.accusation(ctx,[0,1,2],{secret:true},i=>window.expelled=i,()=>{window.tied++;ctx.show(C.h('h2',null,'Seguid discutiendo'));});
        }''')
        for _ in range(2):
            for voter, choice in [('Ana', 'Luis'), ('Luis', 'Ana'), ('Eva', 'Abstenerme')]:
                await self.page.get_by_role('button', name='Votar en secreto', exact=True).click()
                await expect(self.page.locator('.stage').get_by_role('button', name=voter, exact=True)).to_have_count(0)
                await self.page.locator('.stage').get_by_role('button', name=choice, exact=True).click()
        self.assertEqual(await self.page.evaluate('[window.expelled,window.tied]'), [None, 1])
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})

    async def test_individual_onda_uses_mean_and_complete_person_cycle(self):
        await self.page.evaluate('Math.random=()=>0.5')
        await self.start('onda', ['Ana', 'Luis', 'Eva'], {'mode': 'individual', 'rounds': 1, 'cats': ['clasico']})
        for turn in range(3):
            await self.page.get_by_role('button', name='Ver la franja', exact=True).click()
            await self.page.locator('.stage input[type=text]').fill('Una pista')
            await self.page.get_by_role('button', name='Ocultar y enseñar la pista', exact=True).click()
            for guess in range(2):
                await self.page.get_by_role('button', name='Elegir mi posición', exact=True).click()
                if guess:
                    await self.page.locator('.stage svg[role=slider]').press('End')
                await self.page.get_by_role('button', name='Ocultar y continuar' if guess else 'Ocultar y pasar el móvil', exact=True).click()
            if turn == 0:
                self.assertEqual(await self.page.evaluate('Corrillo.currentContext.progress.points'), [2, 4, 0])
            await self.page.get_by_role('button', name='Ver clasificación' if turn == 2 else 'Siguiente ronda', exact=True).click()
        self.assertEqual(await self.page.evaluate('Corrillo.currentContext.progress.points'), [10, 6, 2])
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {'Ana': 1})

    async def test_conocemos_oral_keeps_answer_private_then_accepts_group_verdict(self):
        await self.start('conocemos', ['Ana', 'Luis', 'Eva'], {'length': 'total', 'rounds': 1, 'interaction': 'public', 'cats': ['gustos']})
        await self.page.locator('.stage').get_by_role('button', name='Empezar', exact=True).click()
        await self.page.get_by_role('button', name='Responder en secreto', exact=True).click()
        await self.page.locator('.stage .opt').first.click()
        await expect(self.page.get_by_role('button', name='Ya hemos respondido: revelar', exact=True)).to_be_visible()
        self.assertNotIn('La respuesta de Ana', await self.page.locator('.stage').inner_text())
        await self.page.get_by_role('button', name='Ya hemos respondido: revelar', exact=True).click()
        await self.page.get_by_label('Luis', exact=True).check()
        await self.page.get_by_role('button', name='Confirmar aciertos', exact=True).click()
        await self.page.get_by_role('button', name='Ver clasificación', exact=True).click()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {'Ana': 1, 'Luis': 1})

    async def test_who_said_accepts_both_identical_authors_and_never_scores_own_answer(self):
        await self.start('quienlodijo', ['Ana', 'Luis', 'Eva'], {'competitive': True, 'predictions': 'private', 'rounds': 1, 'cats': ['clasico']})
        await self.page.get_by_role('button', name='Empezar a escribir', exact=True).click()
        for index, answer in enumerate(['Sol', 'Sol', 'Luna']):
            await self.page.get_by_role('button', name='Escribir mi respuesta', exact=True).click()
            await self.page.locator('.stage input[type=text]').fill(answer)
            await self.page.get_by_role('button', name='Ocultar y continuar' if index == 2 else 'Ocultar y pasar el móvil', exact=True).click()
        for response in range(2):
            voter = await self.page.locator('.stage h2.name').inner_text()
            count = 1 if voter == 'Eva' else 2
            for _ in range(count):
                await self.page.get_by_role('button', name='Adivinar autor', exact=True).click()
                text = await self.page.locator('.stage .card.q').inner_text()
                await self.page.locator('.stage .pgrid').get_by_role('button', name='Luis' if 'Sol' in text else 'Eva', exact=True).click()
            await self.page.get_by_role('button', name='Ver clasificación' if response else 'Siguiente respuesta', exact=True).click()
        self.assertEqual(await self.page.evaluate('Corrillo.currentContext.progress.points'), [1, 1, 1])
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})

    async def test_three_teams_have_equal_turns_and_win_for_every_member(self):
        await self.start('prohibidas', ['Ana', 'Luis', 'Eva', 'Pablo', 'Mar', 'Leo', 'Sol'], {'teams': True, 'teamCount': 3, 'duration': 30, 'rounds': 1, 'cats': ['facil']})
        speakers = []
        for turn in range(3):
            speakers.append(await self.page.locator('.stage h2.name').inner_text())
            await self.page.locator('.stage').get_by_role('button', name='Empezar', exact=True).click()
            if turn == 0:
                await self.page.get_by_role('button', name='Acierto', exact=True).click()
            await self.page.clock.fast_forward(31000)
            await self.page.get_by_role('button', name='Ver clasificación' if turn == 2 else 'Siguiente turno', exact=True).click()
        self.assertEqual(speakers, ['Ana', 'Luis', 'Eva'])
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {'Ana': 1, 'Pablo': 1, 'Sol': 1})

    async def test_subasta_timeout_passes_without_bid_and_challenges_with_bid(self):
        await self.page.evaluate('''() => {Math.random=()=>0;Corrillo.content.cifras={general:[['Pregunta A',10,'cosas','Pregunta B',20,'cosas',0,0]]};Corrillo.content.estimaciones={};}''')
        await self.start('subasta', ['Ana', 'Luis', 'Eva'], {'decision': 10, 'rounds': 1, 'cats': ['general']})
        await expect(self.page.locator('.stage .lead')).to_contain_text('Ana')
        await self.page.clock.fast_forward(11000)
        await expect(self.page.locator('.stage .lead')).to_contain_text('Luis')
        await self.page.get_by_role('button', name='Introducir cifra con el teclado', exact=True).click()
        await self.page.get_by_label('Introducir cifra exacta', exact=True).fill('11')
        await self.page.get_by_role('button', name='Usar esta cifra', exact=True).click()
        await self.page.get_by_role('button', name='Apostar', exact=True).click()
        await self.page.clock.fast_forward(11000)
        await expect(self.page.get_by_role('heading', name='Luis se había pasado', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {'Eva': 1})

    async def test_hiding_entire_deck_during_play_has_a_controlled_exit(self):
        await self.start('rompehielos', ['Ana', 'Luis'], {'cats': ['ligero']})
        await self.page.evaluate("Corrillo.store.set('hiddenCards',Corrillo.pool(Corrillo.content.rompehielos,['ligero']).map(Corrillo.cardId))")
        await self.page.get_by_role('button', name='Siguiente', exact=True).click()
        await expect(self.page.get_by_role('heading', name='No quedan tarjetas permitidas', exact=True)).to_be_visible()
        await self.page.get_by_role('button', name='Volver a ajustes', exact=True).click()
        await expect(self.page.get_by_role('button', name='Empezar', exact=True)).to_be_disabled()

    async def test_selective_delete_only_removes_the_selected_category(self):
        await self.page.evaluate("Corrillo.store.set('night',{Ana:3});Corrillo.store.set('last',['Ana']);Corrillo.store.set('custom:rompehielos',['Pregunta propia'])")
        await self.page.goto(URL + '#/datos')
        await self.page.get_by_text('Borrar datos por categorías', exact=True).click()
        await self.page.get_by_label('Marcador', exact=True).check()
        await self.page.get_by_role('button', name='Borrar lo seleccionado', exact=True).click()
        await self.page.locator('.modal').get_by_role('button', name='Borrar', exact=True).click()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',null)"), None)
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('last')"), ['Ana'])
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('custom:rompehielos')"), ['Pregunta propia'])

    async def test_fiesta_does_not_cut_competitive_cycle(self):
        players = ['Ana', 'Luis', 'Eva', 'Pablo']
        await self.start('fiesta', players, {'limit': 5, 'order': 'lista', 'format': 'quick', 'cats': ['cinco', 'prefieres']})
        await self.page.get_by_role('button', name='¡Vamos!', exact=True).click()
        turns = []
        for _ in range(4):
            turns.append(await self.page.locator('.stage h2.name').inner_text())
            await self.page.get_by_role('button', name='Ver la consigna y empezar', exact=True).click()
            await self.page.get_by_role('button', name='¡Dichas las tres!', exact=True).click()
        self.assertEqual(set(turns), set(players))
        await expect(self.page.get_by_role('heading', name='Empate total', exact=True)).to_be_visible()
        await expect(self.page.get_by_role('button', name='Siguiente juego', exact=True)).to_be_visible()
        self.assertEqual(await self.page.evaluate("Corrillo.store.get('night',{})"), {})


if __name__ == '__main__':
    unittest.main(verbosity=2)
