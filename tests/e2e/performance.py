"""Local performance comparison; synthetic demo only, all external requests blocked."""
import argparse
import json
import statistics
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:19032')
parser.add_argument('--label',required=True)
parser.add_argument('--runs',type=int,default=3)
args=parser.parse_args()
root=Path(__file__).resolve().parents[2]
out=root/'test-results'/'performance'/args.label
out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
    for run in range(args.runs):
        context=browser.new_context(viewport={'width':1360,'height':960},reduced_motion='reduce')
        context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(args.url+'/') else route.abort())
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        session=context.new_cdp_session(page)
        session.send('Emulation.setCPUThrottlingRate',{'rate':4})
        page.goto(args.url+'/PBIS.html',wait_until='networkidle')
        page.locator('#username').wait_for()
        login=page.evaluate('''()=>({dcl:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,bytes:performance.getEntriesByType('navigation')[0].decodedBodySize,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime})''')
        page.goto(args.url+'/DEMO.html#demo',wait_until='networkidle')
        page.locator('#tab-group:enabled').wait_for()
        page.locator('#report-content .report').wait_for()
        demo=page.evaluate('''()=>({ready:performance.now(),resources:performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,bytes:r.decodedBodySize}))})''')
        views={}
        for name,selector in [('center','#tab-center'),('group','#tab-group'),('roster','#tab-roster'),('student','.roster-table .student-link'),('network','#tab-network')]:
            ms=page.evaluate('''selector=>{const start=performance.now();document.querySelector(selector).click();return performance.now()-start;}''',selector)
            page.locator('#report-content').wait_for()
            views[name]=round(ms,2)
            if run==0:
                (out/(name+'.txt')).write_text(page.locator('#report-content').inner_text(),encoding='utf-8')
                page.screenshot(path=str(out/(name+'.png')),full_page=True)
                page.set_viewport_size({'width':390,'height':844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),name
                page.screenshot(path=str(out/(name+'-mobile.png')))
                page.set_viewport_size({'width':1360,'height':960})
        assert not errors,errors
        results.append({'login':login,'demo':demo,'views':views})
        context.close()
    # Canvas work must stop when the hero is not on screen, without changing its picture.
    context=browser.new_context(viewport={'width':1360,'height':900})
    context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(args.url+'/') else route.abort())
    page=context.new_page()
    page.add_init_script('''window.__canvasFrames=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.id==='hero-canvas')window.__canvasFrames++;return clear.apply(this,args);};''')
    page.goto(args.url+'/',wait_until='networkidle')
    page.locator('#contacto').scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    start=page.evaluate('window.__canvasFrames')
    page.wait_for_timeout(1000)
    offscreen_frames=page.evaluate('window.__canvasFrames')-start
    page.locator('.hero').scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    start=page.evaluate('window.__canvasFrames')
    page.wait_for_timeout(1000)
    onscreen_frames=page.evaluate('window.__canvasFrames')-start
    context.close()
    browser.close()
summary={'label':args.label,'cpuThrottle':4,'runs':results,'medianDclMs':statistics.median(r['login']['dcl'] for r in results),'initialBytes':results[0]['login']['bytes'],'medianViewMs':{v:statistics.median(r['views'][v] for r in results) for v in results[0]['views']},'heroFramesOffscreenPerSecond':offscreen_frames,'heroFramesOnscreenPerSecond':onscreen_frames}
(out/'metrics.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='runs'}))
