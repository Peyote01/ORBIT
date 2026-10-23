// ORBIT RESTORE: all project files embedded directly in this single JS file.
// Source commit: be42a86ace69ac296f9b1a79d0b46c1a860f6cd0
// Usage: node ORBIT_RESTORE_SOURCE.cjs ./ORBIT-restored
// The original folder structure is recreated; existing files are never overwritten.
const fs=require('node:fs');
const path=require('node:path');
const files={};
// BEGIN EMBEDDED FILES
// END EMBEDDED FILES
const target=path.resolve(process.argv[2]||'.');
for(const rel of Object.keys(files)){if(fs.existsSync(path.join(target,rel))){console.error('Would overwrite '+rel);process.exit(1);}}
fs.mkdirSync(target,{recursive:true});
for(const [rel,body] of Object.entries(files)){const full=path.join(target,rel);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,body,'utf8');}
console.log('Restored '+Object.keys(files).length+' ORBIT files to '+target);
console.log('Next: cd '+target+' && npm install && npm start');
