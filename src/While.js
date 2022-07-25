let fs = require('fs');
var path = require('path');
let { LD_Parser, LD_Part, LD_Rung } = require('./Parsers/LD_Parser');

let ld_codePath = 'examples/ex2/file1.w';
let ld_code = fs.readFileSync(ld_codePath, 'utf8');
var ld_parser = new LD_Parser(ld_code);
ld_parser.parse();

console.log(ld_parser.interface.statics);