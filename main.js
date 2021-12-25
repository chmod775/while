let fs = require('fs');
var path = require('path');

let C_Parser = require('./src/Parsers/C_Parser');
let { LD_Parser, LD_Part, LD_Rung } = require('./src/Parsers/LD_Parser');

let c_code = fs.readFileSync('examples/ex1/file1.c', 'utf8');
var c_parser = new C_Parser(c_code);
c_parser.parse();

var c_functions = c_parser.findFunctions();

let ld_codePath = 'examples/ex1/file5.w';
let ld_code = fs.readFileSync(ld_codePath, 'utf8');
var ld_parser = new LD_Parser(ld_code);
ld_parser.parse();

//console.log(JSON.stringify(ld_parser.rungs, null, 2));

// Generate C Code
var functionName = path.basename(ld_codePath, path.extname(ld_codePath));

// Interface
var arguments = [];
if (ld_parser.interface.statics.length > 0) {
  arguments.push(`s_${functionName} *inst`);
}
for (var i of ld_parser.interface.inputs)
  arguments.push(`${i.dataType} ${i.name}`);
for (var i of ld_parser.interface.outputs)
  arguments.push(`${i.dataType} *${i.name}`);



var instanceLines = [];
for (var is of ld_parser.interface.statics) {
  foundFunction = c_functions.filter(t => t.name == is.dataType)[0];
  if (foundFunction) {
    var foundArgument = foundFunction.arguments.filter(t => t.name == "inst")[0];
    if (!foundArgument) throw `Argument "inst" not found for function ${foundFunction.name}`;
    instanceLines.push(`${foundArgument.dataType} ${is.name};`);
  } else
    instanceLines.push(`${is.dataType.toLowerCase()} ${is.name};`);
}


var functionTempLines = [];
for (var is of ld_parser.interface.temps) {
  foundFunction = c_functions.filter(t => t.name == is.dataType)[0];
  if (foundFunction) {
    var foundArgument = foundFunction.arguments.filter(t => t.name == "inst")[0];
    if (!foundArgument) throw `Argument "inst" not found for function ${foundFunction.name}`;
    functionTempLines.push(`${foundArgument.dataType} ${is.name};`);
  } else
    functionTempLines.push(`${is.dataType.toLowerCase()} ${is.name};`);
}

var functionBodyLines = [];
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
  functionBodyLines.push(accLine);

  return accName;
}

function generateRungSeries(rung, acc) {
  for (var i of rung.items) {
    if (i instanceof LD_Part) {
      let foundFunction = c_functions.filter(t => t.name == i.name)[0];
      let foundInstance = null;
      if (!foundFunction) { // Search in instances
        foundInstance = ld_parser.findInterfaceSymbol(i.name);
        if (!foundInstance) throw `Instance ${i.name} not defined!`;

        foundFunction = c_functions.filter(t => t.name == foundInstance.item.dataType)[0];
        if (!foundFunction) throw `Function ${foundInstance.item.dataType} not defined!`;
      }

      var accName = `t${accIndexCounter++}`;

      let functionArguments = [];

      if (foundFunction.hasOptionalEnable()) functionArguments.push(acc);
      if (foundFunction.hasOptionalStatic()) {
        var isStatic = (foundInstance.section == 'statics');
        functionArguments.push(isStatic ? `&inst->${foundInstance.item.name}` : `&${foundInstance.item.name}`)
      }

      let functionUserArguments = foundFunction.getUserArguments();
      for (var argIdx in functionUserArguments) {
        var cArg = functionUserArguments[argIdx];
        var ldArg = i.arguments[argIdx];

        var isStatic = (ldArg.type == 'statics');

        var argName = isStatic ? `inst->${ldArg.name}` : `${ldArg.name}`;

        if (cArg.modifiers[0] == 'POINTER')
          functionArguments.push(`&${argName}`);
        else
          functionArguments.push(argName);
      }

      let codeLine = 'ERROR!';
      if (foundFunction.hasOptionalEnable()) {
        codeLine = `bool ${accName} = ${foundFunction.name}(${functionArguments.join(', ')});`;
      } else {
        codeLine = `bool ${accName} = ${acc} ? ${foundFunction.name}(${functionArguments.join(', ')}) : false;`;
      }

      acc = accName;
      functionBodyLines.push(codeLine);
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
  functionBodyLines.push('');
}


var codeLines = [];

codeLines.push(`typedef struct {`);
for (var l of instanceLines)
  codeLines.push(`\t${l}`);
codeLines.push(`} s_${functionName};`);

codeLines.push('');

codeLines.push(`void ${functionName}(${arguments.join(', ')}) {`);
for (var l of functionTempLines)
  codeLines.push(`\t${l}`);
codeLines.push('');
for (var l of functionBodyLines)
  codeLines.push(`\t${l}`);
codeLines.push('}');

var code = codeLines.join('\n');

console.log(code);