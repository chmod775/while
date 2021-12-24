class LD_Parser {
  constructor(code) {
    this.code = code;
    this.codePtr = 0;

    this.rungs = [];
  }

  getCh() {
    return this.code[this.codePtr];
  }
  
  getNextCh() {
    return this.code[this.codePtr++];
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

        return { type: "SECTION", content: section };
      } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch == '_')) {
        let symbol = '';
  
        do {
          symbol += ch;
          ch = this.getNextCh();
        } while ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || (ch == '_'));
  
        this.codePtr--;
  
        return { type: "SYMBOL", content: symbol };
      } else if (ch >= '0' && ch <= '9') {
        let number = '';
  
        do {
          number += ch;
          ch = this.getNextCh();
        } while ((ch >= '0' && ch <= '9') || (ch == '.'));
  
        this.codePtr--;
  
        return { type: "LITERAL", content: number };

      } else if (ch == '\/') { // Comments
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
        return { type: 'NEWLINE' };
      } else if ((ch == '-') || (ch == ',') || (ch == '(') || (ch == ')') || (ch == '[') || (ch == ']') || (ch == ':')) {
        return { type: ch };
      }
    }
  }

  expectToken(type) {
    let tok = this.getToken();
    if (tok.type != type) throw `Token ${tok.type} not expected, expected ${type}!`;
    return tok;
  }

  parseSymbol(olTok) {
    let symbol = {
      name: olTok.content,
      arguments: []
    };

    let tok = this.getToken();
    if (tok.type == '[') {
      while (tok = this.getToken()) {
        if ((tok.type != 'SYMBOL') && (tok.type != 'LITERAL')) throw `Expected SYMBOL or LITERAL as argument, found ${tok.type}`;

        symbol.arguments.push(tok);

        tok = this.getToken();
        if (tok.type == ']') {
          break;
        } else if (tok.type == ',') {
          
        } else
          throw `Token ${tok.type} not expected!`;
      }
    } else
      throw `Token ${tok.type} not expected!`;

    return symbol;
  }

  parseRung(rung) {
    let tok = null;
    while (tok = this.getToken()) {
      if (tok.type == 'SYMBOL') {
        let symbol = this.parseSymbol(tok);
        rung.items.push(symbol);
      } else if (tok.type == '(') {
        var lastTok = null;
        let newRung = { type: 'parallel', items: [] };
        do {
          let newRungSub = { type: 'series', items: [] };
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
    }
  }

  parse() {
    var tokens = [];
    do {
      var tok = this.getToken();
      if (tok)
        tokens.push(tok);
    } while (tok);

    this.tokens = tokens;
    return tokens;
  }


}
module.exports = LD_Parser;