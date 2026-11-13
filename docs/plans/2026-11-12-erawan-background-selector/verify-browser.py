"""Check the built Erawan route with local Chrome; requires Python Playwright.
Usage: python3 verify-browser.py http://localhost:4321/apps/erawan/
"""
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
URL = sys.argv[1]
EXPECTED = ['none', 'P13', 'P15', 'P16', 'P18', 'P19', 'P22', 'P24', 'P28', 'P29', 'P30', 'P38', 'P40']


def ready(page):
    page.wait_for_selector('erawan-motion[data-ready="true"]')
    page.locator('.e-motion-controls').evaluate('(e)=>e.open=true')


def playing(page):
    page.wait_for_selector('erawan-motion[data-playing="true"]')


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--no-sandbox', '--disable-gpu'])
    try:
        context = browser.new_context(viewport={'width':1440,'height':1100}, reduced_motion='no-preference')
        page = context.new_page()
        page.set_default_navigation_timeout(120000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        assert page.goto(URL, wait_until='domcontentloaded').ok
        page.wait_for_selector('erawan-motion[data-ready="true"]')
        assert not page.locator('.e-motion-controls').evaluate('(e)=>e.open')
        ready(page)
        assert page.locator('#e-background option').evaluate_all('(a)=>a.map(e=>e.value)') == EXPECTED
        assert page.locator('#e-background').input_value() == 'P13'
        page.locator('#e-motion-strength').select_option('emphasized')
        for value in EXPECTED[1:]:
            page.locator('#e-background').select_option(value)
            playing(page)
            shown = page.locator('erawan-motion [data-pattern]:not([hidden])')
            assert shown.count() == 2 and shown.evaluate_all('(a)=>a.every(e=>e.dataset.pattern===a[0].dataset.pattern)')
            piece = shown.first.locator('.e-motion-piece').first
            before = piece.evaluate('(e)=>{const s=getComputedStyle(e);return [s.transform,s.opacity,s.strokeDashoffset].join("|")}')
            page.wait_for_function('''([id,before])=>{const e=document.querySelector(`[data-pattern="${id}"] .e-motion-piece`);const s=getComputedStyle(e);return [s.transform,s.opacity,s.strokeDashoffset].join('|')!==before}''', arg=[value, before])
        print('PASS: exactly 12 shortlisted choices plus None; each selected motif visibly animates.')
        page.locator('.e-motion-toggle').click()
        assert page.locator('erawan-motion').get_attribute('data-playing') == 'false'
        assert page.locator('[data-pattern="P40"] .e-motion-piece').first.evaluate('(e)=>getComputedStyle(e).animationPlayState') == 'paused'
        page.reload(); ready(page)
        assert page.locator('#e-background').input_value() == 'P40'
        assert page.locator('#e-motion-strength').input_value() == 'emphasized'
        assert page.locator('erawan-motion').get_attribute('data-playing') == 'false'
        page.locator('.e-motion-toggle').click(); playing(page)
        page.locator('#e-background').select_option('none')
        assert page.locator('erawan-motion [data-pattern]:not([hidden])').count() == 0
        assert page.locator('.e-motion-toggle').is_disabled()
        page.reload(); ready(page); assert page.locator('#e-background').input_value() == 'none'
        page.locator('#e-background').select_option('P13'); playing(page)
        page.locator('.e-foot').scroll_into_view_if_needed()
        playing(page)
        assert page.locator('.e-motion-backdrop').evaluate('(e)=>Math.abs(e.getBoundingClientRect().top)<1')
        page.locator('.e-hero').scroll_into_view_if_needed(); playing(page)
        print('PASS: pause/reload, saved choice/strength, None, and continued animation after scrolling past the hero.')
        page.evaluate('window.erawanNavigationProbe = true')
        page.locator('.e-top a[href="/docs/erawan-quick-start/"]').click()
        page.wait_for_url('**/docs/erawan-quick-start/')
        page.go_back(); ready(page); playing(page)
        assert page.locator('#e-background').input_value() == 'P13'
        assert page.evaluate('window.erawanNavigationProbe === true'), 'Expected Astro client navigation'
        assert page.locator('erawan-motion').count() == 1
        print('PASS: Astro navigation away and back restores one working component.')
        page.locator('#e-background').select_option('P28')
        page.locator('.e-motion-controls').evaluate('(e)=>e.open=false')
        for width,height in [(1440,900),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            for selector in ['.e-hero','.e-situations','.e-matrix','.e-wizard','.e-foot']:
                page.locator(selector).scroll_into_view_if_needed(); playing(page)
                assert page.locator('.e-motion-backdrop').evaluate('(e)=>{const r=e.getBoundingClientRect();return Math.abs(r.top)<1&&Math.abs(r.bottom-innerHeight)<1}')
                assert page.locator('.e-motion-controls summary').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth}')
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                if selector=='.e-matrix':page.screenshot(path=str(ROOT/f'scroll-{width}.png'))
            page.locator('.e-motion-controls summary').click()
            page.locator('#e-background').select_option('P19');playing(page)
            page.locator('.e-motion-controls summary').click()
        print('PASS: background stays viewport-sized and animated at all five page sections; floating selector works at the footer on desktop/mobile.')
        page.set_viewport_size({'width':1440,'height':900})
        page.locator('.e-motion-controls').evaluate('(e)=>e.open=true')
        page.locator('#e-background').select_option('P13')
        page.locator('#e-motion-strength').select_option('subtle')
        page.locator('.e-motion-controls').evaluate('(e)=>e.open=false')
        page.locator('.e-matrix').scroll_into_view_if_needed()
        page.screenshot(path=str(ROOT/'scroll-default.png'))
        page.locator('.e-motion-controls').evaluate('(e)=>e.open=true')
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('.e-motion-controls').screenshot(path=str(ROOT/'scroll-mobile-controls.png'))
        page.locator('#e-background').select_option('P28'); playing(page)
        assert not errors, errors
        context.close()
        reduced = browser.new_context(reduced_motion='reduce')
        page = reduced.new_page(); page.goto(URL); ready(page)
        assert page.locator('[data-pattern="P13"] .e-motion-piece').first.evaluate('(e)=>getComputedStyle(e).animationName') == 'none'
        page.locator('.e-motion-toggle').click(); playing(page)
        page.reload(); ready(page)
        assert page.locator('erawan-motion').get_attribute('data-playing') == 'false'
        assert page.locator('.e-motion-toggle').inner_text() == 'Play this preview'
        reduced.close()
        blocked = browser.new_context()
        blocked.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
        page = blocked.new_page(); page.goto(URL); ready(page)
        page.locator('#e-background').select_option('P19'); playing(page)
        assert page.locator('#e-background').input_value() == 'P19'
        blocked.close()
        invalid = browser.new_context()
        page = invalid.new_page(); page.goto(URL); ready(page)
        for stored in ['{bad json', '{"pattern":"P99","strength":"invalid"}']:
            page.evaluate('(s)=>localStorage.setItem("erawan-background-study",s)', stored)
            page.reload(); ready(page)
            assert page.locator('#e-background').input_value() == 'P13'
        invalid.close()
        no_js = browser.new_context(java_script_enabled=False)
        page = no_js.new_page(); page.goto(URL)
        assert page.locator('#e-title').is_visible()
        assert page.locator('.e-motion-controls').is_hidden()
        no_js.close()
        print('PASS: mobile fit, reduced-motion opt-in/reset, blocked/invalid storage, and no-JS content.')
        mockup = browser.new_page(viewport={'width':1440,'height':900})
        mockup.goto((ROOT/'scroll-layout.html').as_uri())
        mockup.screenshot(path=str(ROOT/'scroll-layout.png'))
        mockup.close()
    finally:
        browser.close()
