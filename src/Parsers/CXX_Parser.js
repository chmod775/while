class CXX_Function {
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


class CXX_Parser {
  constructor(code) {
    this.code = code;
    this.codePtr = 0;

    this.lineCounter = 0;
    this.token = null;

    this.tokens = [];

    this.functions = [];

    this.keywords = [
      'alignas',
      'alignof',
      'and',
      'and_eq',
      'asm',
      'atomic_cancel',
      'atomic_commit',
      'atomic_noexcept',
      'auto',
      'bitand',
      'bitor',
      'bool',
      'break',
      'case',
      'catch',
      'char',
      'char8_t',
      'char16_t',
      'char32_t',
      'class',
      'compl',
      'concept',
      'const',
      'consteval',
      'constexpr',
      'constinit',
      'const_cast',
      'continue',
      'co_await',
      'co_return',
      'co_yield',
      'decltype',
      'default',
      'delete',
      'do',
      'double',
      'dynamic_cast',
      'else',
      'enum',
      'explicit',
      'export',
      'extern',
      'false',
      'float',
      'for',
      'friend',
      'goto',
      'if',
      'inline',
      'int',
      'long',
      'mutable',
      'namespace',
      'new',
      'noexcept',
      'not',
      'not_eq',
      'nullptr',
      'operator',
      'or',
      'or_eq',
      'private',
      'protected',
      'public',
      'reflexpr',
      'register',
      'reinterpret_cast',
      'requires',
      'return',
      'short',
      'signed',
      'sizeof',
      'static',
      'static_assert',
      'static_cast',
      'struct',
      'switch',
      'synchronized',
      'template',
      'this',
      'thread_local',
      'throw',
      'true',
      'try',
      'typedef',
      'typeid',
      'typename',
      'union',
      'unsigned',
      'using',
      'virtual',
      'void',
      'volatile',
      'wchar_t',
      'while',
      'xor',
      'xor_eq'
    ];
  }
  
  getCh() {
    return this.code[this.codePtr];
  }
  
  getNextCh() {
    let ch = this.code[this.codePtr++];
    if (ch == '\n') this.lineCounter++;
    return ch;
  }
  
  retToken(type, content) {
    this.token = { type: type, content: content };
    console.log(this.lineCounter, this.token);
    return this.token;
  }

  expectToken(type) {
    let tok = this.getToken();
    if (tok.type != type) throw `LINE ${this.lineCounter}: Token ${tok.type} not expected, expected ${type}!`;
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
        let group = [];
        let level = 0;
  
        let t = null;
        do {
          t = this.getToken();
          if (!t) break;
          group.push(t);
        } while (t.type != '}');

        return this.retToken("GROUP", group);
  
      } else if (ch == '(') {
        let args = [];
  
        while (1) {
          let t = this.getToken();

          
          args.push(this.parseArgument());

          while (1) {
            t = this.getToken();
            if (t.type == ',') break;
            if (t.type == ')') break;
          }
          if (t.type == ')') break;
        }

        return this.retToken("ARGUMENTS", args);
      } else if ((ch == '*') || (ch == ')') || (ch == ',')) {
        return this.retToken(ch);
      } else if (ch == '#') {
        let t = this.getToken();
        let content = '';

        var ignoreNewLine = false;
        do {
          ch = this.getNextCh();
          if (ignoreNewLine && (ch == '\n')) { ch = ''; ignoreNewLine = false; }
          if (ch == '\\') ignoreNewLine = true;
          if (ch != '\n') content += ch;
        } while (ch != '\n');

        return this.retToken("PRECOMPILER", { type: t.content, content: content });
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

    if (tok.type != "SYMBOL") throw `LINE ${this.lineCounter}: Token ${tok.type} not expected, expected SYMBOL!`;
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
          let newFunction = new CXX_Function();

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
module.exports = CXX_Parser;