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
    this.token = { type: type, content: content };
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

        return this.retToken("SECTION", section);
      } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch == '_')) {
        let symbol = '';
  
        do {
          symbol += ch;
          ch = this.getNextCh();
        } while ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || (ch == '_'));
  
        this.codePtr--;
  
        return this.retToken("SYMBOL", symbol);
      } else if (ch >= '0' && ch <= '9') {
        let number = '';
  
        do {
          number += ch;
          ch = this.getNextCh();
        } while ((ch >= '0' && ch <= '9') || (ch == '.'));
  
        this.codePtr--;
  
        return this.retToken("LITERAL", number);

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
        return this.retToken('NEWLINE');
      } else if ((ch == '-') || (ch == ',') || (ch == '(') || (ch == ')') || (ch == '[') || (ch == ']') || (ch == ':')) {
        return this.retToken(ch);
      }
    }
  }

  expectToken(type) {
    let tok = this.getToken();
    if (tok.type != type) throw `Token ${tok.type} not expected, expected ${type}!`;
    return tok;
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
      if ((tok.type != 'SYMBOL') && (tok.type != 'LITERAL')) throw `Expected SYMBOL or LITERAL as argument, found ${tok.type}`;

      if (tok.type == 'LITERAL') {
        part.arguments.push(new LD_PartArgument('LITERAL', tok.content));
      } else if (tok.type == 'SYMBOL') {
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
    let item = {
      name: this.token.content,
      dataType: null
    };

    let tok = this.expectToken(':');
    item.dataType = this.expectToken('SYMBOL').content;

    return item;
  }

  parseRung(rung) {
    var tok = this.token;
    do {
      if (tok.type == 'SYMBOL') {
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

      } else if (tok.type == 'NEWLINE') {
        return;
      } else
        throw `Token ${tok.type} not expected!`;
    } while (tok = this.getToken());
  }

  parse() {
    var activeSection = null;
    do {
      var tok = this.getToken();
      if (!tok) break;

      if (tok.type == "SECTION") {
        activeSection = tok.content.toUpperCase();
      } else if (tok.type == "NEWLINE") {
      } else {
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
            let newRung = new LD_Rung('series');
            this.parseRung(newRung);
            this.rungs.push(newRung);
            break;
        }
      }
    } while (tok);
  }

}
module.exports = { LD_Part, LD_Rung, LD_Parser };