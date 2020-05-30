const sfg_SVG_NS = 'http://www.w3.org/2000/svg';
const ID_SFG = 'circuit-canvas';
const SZ_CIRCLE_RADIUS = 5;
const BEZIER_SAMPLE_RATE = 200;
const PI_2 = 1.57079632679;
const PI = Math.PI;
const two_PI = 6.28318530718;
const ID_SFG_WRAPPER_G = 'sfg-wrapper-g';
const WIDTH_EDGE_STROKE = 1.5;
const CLR_NODES = 'red';
const CLR_ARROWS = 'red';
const CLR_EDGES = 'red';
const CLR_TEXT = 'red';

/* Fake macros */
const sfg_ELEM = (id) => document.getElementById(id);
const sfg_AVG = arr => arr.reduce((total, e) => total+e)/arr.length;
const sfg_CENTER = vecs => sfg___vec(sfg_AVG(vecs.map(v => v.x)), sfg_AVG(vecs.map(v => v.y)));
const sfg_SHIFT = (v, s) => sfg___vec(v.x+s.x, v.y+s.y);
const sfg_MAG = v => Math.sqrt(Math.pow(v.x,2)+Math.pow(v.y,2));
const sfg_NORM = v => sfg___vec(v.x/sfg_MAG(v), v.y/sfg_MAG(v));
const sfg_MULT = (v, scalar) => sfg___vec(v.x*scalar, v.y*scalar);
const sfg_MULT_X = (v, scalar) => sfg___vec(v.x*scalar, v.y);
const sfg_MULT_Y = (v, scalar) => sfg___vec(v.x, v.y*scalar);
const sfg_DOT = (v1, v2) => v1.x*v2.x + v1.y*v2.y;
const sfg_DET = (v1, v2) => v1.x*v2.y - v1.y*v2.x;
const sfg_SUB = (v1, v2) => sfg___vec(v1.x-v2.x, v1.y-v2.y);
const sfg_ADD = (v1, v2) => sfg___vec(v1.x+v2.x, v1.y+v2.y);
const sfg_EQUALS = (v1, v2) => v1.x === v2.x && v1.y === v2.y;
const sfg_DEFINED = (v) => (typeof v !== 'undefined') && (v !== null);
const sfg_DEG_TO_RAD = deg => deg*0.0174533; /* Approximate - avoid divison */
const sfg_RAD_TO_DEG = rad => rad*57.2958; /* Approximate - avoid divisoin */
const sfg_IN_RANGE = (v, l, u) => v >= l && v <= u; /* Inclusive on lower and upper: [l, u] */
const sfg_ANGLE = (v1, v2) => Math.acos(sfg_DOT(sfg_NORM(v1), sfg_NORM(v2)));
const sfg_CW_ANGLE = (v1, v2) => {
  /* https://stackoverflow.com/questions/14066933/direct-way-of-computing-clockwise-angle-between-2-vectors */
  let n_v1 = sfg_NORM(v1), n_v2 = sfg_NORM(v2);

  let dot = sfg_DOT(n_v1, n_v2);
  let det = sfg_DET(n_v1, n_v2);
  let rad = Math.atan2(det, dot);
  return rad < 0 ? two_PI+rad : rad;
};
const sfg_VECS_TO_POINTS = vecs => vecs.reduce((aggr, v) => aggr+=`${v.x},${v.y} `, '');


function getSFG() {
  return document.getElementById(ID_SFG);
}

function sfg___ns(elem, config={}, ...children) {
  Object.keys(config).forEach(k => {
    elem.setAttribute(k, config[k])
  });

  if (children) {
    children.forEach(child => elem.appendChild(child));
  }

  return elem;
}

function sfg___vec(x, y) {
  return {x, y};
}

function sfg_circle(vec, r, config={}) {
  const c = document.createElementNS(sfg_SVG_NS, 'circle');

  return sfg___ns(c, {
    ...config,
    cx: vec.x,
    cy: vec.y,
    r
  });
}

function sfg_polygon(points, config={}) {
  const p = document.createElementNS(sfg_SVG_NS, 'polygon');

  return sfg___ns(p, {
    ...config,
    points
  });
}

