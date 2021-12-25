let fs = require('fs');
var path = require('path');

let C_Parser = require('./src/Parsers/C_Parser');
let { LD_Parser, LD_Part, LD_Rung } = require('./src/Parsers/LD_Parser');

let c_code = fs.readFileSync('examples/ex1/file1.c', 'utf8');
var c_parser = new C_Parser(c_code);
c_parser.parse();

var c_functions = c_parser.findFunctions();

let ld_codePath = 'examples/ex1/file4.w';
let ld_code = fs.readFileSync(ld_codePath, 'utf8');
var ld_parser = new LD_Parser(ld_code);
ld_parser.parse();

//console.log(JSON.stringify(ld_parser.rungs, null, 2));

// Generate C Code
// Interface
var arguments = [];

var interfaceLines = [];
for (var is of ld_parser.interface.statics) {
  foundFunction = c_functions.filter(t => t.name == is.dataType)[0];
  if (foundFunction) {
    var foundArgument = foundFunction.arguments.filter(t => t.name == "inst")[0];
    if (!foundArgument) throw `Argument "inst" not found for function ${foundFunction.name}`;
    interfaceLines.push(`${foundArgument.dataType} ${is.name};`);
  } else
    interfaceLines.push(`${is.dataType.toLowerCase()} ${is.name};`);
}

var bodyLines = [];
var accIndexCounter = 0;

function generateRungParallel(rung, acc) {
  let lastAccs = [];

  for (var i of rung.items) {
    if (i instanceof LD_Part)
      throw `Unexpected Part inside parallel rung items`;

    if (i instanceof LD_Rung) {
      if (i.type == 'parallel')
        lastAccs.push(generateRungParallel(i, acc));
      else if (i.type == 'series')
        lastAccs.push(generateRungSeries(i, acc));
      else
        throw `Rung type not recognized ${i.type}!`;
    }
  }

  var accName = `t${accIndexCounter++}`;
  var accLine = `bool ${accName} = ${lastAccs.join(' || ')};`;
  bodyLines.push(accLine);

  return accName;
}

function generateRungSeries(rung, acc) {
  for (var i of rung.items) {
    if (i instanceof LD_Part) {
      let foundFunction = c_functions.filter(t => t.name == i.name)[0];
      let foundInstance = null;
      if (!foundFunction) { // Search in instances
        foundInstance = ld_parser.interface.statics.filter(t => t.name == i.name)[0];
        if (!foundInstance) throw `Instance ${i.name} not defined!`;

        foundFunction = c_functions.filter(t => t.name == foundInstance.dataType)[0];
        if (!foundFunction) throw `Function ${foundInstance.dataType} not defined!`;
      }

      var accName = `t${accIndexCounter++}`;

      let functionArguments = [];

      if (foundFunction.hasOptionalEnable()) functionArguments.push(acc);
      if (foundFunction.hasOptionalStatic()) functionArguments.push(`&${foundInstance.name}`);

      let functionUserArguments = foundFunction.getUserArguments();
      for (var argIdx in functionUserArguments) {
        var cArg = functionUserArguments[argIdx];
        var ldArg = i.arguments[argIdx];

        if (cArg.modifiers[0] == 'POINTER')
          functionArguments.push(`&${ldArg.content}`);
        else
          functionArguments.push(ldArg.content);
      }

      let codeLine = 'ERROR!';
      if (foundFunction.hasOptionalEnable()) {
        codeLine = `bool ${accName} = ${foundFunction.name}(${functionArguments.join(', ')});`;
      } else {
        codeLine = `bool ${accName} = ${acc} ? ${foundFunction.name}(${functionArguments.join(', ')}) : false;`;
      }

      acc = accName;
      bodyLines.push(codeLine);
    }

    if (i instanceof LD_Rung) {
      if (i.type == 'parallel')
        acc = generateRungParallel(i, acc);
      else if (i.type == 'series')
        throw `Unexpected series rung under series rung.`;
      else
        throw `Rung type not recognized ${i.type}!`;
    }
  }

  return acc;
}

for (var r of ld_parser.rungs) {
  generateRungSeries(r, 'true');
  bodyLines.push('');
}

var code = `void ${path.basename(ld_codePath, path.extname(ld_codePath))}(${arguments.join(',')}) {\n${interfaceLines.join('\n')}\n${bodyLines.join('\n')}}`;
console.log(code);