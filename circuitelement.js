const _SVG_NS_ = 'http://www.w3.org/2000/svg';

/* All of the supported netlist types */
const _RESISTOR_TYPE_ = 'R';
const _INDEP_VOLTAGE_TYPE_ = 'V';
const _INDEP_CURRENT_TYPE_ = 'I';
const _CAPACITOR_TYPE_ = 'C';
const _DEP_VCVS_TYPE_ = 'E';
const _DEP_VCCS_TYPE_ = 'G';
const _DEP_CCVS_TYPE_ = 'H';
const _WIRE_TYPE_ = 'W';
const _GROUND_TYPE_ = 'GND';

/* Fixed length of each symbol */
const _GENERIC_L_ = 70;
const _RESISTOR_L_ = 50;
const _INDEP_L_ = 50;
const _CAP_L_ = 25;
const _DEP_L_ = 50;

/* General constants applied to each element*/
const _NODE_RADIUS_ = 2;
const _LINE_WIDTH_ = 1.5;


/* Element specific constants */
const _RESISTOR_HEIGHT_ = 20;
const _GROUND_LENGTH_ = 30;
/*
 * Generic SVG element create functions
 */
const createSVGGroup = () => document.createElementNS(_SVG_NS_, 'g');
const createSVGElem = (elem) => document.createElementNS(_SVG_NS_, elem);

/* Toggleable colours */
let _DEFAULT_COLOR_ = '#bababa';
let _DEFAULT_FONT_COLOR_ = '#8f8f8f';
let _DEFAULT_NODE_COLOR_ = '#8f8f8f';

/**
 * Creates element specified by 'type'
 * Returns sg_svg <sg_g> element
 *
 * @param type - type of element to create (R | V | I | C ...)
 * @param id   - id of element - will be used as the label
 * @param pos_node - coordinate of positive node {x: _x, y: _y}
 * @param neg_node - coordinate of negative node {x: _x, y: _y}
 */
const create = (type, id, center, R, coord1, coord2, toggle) => {
  const { pos_node, neg_node} = center !== undefined ? computeStartEndPosition(center, R) : -1;
  // console.log(`Creating element: {type: ${type}, id: ${id},
  //   coord1: (${pos_node.x}, ${pos_node.y}), coord2: (${neg_node.x}, ${neg_node.y})`);
  if (toggle) {
    _DEFAULT_COLOR_ = 'black';
    _DEFAULT_FONT_COLOR_ = 'black';
    _DEFAULT_NODE_COLOR_ = 'black';
  } else {
    _DEFAULT_COLOR_ = 'black';
    _DEFAULT_FONT_COLOR_ = 'black';
    _DEFAULT_NODE_COLOR_ = 'black';
  }

  let element = createSVGGroup();
  switch(type) {
    case _RESISTOR_TYPE_:
      element = Resistor(id, pos_node, neg_node);
      break;
    case _INDEP_VOLTAGE_TYPE_:
      element = IndependentVoltage(id, pos_node, neg_node);
      break;
    case _INDEP_CURRENT_TYPE_:
      element = IndependentCurrent(id, pos_node, neg_node);
      break;
    case _CAPACITOR_TYPE_:
      element = Capacitor(id, pos_node, neg_node);
      break;
    case _DEP_VCVS_TYPE_:
      element = DependentVoltage(id, pos_node, neg_node);
      break;
    case _DEP_VCCS_TYPE_:
      element = DependentVoltage(id, pos_node, neg_node);
      break;
    case _DEP_CCVS_TYPE_:
      element = DependentCurrent(id, pos_node, neg_node);
      break;
    case _WIRE_TYPE_:
      element = Wire(coord1, coord2);
      break;
    case _GROUND_TYPE_:
      element = Ground(center);
      break;
    default:
      break;
  }
  return element;
};