function sfg_polyline(points, config={}) {
  const p = document.createElementNS(sfg_SVG_NS, 'polyline');

  return sfg___ns(p, {
    points,
    ...config
  });
}

function sfg_line(vecf, vect, config={}) {
  const l = document.createElementNS(sfg_SVG_NS, 'line');
  l.style.zIndex = '1';

  return sfg___ns(l, {
    ...config,
    x1: vecf.x,
    y1: vecf.y,
    x2: vect.x,
    y2: vect.y
  });
}

function sfg_g(id, ...children) {
  const g = document.createElementNS(sfg_SVG_NS, 'g');
  g.setAttribute('id', id);

  if (children) {
    children.forEach(c => g.appendChild(c));
  }
  return g;
}

function sfg_text(vec, words, config={}) {
  const t = document.createElementNS(sfg_SVG_NS, 'text');
  if (typeof words === 'string') {
    t.innerHTML = words;
  } else {
    t.appendChild(words);
  }
  t.style.zIndex = '1';

  return sfg___ns(t, {
    ...config,
    x: vec.x, y: vec.y
  });
}

function finite_diff(vecs, i) {
  if (vecs.length === 1 || i === 0
    || i === vecs.length-1) {
    console.log('cannot calculate discrete tan');
    return sfg___vec(0,0);
  }

  /*
   * Calculates the discrete tangent of a curve
   * described by an array of points at a point
   * p (which is also a vector) which can be indexed
   * using vecs[i].
   */
  let p = vecs[i];

  let t1 = sfg_SUB(p, vecs[i-1]);
  let t2 = sfg_SUB(vecs[i+1], p);

  return sfg___vec((t1.x+t2.x)/2, (t1.y+t2.y)/2);
}

function _bezier_(P, len, factor) {
  const X_LOWER = P[0].x;
  const X_UPPER = P[P.length-1].x;

  /* Recursive inner function */
  const bezier = (i, ...Q) => {
    if (!Q.length) return;

    let _Q = [];

    let q_n, v, len;
    let n;
    for (n=0; n<Q.length-1; n++) {
      v = sfg_SUB(Q[n+1], Q[n]);
      len = sfg_MAG(v);
      q_n = sfg_ADD(
        sfg_MULT(sfg_NORM(v), (len/BEZIER_SAMPLE_RATE)*i),
        Q[n]
      );

      _Q.push(q_n);
    }

    /* Base case */
    if (_Q.length === 1) {
      return _Q[0];
    }

    return bezier(i, ..._Q);
  };

  let vecs = [];
  let i;
  for (i=0; i<=BEZIER_SAMPLE_RATE; i++) {
    vecs.push(bezier(i, ...P));
  }

  /*
   * (1) Translate all vecs so the starting point is
   *     at coordinate space (0,0).
   *     Note: y-value in each vec remains the same,
   *     translation only concerns the x-value.
   * (2) Scale vecs so it fits in the coordinate space.
   *     This is the transformation from BEZIER space
   *     to coordinate space.
   */
  vecs = trans(vecs, sfg___vec(0-X_LOWER, 0));
  vecs = scale(vecs, sfg___vec(len/(X_UPPER-X_LOWER), factor));

  return vecs;
}

function _approx_curve_(len) {
  const BEZIER = 'f(x) = 3(1-x)*x^2';
  const X_LOWER = 0;
  const X_UPPER = 1;

  let vecs = [];

  /*
   * Take samples in the math space of the BEZIER
   * function. These points will be stored as vecs
   * for later translation.
   *
   * Later steps takes vecs from BEZIER space and
   * transforms it into coordinate space where it
   * can be visualized on the SVG canvas.
   */
  const parser = math.parser();
  parser.evaluate(BEZIER);
  let sample_amt = 1/BEZIER_SAMPLE_RATE;
  let xval, yval;
  for (xval=X_LOWER; xval<=X_UPPER; xval+=sample_amt) {
    yval = parser.evaluate(`f(${xval})`);
    vecs.push(sfg___vec(xval, yval));
  }

  /*
   * Fix-up: might not be exactly divisible by
   * BEZIER_SAMPLE_RATE which results in a "gaps" in
   * the vecs. If this is the case, simply evaluate
   * BEZIER at X_UPPER to seal up this gap.
   */
  if (xval-sample_amt < X_UPPER) {
    yval = parser.evaluate(`f(${X_UPPER})`);
    vecs.push(sfg___vec(xval, yval));
  }

  /*
   * (1) Translate all vecs so the starting point is
   *     at coordinate space (0,0).
   *     Note: y-value in each vec remains the same,
   *     translation only concerns the x-value.
   * (2) Scale vecs so it fits in the coordinate space.
   *     This is the transformation from BEZIER space
   *     to coordinate space.
   */
  vecs = trans(vecs, sfg___vec(0-X_LOWER, 0));
  vecs = scale(vecs, sfg___vec(len/(X_UPPER-X_LOWER), 70));

  return vecs;
}

