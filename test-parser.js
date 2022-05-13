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

// Load the JavaScript grammar and any other grammars included by it async.
registry.loadGrammar('source.cpp').then(grammar => {
    const text = fs.readFileSync("Adafruit_SSD1306.cpp", "UTF8").split("\n");


    let ruleStack = vsctm.INITIAL;
    for (let i = 0; i < text.length; i++) {
        const line = text[i];
        const lineTokens = grammar.tokenizeLine(line, ruleStack);
        //console.log(`\nTokenizing line: ${line}`);
        for (let j = 0; j < lineTokens.tokens.length; j++) {
            const token = lineTokens.tokens[j];
            if (token.scopes.length > 1)
              if (token.scopes.includes('entity.name.function.c'))
                console.log(` - token from ${token.startIndex} to ${token.endIndex} ` +
                  `(${line.substring(token.startIndex, token.endIndex)}) ` +
                  `with scopes ${token.scopes.join(', ')}`
                );
        }
        ruleStack = lineTokens.ruleStack;
    }
});