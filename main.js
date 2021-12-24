let fs = require('fs');

let C_Parser = require('./src/Parsers/C_Parser');
let LD_Parser = require('./src/Parsers/LD_Parser');

let c_code = fs.readFileSync('examples/ex1/file1.c', 'utf8');
var c_parser = new C_Parser(c_code);
c_parser.parse();
console.log(c_parser.findFunction());

let ld_code = fs.readFileSync('examples/ex1/file2.w', 'utf8');
var ld_parser = new LD_Parser(ld_code);

var rung = { type: 'series', items: [] };
ld_parser.parseRung(rung);
console.log(JSON.stringify(rung, null, 2));

var rung = { type: 'series', items: [] };
ld_parser.parseRung(rung);
console.log(JSON.stringify(rung, null, 2));

var rung = { type: 'series', items: [] };
ld_parser.parseRung(rung);
console.log(JSON.stringify(rung, null, 2));