const computeStartEndPosition = (centre, R) => {
  let pos_node = {x: 0, y: 0};
  let neg_node = {x: 0, y: 0};
  const h = _GENERIC_L_/2;
  // console.log( `centre: ${JSON.stringify(centre)}, R: ${R}`);
  switch (R) {
    case 0:
      pos_node = {x: centre.x, y: centre.y - h};
      neg_node = {x: centre.x, y: centre.y + h};
      break;
    case 90:
      pos_node = {x: centre.x + h, y: centre.y};
      neg_node = {x: centre.x - h, y: centre.y};
      break;
    case 180:
      pos_node = {x: centre.x, y: centre.y + h};
      neg_node = {x: centre.x, y: centre.y - h};
      break;
    case 270:
      pos_node = {x: centre.x - h, y: centre.y};
      neg_node = {x: centre.x + h, y: centre.y};
      break;
    default:
      break;
  }
  return { pos_node, neg_node};
};

const createNodes = (coord1, coord2) => {
  let nodes = [];
  nodes.push(Node(coord1));
  nodes.push(Node(coord2));
  return nodes;
};


const isHorizontal = (coord1, coord2) => coord1.y === coord2.y;

const createLines = (coord1, coord2, length) => {
  let lines = [];
  let x1 = parseFloat(coord1.x), y1 = parseFloat(coord1.y);
  let x2 = parseFloat(coord2.x), y2 = parseFloat(coord2.y);
  let line_pos1 = {};
  let line_pos2 = {};

  /* Case 1: horizontal line */
  if (y1 === y2) {
    const width = x2 - x1;
    const l = width < 0 ? length : -length;

    /* line 1 */
    line_pos1 = {x: x1, y: y1};
    line_pos2 = {x: x1 + (width + l)/2, y: y1};
    lines.push(Line(line_pos1, line_pos2));

    /* line 2 */
    line_pos1 = {x: x2, y: y2};
    line_pos2 = {x: x2 - (width+l)/2, y: y2};
    lines.push(Line(line_pos1, line_pos2));

  }
  /* Case 2: vertical line */
  else {
    const height = y2 - y1;
    const l = height < 0 ? length : -length;

    /* line 1 */
    line_pos1 = {x: x1, y: y1};
    line_pos2 = {x: x1, y: y1 + (height+l)/2};
    lines.push(Line(line_pos1, line_pos2));

    line_pos1 = {x: x2, y: y2};
    line_pos2 = {x: x2, y: y2 - (height+l)/2};
    lines.push(Line(line_pos1, line_pos2));
  }
  return lines;
};

/**
 * Functions to create each circuit element type
 * @returns {SVGElement}
 */

const Node = (coord) => {
  // console.log('CREATING NODE...');
  let node = createSVGElem('circle');
  node.setAttribute('cx', coord.x);
  node.setAttribute('cy', coord.y);
  node.setAttribute('r', _NODE_RADIUS_);
  node.setAttribute('fill', _DEFAULT_NODE_COLOR_);
  return node;
};

const Line = (coord1, coord2, width=_LINE_WIDTH_) => {
  let line = createSVGElem('line');
  line.setAttribute('x1', coord1.x);
  line.setAttribute('x2', coord2.x);
  line.setAttribute('y1', coord1.y);
  line.setAttribute('y2', coord2.y);
  line.setAttribute('stroke-width', width);
  line.setAttribute('stroke', _DEFAULT_COLOR_);
  return line;
};

const Circle = (centre, radius) => {
  let circle = createSVGElem('circle');
  circle.setAttribute('r', radius);
  circle.setAttribute('cx', centre.x);
  circle.setAttribute('cy', centre.y);
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke-width', _LINE_WIDTH_);
  circle.setAttribute('stroke', _DEFAULT_COLOR_);
  return circle;
};

const Path = (d) => {
  let path = createSVGElem('path');
  path.setAttribute('d', d);
  path.setAttribute('stroke-width', _LINE_WIDTH_);
  path.setAttribute('stroke', _DEFAULT_COLOR_);
  path.setAttribute('fill', 'none');
  path.setAttribute('fill-opacity', null);
  return path;
};

