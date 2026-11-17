"""Missing-result cards, actual Excel upload and encrypted PDFs. Synthetic data only."""
import argparse
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
import fitz

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:19032')
args=parser.parse_args()
root=Path(__file__).resolve().parents[2]
out=root/'test-results/empty-cards'
out.mkdir(parents=True,exist_ok=True)
writer="""
const fs=require('node:fs'),X=require('./vendor/xlsx.full.min.js'),fixture=require('./tests/empty-cards-fixture.cjs');
const {target,kind}=JSON.parse(fs.readFileSync(0,'utf8'));
const book=X.utils.book_new();X.utils.book_append_sheet(book,X.utils.json_to_sheet(fixture.data(kind).students),'Datos');
fs.writeFileSync(target,X.write(book,{type:'buffer',bookType:'xlsx'}));
"""
files={}
for kind in ['empty','zero','partial','mixed']:
    files[kind]=out/(kind+'.xlsx')
    subprocess.run(['node','-e',writer],input=json.dumps({'target':str(files[kind]),'kind':kind}),text=True,encoding='utf-8',cwd=root,check=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
    context=browser.new_context(viewport={'width':1360,'height':960},accept_downloads=True)
    context.add_init_script("for(const k of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,k,{get(){throw Error('Persistent storage forbidden');}})")
    external=[]
    def route(request):
        if request.request.url.startswith(args.url+'/'):return request.continue_()
        external.append(request.request.url);return request.abort()
    context.route('**/*',route)
    page=context.new_page();errors=[];pdfs=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(args.url+'/PBIS.html',wait_until='networkidle')
    assert page.locator('#login-form').is_visible()
    page.locator('#username').fill('orientacion');page.locator('#password').fill('FRJ508')
    page.locator('#login-terms').check();page.locator('#login-form button[type=submit]').click()
    loaded=False
    def load(kind):
        global loaded
        if loaded:page.locator('#change-files').evaluate('(button)=>button.click()')
        page.locator('#file-data').set_input_files(str(files[kind]))
        page.locator('#show-reports:enabled').wait_for();page.locator('#show-reports').click()
        page.locator('#tab-center:enabled').wait_for()
        loaded=True

    def export(name):
        page.locator('#export-pdf').click();page.locator('#pdf-dni').fill('11223344B');page.locator('#pdf-terms').check()
        with page.expect_download() as event:page.locator('#pdf-confirm').click()
        target=out/(name+'.pdf');event.value.save_as(str(target));page.locator('#pdf-cancel').click()
        with fitz.open(target) as reader:
            assert reader.needs_pass and reader.authenticate('11223344B')
            text='\n'.join(sheet.get_text() for sheet in reader)
            for sheet in reader:
                assert abs(sheet.rect.width-595.28)<1 and abs(sheet.rect.height-841.89)<1
            reader[0].get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(str(out/(name+'-page1.png')))
        pdfs.append(name)
        return text

    def student():
        page.locator('#tab-roster').click()
        page.locator('.roster-table .student-link').first.click()

    for kind in ['empty','zero','partial']:
        load(kind)
        for view in ['center','group','student']:
            if view=='student':student()
            else:page.locator('#tab-'+view).click()
            assert page.locator('#export-pdf-students').count()==0
            assert page.locator('#export-pdf').is_visible()
            cards=page.locator('.overview-grid>.overview-card,.student-reference-grid>.overview-card')
            titles=cards.locator('h3').all_text_contents()
            if kind=='empty':
                assert titles==[],titles
                assert page.locator('.school-comparisons,.school-other-charts').count()==0
                assert page.locator('.student-network').count()==0
            elif kind=='zero':
                assert len(titles)==6,titles
                if view=='student':
                    assert 'NO' in page.locator('.student-bullying-sources').inner_text()
                    assert '0 / 3' in page.locator('.student-reference-cognitive').inner_text()
                else:
                    assert '0' in page.locator('.overview-cognitive').inner_text()
                    assert '0' in page.locator('[data-result="bullying_self_completed"]').inner_text()
            else:
                assert sorted(titles)==sorted(['Bullying','Bienestar','Test cognitivo']),titles
                if view=='center':assert page.locator('[data-relations-comparison]').count()==0
            text=export(kind+'-'+view)
            if kind=='empty':
                for heading in ['Bullying','Relaciones de amistad','Bienestar por clases','Test cognitivo','Top 3']:
                    assert heading not in text,(heading,text)
                assert 'Sin datos disponibles para esta ficha.' in text
            elif kind=='zero':
                assert 'Bullying' in text and '0 / 3' in text
                if view=='student':assert 'No' in text
            else:
                assert 'Relaciones de amistad' not in text and 'Top 3' not in text
                assert 'Bullying' in text
                assert 'Test cognitivo' in text and 'Carrera' in text
            for width in [1360,390,320]:
                page.set_viewport_size({'width':width,'height':960})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(kind,view,width)
                if kind=='partial' and width in [1360,390]:
                    page.locator('.report').scroll_into_view_if_needed()
                    page.screenshot(path=str(out/f'{kind}-{view}-{width}.png'))
            page.set_viewport_size({'width':1360,'height':960})

    # A different class/student cannot inherit the populated class's cards or means.
    load('mixed');page.locator('#tab-group').click()
    assert page.locator('.overview-grid>.overview-card').count()==6
    page.locator('#group').select_option('B')
    assert page.locator('.overview-grid>.overview-card').count()==0
    student()
    assert page.locator('.student-reference-grid>.overview-card').count()==0
    page.locator('#group').select_option('A')
    assert page.locator('.student-reference-grid>.overview-card').count()==6
    # Replacement must clear old cards and PDFs too.
    load('empty');assert page.locator('.overview-card').count()==0
    assert errors==[],errors
    assert external==[],external
    browser.close()

result={'ok':True,'pdfs':pdfs,'emptyZeroNoPartial':True,'perClassAndStudent':True,'replacement':True,'mobile':[390,320],'externalRequests':0}
(out/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
