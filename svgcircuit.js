const generateCircuit = (canvas_id, circuit_elems, toggle=false) => {
	let circuit_canvas = document.getElementById(canvas_id);
	try {
		circuit_canvas.removeChild(document.getElementById('circuit-group-wrapper'));
	} catch(ex) {
		// do nothing
	}

	let wrapper_group = createSVGGroup();
	wrapper_group.id = 'circuit-group-wrapper';
	let elem;
	circuit_elems.forEach( c => {
		elem = Element.create(c.type, c.id, c.p_center, c.R,
			c.p_from, c.p_to, toggle);

		wrapper_group.appendChild(elem);
	});

	circuit_canvas.appendChild(wrapper_group);
};

const putCircuitToForeground = (canvas_id, circuit_elems) => {
	generateCircuit(canvas_id, circuit_elems, true);
};

