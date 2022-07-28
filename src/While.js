let fs = require('fs');
var path = require('path');
const { Compiler } = require('./Compiler');
const CPP_Generator = require('./Generators/CPP_Generator');
let { LD_Parser } = require('./Parsers/LD_Parser');

let ld_codePath = 'examples/ex2/file1.w';
let ld_code = fs.readFileSync(ld_codePath, 'utf8');
let ld_parser = new LD_Parser('file1', ld_code);

let compiler = new Compiler([ ld_parser ]);
let compiled = compiler.compile();

let cpp_generator = new CPP_Generator(compiler);
let cpp_generated = cpp_generator.generate();

console.log(cpp_generated);