const fs = require('fs');
const path = require('path');
const vsctm = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');

/**
 * Utility to read a file as a promise
 */
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, data) => error ? reject(error) : resolve(data));
    })
}

const wasmBin = fs.readFileSync(path.join(__dirname, './node_modules/vscode-oniguruma/release/onig.wasm')).buffer;
const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
    return {
        createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
        createOnigString(s) { return new oniguruma.OnigString(s); }
    };
});

// Create a registry that can create a grammar from a scope name.
// https://github.com/textmate/javascript.tmbundle/blob/master/Syntaxes/JavaScript.plist
const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: (scopeName) => {
        if (scopeName === 'source.c')
            return readFile('./syntaxes/C.plist').then(data => vsctm.parseRawGrammar(data.toString()))
        if (scopeName === 'source.cpp')
            return readFile('./syntaxes/C++.plist').then(data => vsctm.parseRawGrammar(data.toString()))
        console.log(`Unknown scope name: ${scopeName}`);
        return null;
    }
});

function getTokenContent(source, token) {
  return source.substring(token.startIndex, token.endIndex);
}



function parseTokens(source, tokens) {
  let tokenIdx = 0;
  let tok = null;

  function is(scope) {
    return tok.scopes.includes(scope);
  }

  function last(scope) {
    return tok.scopes[tok.scopes.length - 1] == scope;
  }

  function match(scope) {
    tok = tokens[tokenIdx++];
    if (scope)
      if (!is(scope))
        throw `Scope ${scope} not found in token ${tok}`;
    return tok;
  }

  function content() {
    return source.substring(tok.startIndex, tok.endIndex);
  }

  do {
    match();

    if (is('entity.name.function.c')) {
      const f_name = content();
      const f_args = [];
      
      match('punctuation.section.parens.begin.c');

      while (!is('punctuation.section.parens.end.c')) {
        match();

        if (last('meta.parens.c')) {
          console.log(tok);
          f_args.push(content());
        }
      }

      console.log(`${f_name}(${f_args.join(',')}) : `);

    }

  } while (tokenIdx < (tokens.length - 1));

}


// Load the JavaScript grammar and any other grammars included by it async.
registry.loadGrammar('source.cpp').then(grammar => {
    const source = fs.readFileSync("test.c", "UTF8");

    let ruleStack = vsctm.INITIAL;
    const lineTokens = grammar.tokenizeLine(source, ruleStack);

    parseTokens(source, lineTokens.tokens);
    /*
    for (var tIdx in lineTokens.tokens) {
      const t = lineTokens.tokens[tIdx];

      console.log(t.scopes);

      if (t.scopes.includes('entity.name.function.c')) {
        const f_name = getTokenContent(source, t);
        const f_ret_type = getTokenContent(source, lineTokens.tokens[tIdx - 2]);
      


        console.log(`${f_name}() : ${f_ret_type}`);
      }

    }
*/
});