function _arrow_() {
  let points = [
    sfg___vec(16,16), sfg___vec(24,19), sfg___vec(32,22),
    sfg___vec(26,16), sfg___vec(32,10), sfg___vec(24,13),
    sfg___vec(16,16)
  ];

  let shift = sfg_CENTER(points);
  shift.x = -shift.x;
  shift.y = -shift.y;

  return trans(points, shift);
}

function trans(vecs, vec_trans) {
  let i;
  for (i=0; i<vecs.length; i++) {
    vecs[i] = sfg_SHIFT(vecs[i], vec_trans);
  }

  return vecs;
}

function scale(vecs, vec_scale) {
  let i, v;
  for (i=0; i<vecs.length; i++) {
    v = vecs[i];
    vecs[i] = sfg_MULT_Y(sfg_MULT_X(v, vec_scale.x), vec_scale.y);
  }

  return vecs;
}

function rot(vecs, theta) {
  let x_a, y_a, x_b, y_b;
  let i, v;
  for (i=0; i<vecs.length; i++) {
    v = vecs[i];
    x_a = v.x;
    y_a = v.y;

    x_b = x_a*Math.cos(theta) - y_a*Math.sin(theta);
    y_b = y_a*Math.cos(theta) + x_a*Math.sin(theta);

    vecs[i] = sfg___vec(x_b, y_b);
  }

  return vecs;
}

function reflect_x(vecs) {
  let i, v;
  for (i=0; i<vecs.length; i++) {
    v = vecs[i];
    vecs[i] = sfg___vec(v.x, -v.y);
  }

  return vecs;
}

function get_bezier(V, E, v_from, v_to, self_loop) {
  let bezier;
  if (self_loop) {
    return _bezier_(
      [
        sfg___vec(0, 0), sfg___vec(-50, 5),
        sfg___vec(20, 12), sfg___vec(30, 4),
        sfg___vec(35, 5), sfg___vec(5,0)
      ],
      sfg_MAG(sfg_SUB(v_to, v_from)), 7);
  }

  /*
   * Conventions to follow:
   * ----------------------------------------------------
   * (1) If v_from and v_to are on the horizontal line (e.sg_g.
   *     within +/-5° of the horizontal line, and vector
   *     direction is sg_RIGHT, then a straight line is drawn.
   * (2) If v_from and v_to are on the horizontal line, but
   *     direction is sg_LEFT, then use wide bezier curve
   *     facing AWAY from the graph center.
   * (3) Scale factor is a function of distance and angle
   *     as follows:
   *        s(d, θ) = min(50, 40 * S_mag(d) * S_spec(θ))
   *
   *        Where:
   *        S_mag(d) = (d/300)^3
   *        S_spec(θ) = |cos(θ)|^p, 0<p<1000
   *
   *     This equation says: the max scale factor is 50.
   *     Angle is measured based on the vector formed from
   *     [v = v_to_ - v_from] wrt the horizontal line.
   *     Separates the unit circle (360°) into 4 quadrants of
   *     90° each: θ' = θ mod 90°.
   *     Then, scale the curve according to a Blinn-Phong-like
   *     specular curve:
   *     The closer the angle is to 45°, the more 'curve'
   *     the bezier will have.
   *
   */
  let h = sfg___vec(1,0);
  let v = sfg_SUB(v_to, v_from);
  let d = sfg_MAG(sfg_SUB(v_to, v_from));
  let theta = sfg_CW_ANGLE(h, v)%(PI_2);
  let S_spec = Math.pow(Math.abs(Math.cos(theta/PI_2-1)), 0.3);
  let S_mag = Math.pow(d/300, 2);
  let s = Math.min(50, 40 * S_mag * S_spec);

  // (1)
  {
    let angle = sfg_RAD_TO_DEG(sfg_ANGLE(v, h));
    // Straight line
    if (angle < 10 && d <= 200) {
      return _bezier_(
        [sfg___vec(0,0), sfg___vec(10,0)],
        sfg_MAG(sfg_SUB(v_to, v_from)), s);
    }
    // Wide bezier
    else if (180-angle < 10) {
      return _bezier_(
        [
          sfg___vec(0,0), sfg___vec(-2,10),
          sfg___vec(4,10), sfg___vec(2,0)
        ],
        sfg_MAG(sfg_SUB(v_to, v_from)), 12);
    }
  }

  // else
  bezier = _bezier_(
    [
      sfg___vec(0,0), sfg___vec(-0.5,2), sfg___vec(2,2),
      sfg___vec(3,0.5), sfg___vec(3.5,2), sfg___vec(4,0)
    ],
    sfg_MAG(sfg_SUB(v_to, v_from)), s);

  return bezier;
}

