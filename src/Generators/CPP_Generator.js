const { CompilerObject } = require("../Compiler");

class CPP_File {
  constructor(filename, content) {
    this.filename = filename;
    this.content = content;
  }
}

class CPP_Generator {
  constructor(compiler) {
    this.compiler = compiler;



  }

  static generateClass(o) {
    let lines = [];

    lines.push(`class ${o.name} {`);

    // Interface
    lines.push(`\tpublic:`);
    for (let i of o.interface) {
      if (i.isInstance) {
        lines.push(`\t\t${i.type} *${i.name} = new ${i.type}(${i.args.join(',')});`);
      } else if (i.isConst) {

      } else {
        lines.push(`\t\t${i.type} ${i.name};`);
      }
    }

    // END
    lines.push(`}`);

    return new CPP_File(`${o.name}.cpp`, lines.join('\n'));
  }

  generate() {
    let files = [];

    let compiled = this.compiler.compile();

    for (let o of compiled) {
      if (o instanceof CompilerObject) {
        files.push(CPP_Generator.generateClass(o));
      }
    }

    return files;
  }
}
module.exports = CPP_Generator;