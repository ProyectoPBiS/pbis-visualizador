import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {generateSurvey} from './synthetic-survey.mjs';
const require=createRequire(import.meta.url),W=require('../src/raw-wave1.js');
export function completeDemo(root){
 const model=JSON.parse(fs.readFileSync(path.join(root,'data/demo-model.json'),'utf8'));
 const raw=generateSurvey(model),converted=W.convert(raw);
 // Use the exact importer and calculations applied to uploaded surveys.
 return {students:converted.students.map(s=>({...s,Campus:s.Centro})),keys:[],groups:converted.groups.map(g=>({...g,Campus:g.Centro,Periodo:'Noviembre 2026'}))};
}