function sfg_render(V, E) {
  let v_center = sfg_CENTER(Object.values(V).map(v => v.vec));
  const nodes = Object.values(V).map(v => {
    return sfg_circle(v.vec, SZ_CIRCLE_RADIUS, {
        fill: 'white',
        stroke: CLR_NODES,
        'stroke-width': 1
      });
  });
  const node_text = Object.values(V).map(v => {
    return sfg_text(
      sfg_ADD(v.vec, sfg___vec(0,17)),
      v.id, {
        'font-size': '12px',
        'stroke': CLR_TEXT,
        'stroke-width': 1
      }
    );
  });

  let edges = [];
  {
    let E_v = Object.values(E);
    let arrow;
    let p_from, p_to;
    let v_from, v_to;
    let i, e;
    for (i=0; i<E_v.length; i++) {
      e = E_v[i];

      p_from = V[e.from].vec;
      p_to = V[e.to].vec;

      /*
       * Make p_from/p_to start/end outside of the
       * vertex.
       * If it's a self-loop, we set an arbitrary
       * direction for fuzzy_v.
       */
      let fuzzy_v, self_loop = false;
      if (sfg_EQUALS(p_from, p_to)) {
        self_loop = true;
        let vert = sfg___vec(0,1);
        [v_from] = rot([vert], sfg_DEG_TO_RAD(60));
        [v_to] = rot([vert], -sfg_DEG_TO_RAD(60));

        fuzzy_v = sfg_MULT(v_from, SZ_CIRCLE_RADIUS);
        p_from = sfg_ADD(p_from, fuzzy_v);
        fuzzy_v = sfg_MULT(v_to, SZ_CIRCLE_RADIUS);
        p_to = sfg_ADD(p_to, fuzzy_v);
      } else {
        fuzzy_v = sfg_MULT(sfg_NORM(sfg_SUB(p_to, p_from)),
          SZ_CIRCLE_RADIUS);
        p_from = sfg_ADD(p_from, fuzzy_v);
        p_to = sfg_SUB(p_to, fuzzy_v);
      }

      /*
       * Use an approximated BEZIER curve to get
       * straight/curve edges.
       * (1) Rotate edge CW by theta
       * (2) Translate edge so it connects with the nodes
       * (3) Determine orientation of angle wrt center of
       *     mass. Then determine if the curve needs to
       *     be reflected.
       * v:    Direction vector from 'p_from' to 'p_to'
       * h:    Horizontal unit vector
       * v_pc: Direction vector from the Euclidean centroid
       *       of SFG and center of points 'p_from', 'p_to'
       * beta: CW angle between h and v
       * theta:CW angle between h and v_pc
       */
      let v, h, v_pc;
      let beta, theta;
      v = sfg_SUB(p_to, p_from);
      h = sfg___vec(1, 0);
      v_pc = sfg_SUB(sfg_CENTER([p_from, p_to]), v_center);
      beta = sfg_RAD_TO_DEG(sfg_CW_ANGLE(h,v));
      theta = sfg_RAD_TO_DEG(sfg_CW_ANGLE(h,v_pc));

      /*
       * (1) Bezier curve is upside-down when generated,
       *     reflect it along the x-axis
       * (2) Depending on the angle which the center 'pc' of
       *     'p_from' and 'p_to' makes with the center of all
       *     SFG nodes (e.g. which quadrant 'pc' resides),
       *     it may need to be reflected in order for the
       *     bezier curve to face 'outwards' (or away from
       *     the Euclidean center of the SFG)
       *
       * Please refer to svgcircuit documentation for details
       * on how this is implemented.
       */
      let bezier = get_bezier(V, E, p_from, p_to, self_loop);
      bezier = reflect_x(bezier);
      if (sfg_IN_RANGE(theta,270,360) || sfg_IN_RANGE(theta,0,90)) {
        if (sfg_IN_RANGE(beta,180,360)) {
          bezier = reflect_x(bezier);
        }
      } else {
        if (sfg_IN_RANGE(beta,0,180)) {
          bezier = reflect_x(bezier);
        }
      }
      bezier = rot(bezier, sfg_DEG_TO_RAD(beta));
      bezier = trans(bezier, p_from);
      edges.push(sfg_polyline(sfg_VECS_TO_POINTS(bezier),
        {
          stroke: CLR_EDGES,
          fill: 'none',
          'stroke-width': WIDTH_EDGE_STROKE
        }
      ));

      /*
       * Find counter-clockwise angle between edge
       * vector and the x-axis vector (as a reference).
       * (1) Rotate arrow CW by theta
       * (2) Translate arrow to center of edge
       */
      let tan_v = finite_diff(bezier, Math.floor(bezier.length/2));
      let a_theta = sfg_CW_ANGLE(sfg___vec(-10, 0), tan_v);
      arrow = _arrow_();
      arrow = rot(arrow, a_theta);
      arrow = trans(arrow, bezier[Math.floor(bezier.length/2)]);
      edges.push(sfg_polygon(
        sfg_VECS_TO_POINTS(arrow),
        {fill: CLR_ARROWS}
      ));
    }
  }

  removeSFG();
  sfg___ns(getSFG(), {},
    sfg_g(ID_SFG_WRAPPER_G, ...[...edges, ...node_text, ...nodes])
  );
}

