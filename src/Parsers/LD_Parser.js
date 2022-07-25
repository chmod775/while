class LD_Rung {
  constructor(type, items) {
    this.type = type ?? 'series';
    this.items = items ?? [];
  }
}

class LD_Part {
  constructor() {
    this.name = null;
    this.arguments = [];
  }
}

class LD_PartArgument {
  constructor(type, name) {
    this.type = type ?? '';
    this.name = name ?? null;
  }
}

const TOKEN_TYPE = {
	SYMBOL: "SYMBOL",
	SECTION: "SECTION",
	LITERAL: "LITERAL",
	NEWLINE: "NEWLINE"
};

class LD_Parser {
  constructor(code) {
    this.code = code;
    this.codePtr = 0;
    this.token = null;

    this.interface = {
      inputs: [],
      outputs: [],
      inouts: [],
      statics: [],
      temps: [],
      constants: []
    };

    this.rungs = [];
  }

  getCh() {
    return this.code[this.codePtr];
  }
  
  getNextCh() {
    return this.code[this.codePtr++];
  }

  retToken(type, content) {
    this.token = { type: type, content: content, startPtr: this.codePtr - (content ? content.length : type.length) };
    return this.token;
  }

  getToken() {
    let ch = '';
  
    while (ch = this.getNextCh()) {
      let nch = this.getCh();

      if (ch == '#') {
        let section = '';

        do {
          section += ch;
          ch = this.getNextCh();
        } while ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch == '_'));
  
        this.codePtr--;

        return this.retToken(TOKEN_TYPE.SECTION, section);
      } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch == '_')) {
        let symbol = '';
  
        do {
          symbol += ch;
          ch = this.getNextCh();
        } while ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || (ch == '_'));
  
        this.codePtr--;
  
        return this.retToken(TOKEN_TYPE.SYMBOL, symbol);
      } else if (ch >= '0' && ch <= '9') {
        let number = '';
  
        do {
          number += ch;
          ch = this.getNextCh();
        } while ((ch >= '0' && ch <= '9') || (ch == '.'));
  
        this.codePtr--;
  
        return this.retToken(TOKEN_TYPE.LITERAL, number);

      } else if (ch == '\/') { // Comment
        if (nch == '\/') {
          do {
            ch = this.getNextCh();
          } while (ch != '\n');
        } else if (nch == '*') {
          do {
            ch = this.getNextCh();
            nch = this.getCh();
          } while ((ch != '*') || (nch != '\/')); 
        }
      } else if (ch == '\n') {
        return this.retToken(TOKEN_TYPE.NEWLINE);
      } else if ((ch == '-') || (ch == ',') || (ch == '(') || (ch == ')') || (ch == '[') || (ch == ']') || (ch == ':')) {
        return this.retToken(ch);
      }
    }

		this.token = null;
  }

  expectToken(type) {
    let tok = this.getToken();
    if (tok.type != type) throw `Token ${tok.type} not expected, expected ${type}!`;
    return tok;
  }

	match(type) {
		if (Array.isArray(type)) {
			let invalid = true;
			for (let t of type)
				if (this.token.type == t) invalid = false;
    	if (invalid) throw `Token ${this.token.type} not expected, expected any of [${type.join(', ')}]!`;
		} else
    	if (this.token.type != type) throw `Token ${this.token.type} not expected, expected ${type}!`;
    return this.token;
	}

	next(type) {
		this.getToken();
		if (type) this.match(type);
		return this.token;
	}

  findInterfaceSymbol(name, suppressError) {
    let ret = {
      section: null,
      item: null
    };

    for (var ik in this.interface) {
      for (var ii of this.interface[ik]) {
        if (ii.name == name) {
          ret.section = ik;
          ret.item = ii;
          
          return ret;
        }
      }
    }

    if (suppressError) return null;
    throw `Symbol ${name} not defined!`;
  }

  parsePart() {
    let part = new LD_Part();
    part.name = this.token.content;

    let tok = this.expectToken('[');

    while (tok = this.getToken()) {
      if (tok.type == ']') break;
      if ((tok.type != TOKEN_TYPE.SYMBOL) && (tok.type != TOKEN_TYPE.LITERAL)) throw `Expected SYMBOL or LITERAL as argument, found ${tok.type}`;

      if (tok.type == TOKEN_TYPE.LITERAL) {
        part.arguments.push(new LD_PartArgument(TOKEN_TYPE.LITERAL, tok.content));
      } else if (tok.type == TOKEN_TYPE.SYMBOL) {
        let foundSymbol = this.findInterfaceSymbol(tok.content);
        part.arguments.push(new LD_PartArgument(foundSymbol.section, foundSymbol.item.name));
      }

      tok = this.getToken();
      if (tok.type == ']') {
        break;
      } else if (tok.type == ',') {
        
      } else
        throw `Token ${tok.type} not expected!`;
    }

    return part;
  }

  parseInterface() {
		this.match(TOKEN_TYPE.SYMBOL);

    let item = {
      name: this.token.content,
      dataType: null,
			args: []
    };

		this.next(':');
    item.dataType = this.next(TOKEN_TYPE.SYMBOL).content;

		this.next();
		if (this.token.type == '(') {
			this.next();
			while (this.token.type != ')') {
				this.match([ TOKEN_TYPE.SYMBOL, TOKEN_TYPE.LITERAL ]);
				item.args.push(this.token.content);

				this.next();
				if (this.token.type == ',')
					this.next();
			}

			this.next();
		}

    return item;
  }

  parseRung(rung) {
    var tok = this.token;
    do {
      if (tok.type == TOKEN_TYPE.SYMBOL) {
        let symbol = this.parsePart(tok);
        rung.items.push(symbol);
      } else if (tok.type == '(') {
        var lastTok = null;
        let newRung = new LD_Rung('parallel');
        do {
          let newRungSub = new LD_Rung('series');
          tok = this.getToken();
          lastTok = this.parseRung(newRungSub);
          newRung.items.push(newRungSub);
        } while (lastTok.type != ')');
        rung.items.push(newRung);

      } else if (tok.type == ')') {
        return tok;
      } else if (tok.type == ',') {
        return tok;
      } else if (tok.type == '-') {

      } else if (tok.type == TOKEN_TYPE.NEWLINE) {
        return;
      } else
        throw `Token ${tok.type} not expected!`;
    } while (tok = this.getToken());
  }

  parse() {
    var activeSection = null;

		this.next(TOKEN_TYPE.SECTION);

    do {
      var tok = this.token;
      if (!tok) break;

      if (tok.type == TOKEN_TYPE.SECTION) {
        activeSection = tok.content.toUpperCase();
				this.next();
      } else if (tok.type == TOKEN_TYPE.NEWLINE) {
				this.next();
      } else {
				console.log(activeSection);

				switch (activeSection) {
          case '#INPUTS':
            this.interface.inputs.push(this.parseInterface());
            break;
          case '#OUTPUTS':
            this.interface.outputs.push(this.parseInterface());
            break;
          case '#INOUTS':
            this.interface.inouts.push(this.parseInterface());
            break;
          case '#STATIC':
            this.interface.statics.push(this.parseInterface());
            break;
          case '#TEMP':
            this.interface.temps.push(this.parseInterface());
            break;
          case '#CONST':
            this.interface.constants.push(this.parseInterface());
            break;
					
          case '#RUNGS':
						/*
            let newRung = new LD_Rung('series');
            this.parseRung(newRung);
            this.rungs.push(newRung);
						*/
            break;
					default:
						throw `Section ${activeSection} not implemented!`
        }
      }
    } while (tok);
  }

}
module.exports = { LD_Part, LD_Rung, LD_Parser };