const Parser = require('tree-sitter');
const {Query, QueryCursor} = Parser

const JavaScript = require('tree-sitter-javascript');
const Grammar = require('tree-sitter-cpp');
const fs = require('fs');

const parser = new Parser();
parser.setLanguage(Grammar);

const sourceCode = fs.readFileSync('./examples/ex1/Adafruit_SSD1306.cpp', 'utf8');
const tree = parser.parse(sourceCode);

const query = new Query(Grammar, `
(function_declarator
  declarator: (qualified_identifier
    name: (identifier) @function)
  parameters: (parameter_list) @params)
`);

const matches = query.matches(tree.rootNode);

console.log(matches);

const arg_node = matches[0].captures[1].node;

const arg_query = new Query(Grammar,`
(parameter_declaration) @arg
(parameter_declaration type: (_) @t)
`);
const arg_matches = arg_query.matches(arg_node);
console.log('args', arg_matches);

console.log(arg_matches.map(n => getNodeContent(n.captures[0].node)));

console.log(matches.map(n => getNodeContent(n.captures[1].node)));

return;

fs.writeFileSync('test_tree.json', JSON.stringify(tree.rootNode.child(1), null, 2));

function findFirstNode(parentNode, nodeType) {
  for (var c of parentNode.children) {
    if (c.type == nodeType) return c;
    var ret = findFirstNode(c, nodeType);
    if (ret) return ret;
  }

  return null;
}

function findNodes(parentNode, nodeType, ret) {
  ret = ret ?? [];

  for (var c of parentNode.children) {
    if (c.type == nodeType) {
      ret.push(c);
    }
    findNodes(c, nodeType, ret);
  }

  return ret;
}

function getNodeContent(node) {
  if (!node) return '';
  if (!node.tree) return '';
  return node.tree.input.substr(node.startIndex, node.endIndex - node.startIndex);
}

function mapNodes(parentNode, ret) {
  ret = ret ?? { type: null, content: '', childrens: [] };

  ret.type = parentNode.type;
  ret.content = getNodeContent(parentNode);

  for (var c of parentNode.children) {
    ret.childrens.push(mapNodes(c));
  }

  return ret;
}

class CPP_Declaration {
  constructor(node) {
    this.name = getNodeContent(findFirstNode(node, 'field_identifier'));

    this.parameters = getNodeContent(findNodes(node, 'parameter_declaration').map(t => findFirstNode(t, 'identifier')));
  }
}

class CPP_Class {
  constructor(match) {
    this.name = match.captures.filter(t => t.name == 'name')[0].node.text;

    let fieldsQuery = new Query(Grammar, '(field_declaration) @test');

    let fieldsMatches = fieldsQuery.matches(match.captures.filter(t => t.name == 'body')[0].node);


  }
}

function formatMatches(matches) {
  return matches.map(({ pattern, captures }) => ({
    pattern,
    captures: formatCaptures(captures),
  }));
}

function formatCaptures(captures) {
  return captures.map((c) => {
    return c.text;
  });
}

fs.writeFileSync('test_tree.json', JSON.stringify(mapNodes(tree.rootNode), null, 2));


var fn = findNodes(tree.rootNode, 'class_specifier');

//console.log(JSON.stringify(fn.map(t => new CPP_Class(t)), null, 2));



/*
const query = new Query(Grammar, `
  (class_specifier
    name: (type_identifier) @name
    body: (field_declaration_list) @body
  )
`);

const matches = query.matches(tree.rootNode);

let classes = [];
for (var m of matches)
    classes.push(new CPP_Class(m));


console.log(classes)

const query2 = new Query(Grammar, `
  (field_declaration) @test
`);

const matches2 = query2.matches(matches[0].captures[1].node);


console.log(matches2[0].captures[0].node.text);
*/

async function renderTree() {
  isRendering++;
  const cursor = tree.walk();

  let currentRenderCount = parseCount;
  let row = '';
  let rows = [];
  let finishedRow = false;
  let visitedChildren = false;
  let indentLevel = 0;

  for (let i = 0;; i++) {
    if (i > 0 && i % 10000 === 0) {
      await new Promise(r => setTimeout(r, 0));
      if (parseCount !== currentRenderCount) {
        cursor.delete();
        isRendering--;
        return;
      }
    }

    let displayName;
    if (cursor.nodeIsMissing) {
      displayName = `MISSING ${cursor.nodeType}`
    } else if (cursor.nodeIsNamed) {
      displayName = cursor.nodeType;
    }

    if (visitedChildren) {
      if (displayName) {
        finishedRow = true;
      }

      if (cursor.gotoNextSibling()) {
        visitedChildren = false;
      } else if (cursor.gotoParent()) {
        visitedChildren = true;
        indentLevel--;
      } else {
        break;
      }
    } else {
      if (displayName) {
        if (finishedRow) {
          row += '</div>';
          rows.push(row);
          finishedRow = false;
        }
        const start = cursor.startPosition;
        const end = cursor.endPosition;
        const id = cursor.nodeId;
        let fieldName = cursor.currentFieldName();
        if (fieldName) {
          fieldName += ': ';
        } else {
          fieldName = '';
        }
        row = `<div>${'  '.repeat(indentLevel)}${fieldName}<a class='plain' href="#" data-id=${id} data-range="${start.row},${start.column},${end.row},${end.column}">${displayName}</a> [${start.row}, ${start.column}] - [${end.row}, ${end.column}]`;
        finishedRow = true;
      }

      if (cursor.gotoFirstChild()) {
        visitedChildren = false;
        indentLevel++;
      } else {
        visitedChildren = true;
      }
    }
  }
  if (finishedRow) {
    row += '</div>';
    rows.push(row);
  }

  cursor.delete();
  cluster.update(rows);
  treeRows = rows;
  isRendering--;
  handleCursorMovement();
}

function cursorWalk(cursor) {
  let ret = { type: cursor.nodeType, field: cursor.currentFieldName, nodeId: cursor.nodeId, children: {} };
  
  var goDeep = cursor.gotoFirstChild();
  if (!goDeep) return ret;

  while (goDeep) {
    let walkRet = cursorWalk(cursor);
    ret.children[walkRet.field ?? Object.keys(ret.children).length] = walkRet;
    goDeep = cursor.gotoNextSibling();
  };

  cursor.gotoParent();
  return ret;
}

var w = tree.walk();
let ret = cursorWalk(w, 0);



/*
var classes = findNodes(ret, 'class_specifier');

console.log(classes[1].children.filter(t => t.field == 'name')[0].node.text);
*/
console.log(ret);
//fs.writeFileSync('test_tree_pretty.json', JSON.stringify(ret, null, 2));
//fs.writeFileSync('test_tree.json', JSON.stringify(mapNodes(tree.rootNode), null, 2));