function toSFG(nodes, sfg) {
  let _sfg = [];
  {
    let node;
    let i;
    for (i=0; i<sfg.length; i++) {
      node = nodes.find(n => n.id === sfg[i].id);
      if (sfg_DEFINED(node)) {
        _sfg.push({
          ...sfg[i],
          x: node.x,
          y: node.y
        });
      }
    }
  }

  return _sfg;
}

function removeSFG() {
  let wrapper_g = document.getElementById(ID_SFG_WRAPPER_G);
  if (sfg_DEFINED(wrapper_g)) {
    getSFG().removeChild(wrapper_g);
  }
}

function sfg_init(sfg) {
  let V = {}, E = {};
  {
    let i, v;
    for (i=0; i<sfg.length; i++) {
      v = sfg[i];

      if (!V.hasOwnProperty(v.id)) {
        V[v.id] = {
          id: v.id,
          value: v.value,
          edges: v.outgoingEdges.map(adj_e => adj_e.id),
          adj: v.outgoingEdges.map(adj_e => {
            if (adj_e.startNode === v.id) {
              return adj_e.endNode;
            } else {
              return adj_e.startNode;
            }
          }),
          vec: sfg___vec(v.x, v.y)
        };
      }

      v.outgoingEdges.forEach(e => {
        if (!E.hasOwnProperty(e.id)) {
          E[e.id] = {
            id: e.id,
            weight: e.weight,
            from: e.startNode,
            to: e.endNode
          };
        }
      });
    }
  }

  sfg_render(V, E);
}
