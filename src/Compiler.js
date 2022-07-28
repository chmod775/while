const CXX_Parser = require("./Parsers/CXX_Parser");
const { LD_Parser } = require("./Parsers/LD_Parser");
const Utils = require("./Utils");

class CompilerCall {

}

class CompilerInterfaceItem {
	constructor(type, name, initArgs) {
		this.type = type;
		this.name = name;
		this.args = initArgs;

		this.isConst = Utils.IsFullCase(name);
		this.isInstance = name.startsWith('_');
	}
}

class CompilerSource {
	constructor(code) {
		this.code = code;
	}
}

class CompilerObject {
	constructor(name) {
		this.name = name;
		this.interface = [];
		this.code = {
			setup: [],
			loop: []
		};
	}
}

class Compiler {

	constructor(parsedFiles) {
		this.files = {
			source: [],
			ladder: []
		};

		for (let p of parsedFiles) {
			if (p instanceof LD_Parser) {
				this.files.ladder.push(p);
			} else if (p instanceof CXX_Parser) {
				this.files.source.push(p);
			} else {
				throw `Parser ${p.constructor.name} not supported!`;
			}
		}
	}

	static compilerLadder(l) {
		let ret = new CompilerObject(l.filename);

		// Interface
		for (let i of l.interface.statics) {
			let isPrimitive = Utils.IsFullCase(i.type);

			let name = i.name;
			if (!isPrimitive) name = '_' + name;

			let type = i.type;
			if (isPrimitive) type = type.toLowerCase();

			let cInterface = new CompilerInterfaceItem(type, name, i.args);
			ret.interface.push(cInterface);
		}

		for (let i of l.interface.constants) {
			let cInterface = new CompilerInterfaceItem(i.type, i.name.toUpperCase(), i.args);
			ret.interface.push(cInterface);
		}

		return ret;
	}

	compile() {
		let ret = [];
		for (let l of this.files.ladder) {
			ret.push(Compiler.compilerLadder(l));
		}
		return ret;
	}


}

module.exports.Compiler = Compiler;
module.exports.CompilerObject = CompilerObject;
module.exports.CompilerSource = CompilerSource;