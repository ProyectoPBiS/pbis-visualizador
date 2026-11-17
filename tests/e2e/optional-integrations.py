"""Optional integration cards through the actual Excel import, centre filter and PDF."""
import argparse
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
import fitz

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:19032')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
out = root/'test-results/optional-integrations'
out.mkdir(parents=True, exist_ok=True)
stamp = '2026-11-01 10:00:00 -> '

def workbook(name, classify):
    rows = []
    for i in range(8):
        row = {'Usuario Id': 'TEST'+str(i+1), 'Alumno Id': 'DEMO'+str(i+1),
               'Estudio': '4826' if i<4 else '9999', 'Curso': '1.º ESO', 'Grupo': 'A',
               'dia': stamp+'Par', 'start': '2026-11-01', 'end': '2026-11-01',
               'egeneral':stamp, 'general':stamp+'Siempre', 'efun':stamp, 'fun':stamp+'Casi siempre',
               'ealone':stamp, 'alone':stamp+'Nunca', 'ebullying':stamp, 'bullying':stamp+'Nadie',
               'emediador':stamp, 'mediador':stamp+'Nadie', 'eredes1':stamp, 'redes1':stamp+'Nadie',
               'ebeliefs1':stamp, 'beliefs1':stamp+'Nadie', 'carrera1':stamp+'2',
               'emilia1':stamp+'Emilia', 'library1':stamp+'47', 'Nombre':'Prueba', 'Apellidos':'Caso Inventado'}
        row.update(classify(i))
        row.update({key:None for key in ['eredes2','redes2','ebeliefs2','beliefs2','carrera2','emilia2','library2']})
        rows.append(row)
    target=out/(name+'.xlsx')
    writer="const X=require('./vendor/xlsx.full.min.js'),fs=require('node:fs');const input=JSON.parse(fs.readFileSync(0,'utf8'));const book=X.utils.book_new();X.utils.book_append_sheet(book,X.utils.json_to_sheet(input.rows),'Users');fs.writeFileSync(input.target,X.write(book,{type:'buffer',bookType:'xlsx'}));"
    subprocess.run(['node','-e',writer],input=json.dumps({'rows':rows,'target':str(target)}),text=True,encoding='utf-8',cwd=root,check=True)
    return target

files = {
    'missing': workbook('missing', lambda i: {}),
    'blank': workbook('blank', lambda i: {'SAL_1':'', 'SAL_2':'Sin información', 'SAL_3':''}),
    'neae': workbook('neae', lambda i: {'SAL_1':'No'}),
    'migrant': workbook('migrant', lambda i: {'SAL_2':'Sí' if i%2 else 'No', 'alone':None, 'ealone':None}),
    'all': workbook('all', lambda i: {'SAL_1':'Sí' if i%2 else 'No', 'SAL_2':'Sí' if i%2 else 'No', 'SAL_3':'2' if i%2 else '1'}),
    'mixed': workbook('mixed', lambda i: {'SAL_1':'Sí' if i<4 else '', 'SAL_2':'No' if i<4 else ''}),
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
    context = browser.new_context(viewport={'width':1360,'height':960}, accept_downloads=True)
    context.add_init_script("for(const k of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,k,{get(){throw Error('Persistent storage forbidden');}})")
    external=[]
    def route(request):
        if request.request.url.startswith(args.url+'/'): return request.continue_()
        external.append(request.request.url); return request.abort()
    context.route('**/*', route)
    page=context.new_page(); errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto(args.url+'/PBIS.html',wait_until='networkidle')
    page.locator('#username').fill('orientacion'); page.locator('#password').fill('FRJ508')
    page.locator('#login-terms').check(); page.locator('#login-form button[type=submit]').click()
    loaded=False
    def load(kind):
        global loaded
        if loaded: page.locator('#change-files').evaluate('(button)=>button.click()')
        page.locator('#file-data').set_input_files(str(files[kind]))
        page.locator('#show-reports:enabled').wait_for(); page.locator('#show-reports').click()
        assert page.locator('#import-error').inner_text()=='',page.locator('#import-error').inner_text()
        page.locator('#tab-center:enabled').wait_for(); page.locator('#tab-center').click()
        loaded=True

    def pdf(name):
        page.locator('#export-pdf').click(); page.locator('#pdf-dni').fill('11223344B'); page.locator('#pdf-terms').check()
        with page.expect_download() as event: page.locator('#pdf-confirm').click()
        target=out/(name+'.pdf'); event.value.save_as(str(target)); page.locator('#pdf-cancel').click()
        with fitz.open(target) as reader:
            assert reader.needs_pass; assert reader.authenticate('11223344B')
            return '\n'.join(p.get_text() for p in reader)

    for kind in ['missing','blank']:
        load(kind)
        assert page.locator('[data-integration]').count()==0
        assert page.locator('.school-other-charts').count()==0
    text=pdf('without-optional-data')
    assert 'Integración del alumnado' not in text and 'Integración por origen' not in text
    load('neae')
    assert page.locator('[data-integration]').count()==1
    assert page.locator('[data-integration="neae"] .integration-value strong').all_text_contents()==['Sin dato','0%']
    text=pdf('neae-only')
    assert 'Integración del alumnado NEAE' in text
    assert 'Integración del alumnado nuevo' not in text and 'Integración por origen' not in text
    load('migrant')
    assert page.locator('[data-integration]').count()==1
    panel=page.locator('[data-integration="newcomer"]')
    assert 'origen migrante' in panel.locator('h2').inner_text()
    assert panel.locator('[data-integration-group]').count()==0
    assert panel.locator('[data-integration-metric="alone"]').count()==0
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':900}); panel.scroll_into_view_if_needed()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=str(out/f'migrant-{width}.png'))
    load('all')
    assert page.locator('[data-integration]').count()==2
    select=page.locator('[data-integration-group]'); assert select.locator('option').count()==2
    select.select_option('migrant'); assert 'origen migrante' in page.locator('[data-integration="newcomer"] h2').inner_text()
    load('mixed')
    assert page.locator('[data-integration]').count()==2
    page.locator('#center').select_option('Centro 9999')
    assert page.locator('.school-other-charts').count()==0
    page.locator('#center').select_option('Centro 4826')
    assert page.locator('[data-integration]').count()==2
    load('missing'); assert page.locator('.school-other-charts').count()==0
    assert errors==[],errors
    assert external==[],external
    browser.close()

result={'ok':True,'excelVariants':list(files),'zeroPreserved':True,'perCentre':True,'replacement':True,'pdf':True,'mobile':[390,320],'externalRequests':0}
(out/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