const Text = (msg, coord, size='1em', weight='normal') => {
  let text = createSVGElem('text');
  text.setAttribute('x', coord.x);
  text.setAttribute('y', coord.y);
  text.setAttribute('font-size', size);
  text.setAttribute('font-family', 'Calibri');
  text.setAttribute('font-weight', weight);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', _DEFAULT_FONT_COLOR_);
  text.appendChild(
    document.createTextNode(msg)
  );
  return text;
};

/**
 * FUNCTIONS TO GENERATE CIRCUIT ELEMENT SYMBOLS
 * ONE FOR EACH TYPE OF ELEMENT
 */

/**
 * Get the boundaries of the element symbols
 * Required when creating the actual symbols
 *
 * o------ <   > -------o
 * Returns start (left arrow) and end (right arrow)
 * SVG coordinates
 *
 * @param coord1
 * @param coord2
 * @param l - predefined length of the element
 * @returns {{start: {x: null, y: null}, end: {x: null, y: null}}}
 */
const getSymbolBounds = (coord1, coord2, l) => {
  /* Get fraction of line that the symbol has to fit in */
  let x1 = parseFloat(coord1.x), y1 = parseFloat(coord1.y);
  let x2 = parseFloat(coord2.x), y2 = parseFloat(coord2.y);

  let start = {x: null, y: null};
  let end = {x: null, y: null};
  if (isHorizontal(coord1, coord2)) {
    const width = x2- x1;
    l = width < 0 ? l : -l;
    start.x = x1 + (width+l)/2;
    end.x = x2 - (width+l)/2;

    start.y = y1;
    end.y = y2;

  } else {
    const height = y2 - y1;
    l = height < 0 ? l : -l;
    start.x = x1;
    start.y = y1 + (height+l)/2;
    end.x = x2;
    end.y = y2 - (height+l)/2;
  }
  return {start, end};
};

const resistorSymbol = (start, end) => {

  /*
   * interval is the num pixels between points on the
   * path
   * _____/\/\/\_____
   *
   * startx is the start coordinate of the symbol on the
   * axis that the resistor is lying on
   * -  Not necessarily equivalent to start.x
   * -  For vertically oriented resistors startx = start.y
   *    because the resistor is oriented on the y axis
   * -  Note to patricai: pls find a better variable name
   *
   * starty is the start coordinate of the symbol on the axis
   * that the spikes will be growing towards
   * -  Same note as startx: not necessarily the same as start.y
   */
  let interval, startx, starty;
  let horiz = false;
  if (isHorizontal(start, end)) {
    interval = (end.x - start.x)/6;
    startx = start.x;
    starty = start.y;
    horiz = true;
  } else {
    interval = (end.y - start.y)/6;
    startx = start.y;
    starty = start.x;
  }

  /*
   * For each interval, compute the coordinate on the path
   * (7 total points)
   * horizontal and vertically aligned resistors use the
   * same equations except x and y equations are flipped,
   * therefore have to check for this condition
   */
  let i=0, x, y;
  let d = 'M';
  for (; i<7; i++) {
    x = startx + i * interval;
    y = i%2 === 0 ? starty : starty - _RESISTOR_HEIGHT_;
    d += horiz ? `${x},${y} ` : `${y},${x} `;
  }

  return Path(d);
};

const capacitorSymbol = (start, end) => {
  let cap = createSVGGroup();
  let horiz = isHorizontal(start, end);
  const OFFSET = 20;
  let x1, x2, y1, y2;
  if (horiz) {
    x1 = start.x;
    x2 = end.x;
    y1 = start.y + OFFSET;
    y2 = end.y - OFFSET;
    // console.log(`${x1}, ${x2}, ${y1}, ${y2}`);
    cap.appendChild(Line({x: x1, y: y1}, {x: x1, y: y2}));
    cap.appendChild(Line({x: x2, y: y1}, {x: x2, y: y2}));
  } else {
    x1 = start.x + OFFSET;
    x2 = end.x - OFFSET;
    y1 = start.y;
    y2 = end.y;
    cap.appendChild(Line({x: x1, y: y1}, {x: x2, y: y1}));
    cap.appendChild(Line({x: x1, y: y2}, {x: x2, y: y2}));
  }

  return cap;
};

