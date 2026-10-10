// Freeze the site-owned runtime/config with the installed shared component.
import {freezeBundle,syncBundle,verifyBundle} from '@wbniv/browser-game-player/bundle';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const options=JSON.parse(readFileSync(process.argv[2] || 'browser-player.json','utf8'));
const temporary=mkdtempSync(join(tmpdir(),'browser-player-'));
try {
 const source=freezeBundle({...options,output:temporary});
 const receipt=verifyBundle(source);
 const target=options.siteDestination;
 syncBundle(source,join(target,'bundles'));
 mkdirSync(target,{recursive:true});
 const manifest=join(target,'manifest.json');
 writeFileSync(manifest+'.next',JSON.stringify({bundleId:receipt.bundleId},null,2)+'\n');
 renameSync(manifest+'.next',manifest);
 console.log('Selected verified bundle',receipt.bundleId);
} finally {rmSync(temporary,{recursive:true,force:true});}
