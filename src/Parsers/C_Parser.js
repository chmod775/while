class C_Parser {
  constructor(code) {
    this.code = code;
    this.codePtr = 0;

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
        if (this.keywords.includes(cleanSymbol)) return { type: 'KEYWORD', content: cleanSymbol };
  
        return { type: "SYMBOL", content: symbol };
      } else if (ch == '{') {
        let group = '';
        let level = 0;
  
        do {
          group += ch;
          if (ch == '{') level++;
          if (ch == '}') level--;
          ch = this.getNextCh();
        } while (level > 0);
        return { type: "GROUP", content: group };
  
      } else if (ch == '(') {
        let arg = '';
        let args = [];
        let level = 0;
  
        do {
          if (ch == '(')
            level++;
          else if (ch == ')')
            level--;
          else if (ch == ',') {
            args.push(arg.trim());
            arg = '';
          } else {
            arg += ch;
          }
  
          ch = this.getNextCh();
        } while (level > 0);
  
        args.push(arg.trim());
  
        return { type: "ARGUMENTS", content: args };
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
  
  parseArgument(argument) {
    
  }
  
  findFunction() {
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
          foundFunctions.push({
            name: functionName_token,
            retType: functionRetType_token,
            arguments: functionArguments_token,
            block: functionBlock_token
          })
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