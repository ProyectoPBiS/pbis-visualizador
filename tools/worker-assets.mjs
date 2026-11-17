import {createHash} from 'node:crypto';

export function workerAsset(kind, source){
  if(!['parser','pdf'].includes(kind))throw Error('Recurso no admitido.');
  const bytes=Buffer.from(source);
  const digest=createHash('sha256').update(bytes);
  const hex=digest.copy().digest('hex');
  return {url:`assets/workers/${kind}.${hex.slice(0,12)}.js`,integrity:'sha256-'+digest.digest('base64'),size:bytes.length};
}

export function verifyWorkerAsset(kind, entry, bytes){
  const expected=workerAsset(kind,bytes);
  if(!entry||entry.url!==expected.url||entry.integrity!==expected.integrity||entry.size!==expected.size)throw Error('Recurso de aplicación alterado: '+kind);
}
