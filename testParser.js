let fs = require('fs');
var path = require('path');

let CXX_Parser = require('./src/Parsers/CXX_Parser');

let c_code = fs.readFileSync('examples/ex1/Adafruit_SSD1306.h', 'utf8');
var c_parser = new CXX_Parser(c_code);
c_parser.parse();

fs.writeFileSync('test.json', JSON.stringify(c_parser.tokens, null, 2));

//var c_functions = c_parser.findFunctions();