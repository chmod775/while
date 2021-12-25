const fs = require('fs');

const { createSVGWindow } = require('svgdom')
const window = createSVGWindow()
const document = window.document
const { SVG, registerWindow } = require('@svgdotjs/svg.js');
const { LD_Part, LD_Rung } = require('../Parsers/LD_Parser');
const { homedir } = require('os');
registerWindow(window, document)

class SVG_Generator {
  constructor() {
    this.svg = new SVG();

    this.pos = { x: 0, y: 0 };
  }

  drawPart(part, pos) {
    let svgPart = this.svg.rect(50, 50).move(pos.x, pos.y);
    svgPart.fill('none')//.stroke({ color: '#000', width: 1 });
    
    this.svg.line(0, 0, 20, 0).move(pos.x, pos.y + 25).stroke({ color: '#000', width: 1 });
    this.svg.line(0, 0, 20, 0).move(pos.x + 30, pos.y + 25).stroke({ color: '#000', width: 1 });

    this.svg.line(0, 0, 0, 20).move(pos.x + 20, pos.y + 15).stroke({ color: '#000', width: 1 });
    this.svg.line(0, 0, 0, 20).move(pos.x + 30, pos.y + 15).stroke({ color: '#000', width: 1 });

    this.svg.text(part.arguments[0] ? part.arguments[0].name : part.name).move(pos.x, pos.y);
    return svgPart;
  }

  drawRung(rung, pos) {
    pos = pos ? { x: pos.x, y: pos.y, h: 0, w: 0 } : { x: 0, y: 0, h: 0, w: 0 };

    if (rung.type == 'series') {
      for (var i of rung.items) {
        if (i instanceof LD_Part) {
          let ret = this.drawPart(i, pos);
          pos.x += ret.width();
          pos.h = Math.max(pos.h, ret.height());
        } else if (i instanceof LD_Rung) {
          console.log('a', pos);
          let ret = this.drawRung(i, pos);
          pos.x += ret.w;
          pos.h = Math.max(pos.h, ret.h);
        } else
          throw `Rung type ${i} not supported!`;


      }


    } else {
      let startPos = Object.assign({}, pos);
      let enterY = 0;
      let exitY = 0;

      let positions = [];

      for (var i of rung.items) {
        let ret = this.drawRung(i, pos);
        positions.push({ pos: Object.assign({}, pos), ret: Object.assign({}, ret) });

        pos.y += ret.h;
        pos.w = Math.max(pos.w, ret.x - pos.x);
        pos.h += ret.h;
      }
      
      for (var p of positions) {
        this.svg.line(p.ret.x, p.pos.y + 25, pos.x + pos.w, p.pos.y + 25).stroke({ color: 'black', width: 1 });
      }

      var lastPos = positions[positions.length - 1].pos;

      this.svg.line(startPos.x, startPos.y + 25, pos.x, lastPos.y + 25).stroke({ color: 'black', width: 1 });
      this.svg.line(startPos.x + pos.w, startPos.y + 25, pos.x + pos.w, lastPos.y + 25).stroke({ color: 'black', width: 1 });

    }

    return pos;
  }

  generate(ld_parser) {
    var pos = { x: 0, y: 0 };
    for (var r of ld_parser.rungs) {
      pos.x = 0;
      let ret = this.drawRung(r, pos);
      pos.y += ret.h;
    }




    fs.writeFileSync('test.svg', this.svg.svg());
  }

}
module.exports = SVG_Generator;