/**
 * Circle symbol for independent sources
 * NOTE: there will be separate functions to create
 * the symbols inside the circle
 * (+/-) -> voltage source
 * -> -> current source
 */
const independentSymbol = (start, end) => {
  let centre;
  if (isHorizontal(start, end)) {
    length = end.x - start.x;
    centre = { x: start.x + length/2, y: start.y };
  } else {
    length = end.y - start.y;
    centre = { x: start.x, y: start.y + length/2}
  }

  return Circle(centre, Math.abs(length/2));
};

/*
 * Diamond symbol for dependent sources
 * Uses a <path> element instead of 4 separate lines
 */
const dependentSymbol = (start, end) => {
  let d;
  let A, B, C, D;
  const h = isHorizontal(start, end) ?( end.x - start.x)/2 : (end.y - start.y)/2;
  A = start;
  B = { x: start.x + h, y: start.y + h };
  C = end;
  D = { x: end.x - h, y: end.y - h };

  d = `M${A.x},${A.y} 
      ${B.x},${B.y} 
      ${C.x},${C.y} 
      ${D.x},${D.y} Z`;

  return Path(d);
};

const voltageSymbol = (pos, neg) => {
  const L='l', R='r', U='u', D='d';
  const OFFSET = 5;
  const font_size = '1.5em';
  const horiz = isHorizontal(pos, neg);

  let orientation, center, msg, rotate=false;
  if (horiz) {
    center = {x: pos.x + (neg.x - pos.x)/2, y: pos.y + OFFSET };
    orientation = pos.x > neg.x ? R : L;
  } else {
    center = {x: pos.x, y: pos.y + OFFSET +(neg.y - pos.y)/2 };
    orientation = pos.y > neg.y ? D : U;
    rotate = true;
  }
  // console.log(`pos: ${JSON.stringify(pos)}, neg: ${JSON.stringify(neg)}`);
  // console.log(`orientation: ${orientation}`);
  msg = orientation === D || orientation === R ? 'I +' : '+ I';
  let symbol = Text(msg, center, font_size, 0.5);
  if (rotate)
    symbol.setAttribute('transform', `rotate(90, ${center.x}, ${center.y - OFFSET}) translate(0 2)`);
  else
    symbol.setAttribute('transform', 'translate(0 2)');
  return symbol;
};

const currentSymbol = (pos, neg) => {
  const L='l', R='r', U='u', D='d';
  const OFFSET = 10;
  let negx=neg.x, negy=neg.y, posx=pos.x, posy=pos.y, orientation;
  const horiz = isHorizontal(pos, neg);
  if (horiz) {
    orientation = pos.x > neg.x ? R : L;
    negx = orientation === R ? neg.x + OFFSET : neg.x - OFFSET;
    posx = orientation === R ? pos.x - OFFSET : pos.x + OFFSET;
  } else {
    orientation = pos.y > neg.y ? D : U;
    negy = orientation === D ? neg.y + OFFSET : neg.y - OFFSET;
    posy = orientation === D ? pos.y - OFFSET : pos.y + OFFSET;
  }


  let symbol = Line({x: negx, y: negy}, {x: posx, y: posy }, 5);
  symbol.setAttribute('marker-end', 'url(#arrow)');
  return symbol;
};

const groundSymbol = (center) => {
  let symbol = createSVGGroup();
  let coord1, coord2;
  let h;

  // longest line
  {
    h = _GROUND_LENGTH_ / 2;
    coord1 = {x: center.x + h, y: center.y};
    coord2 = {x: center.x - h, y: center.y};
    symbol.appendChild(Line(coord1, coord2));
  }

  {
    h = (_GROUND_LENGTH_ - 10) / 2;
    coord1 = {x: center.x + h, y: center.y + 5};
    coord2 = {x: center.x - h, y: center.y + 5};
    symbol.appendChild(Line(coord1, coord2));
  }

  {
    h = (_GROUND_LENGTH_ - 20) / 2;
    coord1 = {x: center.x + h, y: center.y + 10};
    coord2 = {x: center.x - h, y: center.y + 10};
    symbol.appendChild(Line(coord1, coord2));
  }

  return symbol;
};

