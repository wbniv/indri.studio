"""Verify the final Erawan background. Usage: python3 verify-browser.py URL"""
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
URL=sys.argv[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox'])
    try:
        context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='no-preference')
        context.add_init_script("localStorage.setItem('erawan-background-study',JSON.stringify({pattern:'none',strength:'subtle',paused:true,simulationOpacity:0}))")
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        assert page.goto(URL).ok
        page.wait_for_selector('erawan-motion[data-playing="true"]')
        assert page.locator('.e-motion-controls, #e-background, #e-simulation-opacity').count()==0
        assert page.locator('erawan-motion [data-pattern]').evaluate_all('(es)=>es.map(e=>e.dataset.pattern)')==['P30','P30']
        assert page.locator('erawan-motion').evaluate('(e)=>getComputedStyle(e).getPropertyValue("--e-motion-speed").trim()')=='.25'
        assert page.locator('erawan-motion').evaluate('(e)=>getComputedStyle(e).getPropertyValue("--e-motion-strength").trim()')=='3'
        for selector in ['.e-wf','.sim-stage','.sim-end','.sim-file','.sim-metrics']:
            state=page.locator(selector).first.evaluate("""e=>{const s=getComputedStyle(e);return [s.opacity,parseFloat(s.backgroundColor.split('/')[1])] }""")
            assert state==['1',.75],(selector,state)
        piece=page.locator('.e-motion-piece').first
        before=piece.evaluate('(e)=>getComputedStyle(e).transform')
        page.wait_for_function('before=>getComputedStyle(document.querySelector(".e-motion-piece")).transform!==before',arg=before)
        print('PASS: P30 emphasized, 75% surfaces, opaque foreground, no preview controls, and old preferences ignored.')
        for width,height in [(1440,900),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('scrollTo(0,0)');page.wait_for_timeout(300)
            y=page.locator('.e-motion-backdrop').bounding_box()['y']
            page.evaluate('scrollTo(0,300)');page.wait_for_timeout(300)
            assert abs(y-page.locator('.e-motion-backdrop').bounding_box()['y']-300)<1
            for section in ['.e-wf','.e-matrix','.e-foot']:
                page.locator(section).first.scroll_into_view_if_needed()
                page.wait_for_selector('erawan-motion[data-playing="true"]')
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.locator('.e-wf').first.scroll_into_view_if_needed();page.wait_for_timeout(1000)
            if 'localhost' in URL:page.screenshot(path=str(ROOT/f'final-settings-{width}.png'))
        page.evaluate('window.erawanNavigationProbe=true')
        page.locator('.e-top a[href="/docs/erawan-quick-start/"]').click()
        page.wait_for_url('**/docs/erawan-quick-start/')
        page.go_back();page.wait_for_selector('erawan-motion[data-playing="true"]')
        assert page.evaluate('window.erawanNavigationProbe===true')
        assert page.locator('erawan-motion').count()==1
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_function('()=>document.querySelector("erawan-motion").dataset.playing==="false"')
        assert piece.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
        page.emulate_media(reduced_motion='no-preference')
        page.wait_for_selector('erawan-motion[data-playing="true"]')
        assert not errors,errors
        context.close()
        context=browser.new_context(java_script_enabled=False)
        page=context.new_page();page.goto(URL)
        assert page.locator('h1').is_visible()
        assert page.locator('.e-motion-controls').count()==0
        assert page.locator('.e-wf').first.evaluate('(e)=>getComputedStyle(e).backgroundColor').endswith('/ 0.75)')
        context.close()
        print('PASS: desktop/mobile document scrolling, client navigation, reduced-motion changes, and no-JS content.')
        if 'localhost' in URL:
            page=browser.new_page(viewport={'width':1440,'height':900})
            page.goto((ROOT/'final-settings.html').as_uri())
            page.screenshot(path=str(ROOT/'final-settings.png'))
            page.close()
    finally:
        browser.close()
