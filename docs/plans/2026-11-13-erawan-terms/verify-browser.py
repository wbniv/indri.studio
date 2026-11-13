"""Check Erawan terms, navigation and the published licence. Usage: python3 verify-browser.py ORIGIN"""
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright
origin=sys.argv[1].rstrip('/')
root=Path(__file__).resolve().parent
license_text=Path('/home/will/erawan/LICENSE').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox'])
 try:
  for width,height in [(1440,900),(390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height})
   assert page.goto(origin+'/apps/erawan/terms/').ok
   assert page.locator('h1').inner_text()=='Erawan terms of service'
   assert ' '.join(page.locator('.e-license').inner_text().split())==' '.join(license_text.split())
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert page.locator('.e-terms a[href="mailto:hello@indri.studio"]').count()==1
   if 'localhost' in origin:page.screenshot(path=str(root/f'terms-{width}.png'),full_page=True)
   page.locator('.e-back a[href="/apps/erawan/privacy/"]').click()
   page.wait_for_url('**/apps/erawan/privacy/')
   page.locator('.e-back a[href="/apps/erawan/terms/"]').click()
   page.wait_for_url('**/apps/erawan/terms/')
   page.locator('.e-back a[href="/apps/erawan/"]').click()
   page.wait_for_url('**/apps/erawan/')
   page.locator('.e-foot a[href="/apps/erawan/terms/"]').click()
   page.wait_for_url('**/apps/erawan/terms/')
   page.close()
  print('PASS: terms HTTP 200, exact repository MIT licence, contact link, desktop/mobile fit, and reciprocal Home/Privacy/Terms navigation.')
  if 'localhost' in origin:
   page=browser.new_page(viewport={'width':1440,'height':900})
   page.goto((root/'terms.html').as_uri());page.screenshot(path=str(root/'terms.png'))
   page.close()
 finally:browser.close()