/**
 * Generate template for a generic circuit element
 * - 2 lines + 2 nodes
 * o-----     -----o
 *
 * @param id
 * @param coord1
 * @param coord2
 * @param fract - % of line from coord1 -> coord2 that is used up by the 2 lines
 * @constructor
 */
const getCenter = (c1, c2) => {return {x: (parseFloat(c1.x) + parseFloat(c2.x))/2,
  y: (parseFloat(c1.y) + parseFloat(c2.y))/2}};

const GenericElement = (id, coord1, coord2, length) => {
  let element = createSVGGroup();
  createNodes(coord1, coord2).forEach(
    n => element.appendChild(n)
  );
  createLines(coord1, coord2, length).forEach(
    l => element.appendChild(l)
  );

  // label the element
  const center = getCenter(coord1, coord2);
  if (isHorizontal(coord1, coord2)) {
    element.appendChild(Text(id, {x: center.x, y: center.y - 30}));
  } else {
    element.append(Text(id, {x: center.x - 35, y: center.y}));
  }
  return element;
};

/**
 * START: Functions to generate specific elements
 * @param id
 * @param coord1
 * @param coord2
 * @returns {SVGGElement}
 * @constructor
 */
const Resistor = (id, coord1, coord2) => {
  // console.log('CREATING RESISTOR...');
  let resistor = GenericElement(id, coord1, coord2, _RESISTOR_L_);

  const {start, end} = getSymbolBounds(coord1, coord2, _RESISTOR_L_);
  resistor.appendChild(
    resistorSymbol(start, end));
  return resistor;
};

const Capacitor = (id, coord1, coord2) => {
  // console.log('CREATING CAPACITOR...');
  let capacitor = GenericElement(id, coord1, coord2, _CAP_L_);

  const {start, end} = getSymbolBounds(coord1, coord2, _CAP_L_);
  capacitor.appendChild(
    capacitorSymbol(start, end));
  return capacitor;
};

const IndependentVoltage = (id, coord1, coord2) => {
  // console.log('CREATING INDEPENDENT VOLTAGE SOURCE...');
  let voltage_src = GenericElement(id, coord1, coord2, _INDEP_L_);

  const {start, end} = getSymbolBounds(coord1, coord2, _INDEP_L_);
  voltage_src.appendChild(independentSymbol(start, end));
  voltage_src.appendChild(voltageSymbol(start, end));
  return voltage_src;
};

const IndependentCurrent = (id, coord1, coord2) => {
  // console.log('CREATING INDEPENDENT CURRENT...');
  let current_src = GenericElement(id, coord1, coord2, _INDEP_L_);

  const {start, end} = getSymbolBounds(coord1, coord2, _INDEP_L_);
  current_src.appendChild(independentSymbol(start, end));
  current_src.appendChild(currentSymbol(start, end));
  return current_src;
};

const DependentVoltage = (id, coord1, coord2) => {
  // console.log('CREATING DEPENDENT VOLTAGE SOURCE...');
  let voltage_src = GenericElement(id, coord1, coord2, _DEP_L_);

  const {start, end} = getSymbolBounds(coord1, coord2, _DEP_L_);
  voltage_src.appendChild(dependentSymbol(start, end));
  voltage_src.appendChild(voltageSymbol(start, end));
  return voltage_src;
};

const DependentCurrent = (id, coord1, coord2) => {
  // console.log('CREATING DEPENDENT CURRENT SOURCE...');
  let current_src = GenericElement(id, coord1, coord2, _DEP_L_);

  const {start, end} = getSymbolBounds(coord1, coord2, _DEP_L_);
  current_src.appendChild(dependentSymbol(start, end));
  current_src.appendChild(currentSymbol(start, end));
  return current_src;
};

const Wire = (coord1, coord2) => {
  return Line(coord1, coord2);
};

const Ground = (center) => {
  // console.log('CREATING GROUND SYMBOL...');
  return groundSymbol(center);
};

const Element = { create };
