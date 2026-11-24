import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});await cp('src','dist',{recursive:true});
await build({entryPoints:['scripts/firebase-client.mjs'],outfile:'dist/vendor/firebase-client.mjs',bundle:true,format:'esm',minify:true});
const {exercises}=await import('../src/exercises.mjs');await writeFile('dist/exercise-guide.json',JSON.stringify(exercises));
await import('./prepare-web.mjs');
