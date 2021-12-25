class C_Function {
  constructor() {
    this.name = null;
    this.retType = null;
    this.arguments = null;
    this.block = null;
  }

  hasOptionalEnable() {
    let firstArgument = this.arguments[0];
    if (!firstArgument) return false;

    return (firstArgument.name == 'en') && (firstArgument.dataType == 'bool');
  }

  hasOptionalStatic() {
    let firstArgument = this.hasOptionalEnable() ? this.arguments[1] : this.arguments[0];
    if (!firstArgument) return false;

    return (firstArgument.name == 'inst') && (firstArgument.modifiers = ['POINTER']);
  }

  hasOptionaENO() {

  }

  getUserArguments() {
    let startIdx = 0;
    if (this.hasOptionalEnable()) startIdx = 1;
    if (this.hasOptionalStatic()) startIdx++;

    return this.arguments.slice(startIdx);
  }
}


class C_Parser {
  constructor(code) {
    this.code = code;
    this.codePtr = 0;

    this.token = null;

    this.tokens = [];

    this.functions = [];

    this.keywords = [
      'typedef',
      'struct'
    ];
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

  expectToken(type) {
    let tok = this.getToken();
    if (tok.type != type) throw `Token ${tok.type} not expected, expected ${type}!`;
    return tok;
  }

  getToken() {
    let ch = '';
  
    while (ch = this.getNextCh()) {
      let nch = this.getCh();
  
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch == '_')) {
        let symbol = '';
  
        do {
          symbol += ch;
          ch = this.getNextCh();
        } while ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || (ch == '_'));
  
        this.codePtr--;
  
        var cleanSymbol = symbol.trim().toLowerCase();
        if (this.keywords.includes(cleanSymbol)) return this.retToken('KEYWORD', cleanSymbol);
  
        return this.retToken("SYMBOL", symbol);
      } else if (ch == '{') {
        let group = '';
        let level = 0;
  
        do {
          group += ch;
          if (ch == '{') level++;
          if (ch == '}') level--;
          ch = this.getNextCh();
        } while (level > 0);
        return this.retToken("GROUP", group);
  
      } else if (ch == '(') {
        let args = [];
  
        while (1) {
          let t = this.getToken();
          if (t.type == ',') continue;
          if (t.type == ')') break;
          
          args.push(this.parseArgument());
        }

        return this.retToken("ARGUMENTS", args);
      } else if ((ch == '*') || (ch == ')') || (ch == ',')) {
        return this.retToken(ch);
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
      }
    }
  }
  
  parseArgument() {
    let arg = {
      name: null,
      dataType: this.token.content,
      modifiers: []
    };

    let tok = this.getToken();

    while (tok.type == '*') {
      arg.modifiers.push('POINTER');
      tok = this.getToken();
    }

    if (tok.type != "SYMBOL") throw `Token ${tok.type} not expected, expected SYMBOL!`;
    arg.name = tok.content;

    return arg;
  }
  
  findFunctions() {
    var foundFunctions = [];
  
    for (var idx in this.tokens) {
      if ((idx >= 2) && (idx <= this.tokens.length - 2)) {
        var functionName_token = this.tokens[+idx - 1];
        var functionRetType_token = this.tokens[+idx - 2];
        var functionArguments_token = this.tokens[+idx];
        var functionBlock_token = this.tokens[+idx + 1];
  
        if (
          (functionName_token.type == 'SYMBOL') &&
          (functionRetType_token.type == 'SYMBOL') &&
          (functionArguments_token.type == 'ARGUMENTS') &&
          (functionBlock_token.type == 'GROUP')
        ) {
          let newFunction = new C_Function();

          newFunction.name = functionName_token.content;
          newFunction.retType = functionRetType_token.content;
          newFunction.arguments = functionArguments_token.content;
          newFunction.block = functionBlock_token.content;

          foundFunctions.push(newFunction);
        }
      }
    }
  
    this.functions = foundFunctions;
    return foundFunctions;
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
module.exports = C_Parser;