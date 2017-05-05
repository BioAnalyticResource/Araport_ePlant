(function () {
	/* global Eplant*/

	/**
	 * Eplant.Views.InteractionView.Layout class
	 * Coded by Ian Shi
	 *
	 * Used to lay out nodes. DNA nodes are positioned in alignment, while
	 * protein nodes are positioned by layout.
	 *
	 * @constructor
	 * @param {Object} interactionView InteractionView object
	 */
	'use strict'
	Eplant.Views.InteractionView.Layout = function (interactionView, cb) {
		this.cy = interactionView.cy;
		this.loadFlags = interactionView.loadFlags;
		this.cb = cb;
		if (!this.loadFlags.empty) {
			this.positionProtein();
			if (this.loadFlags.existsPDI) {
				//this.positionDNA();
				this.positionChr();
			}
		}
	};

	/**
	 * Calls layout on protein nodes.
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.Layout.prototype.positionProtein = function () {
		// Get nodes
		var proteinNodes = this.cy.$('[id $= "PROTEIN_NODE"]');
		var that = this;
		if (this.loadFlags.existsPDI || proteinNodes.length < 100) {
			// Layout proteins for PDI
			proteinNodes.layout({
				name: 'cose-bilkent',
				// Whether to fit the network view after when done
				fit: false,
				// Node repulsion (non overlapping) multiplier
				nodeRepulsion: 5000,
				// Maximum number of iterations to perform
				numIter: 7500,
				// For enabling tiling (Must be false, or error occurs)
				tile: false,
				// Type of layout animation. The option set is {'during', 'end', false}
				animate: 'false',
				// Stop callback
				stop: function () {
					transformAverage(proteinNodes, that.loadFlags.existsPDI);
					that.positionProteinBack(proteinNodes);
					that.cb();
				}
			});
		} else {
			proteinNodes.layout({
				name: 'arbor',
				fit: true,
				stop: function () {
					transformAverage(proteinNodes, false);
					that.positionProteinBack(proteinNodes);
					that.cb();
				}
			});
		}
	};

	/**
	 * Updates the position of protein back nodes to be the same as protein node bodies.
     * @param  {Collection} nodes The collection of node bodies
	 * @return {void}
	 */
	Eplant.Views.InteractionView.Layout.prototype.positionProteinBack = function (nodes) {
		for (var i = 0; i < nodes.length; i++) {
			var position = nodes[i]._private.position;
			var id = nodes[i]._private.data.id.substring(0, 9);
			this.cy.$('#' + id + 'PROTEIN_BACK').position(position);
		}
	};

	/**
	 * Positions DNA nodes
	 * @return {void}
	 */
	Eplant.Views.InteractionView.Layout.prototype.positionDNA = function () {
		// Get DNA nodes
		var dnaNodes = this.cy.$('[id $= "DNA_NODE"]');
		// Get DNA node positions
		var dnaPositions;
		if (dnaNodes.length > 30) {
			dnaPositions = positionDNACircular(dnaNodes.length);
		} else {
			dnaPositions = positionDNALinear(dnaNodes.length);
		}
		// Update position
		for (var i = 0; i < dnaNodes.length; i++) {
			var x = dnaPositions[i][0];
			var y = dnaPositions[i][1];
			var id = '#' + dnaNodes[i]._private.data.id;
			this.cy.$(id).position({ x: x, y: y });
		}
	};

	/**
	 * Positions Chr nodes
	 * @return {void}
	 */
	Eplant.Views.InteractionView.Layout.prototype.positionChr = function () {
		// Get DNA nodes
		var chrNodes = this.cy.$('[id ^= "chr"]');
		// Get DNA node positions
		var chrPositions = positionDNALinear(chrNodes.length);
		// Update position
		for (var i = 0; i < chrNodes.length; i++) {
			var x = chrPositions[i][0];
			var y = chrPositions[i][1];
			var id = '#' + chrNodes[i]._private.data.id;
			this.cy.$(id).position({ x: x, y: y });
		}
	};
	/**
	 * Transform the collection of protein nodes to an area to the average right of the query node.
	 *
	 * @param  {Array} nodes The array of nodes to transform
	 * @param  {Boolean} offset Controls whether nodes are offset off query x position
	 * @return {void}
	 */
	function transformAverage (nodes, offset) {
		var minX = 10000;
		var maxY = -10000;
		var minY = 10000;

		var avgX = 0;
		var avgY = 0;

		// Get range and average of values
		for (var n = 0; n < nodes.length; n++) {
			var posX = nodes[n].position('x');
			var posY = nodes[n].position('y');
			minX = posX < minX ? posX : minX;
			minY = posY < minY ? posY : minY;
			maxY = posY > maxY ? posY : maxY;

			avgX += posX;
			avgY += posY;
		}

		var shiftX = 100 > minX ? 100 - minX : 0;
		avgX = offset ? shiftX : avgX / nodes.length;
		avgY = avgY / nodes.length;

		// Transform positions
		nodes.positions(function (i, node) {
			var curX = node.position('x');
			var curY = node.position('y');
			return {
				x: offset ? curX + avgX : curX - avgX,
				y: curY - avgY
			}
		});
	}

	/**
	 * Determines Y coordinate for individual nodes with even spacing
	 *
	 * @param {Number} numNodes The amount of nodes to be positioned
	 * @return {List} coordinates The calculated (x, y) coordinates
	*/
	function positionDNALinear (numNodes) {
		var x = -350;
		var midpoint = 0;
		var coordinates = [];
		var increment = 100;
		// Assign values to coordinates
		if (numNodes <= 0) {
			// Return empty coords
			coordinates = [];
		} else if (numNodes === 1) {
			// Return midpoint
			coordinates.push([x, midpoint]);
		} else if (numNodes % 2 === 0) {
			// Adds coordinates symmetrically from the midpoint.
			// The midpoint is placed between the two middle coordinates.
			for (var n = 0; n < numNodes / 2; n++) {
				coordinates.push([x, 50 + n * increment]);
				coordinates.unshift([x, -50 - n * increment]);
			}
		} else {
			// Add aligned center node
			coordinates.push([x, midpoint]);
			// Adds coordinates symmetrically from the midpoint.
			for (var k = 1; k <= Math.floor(numNodes / 2); k++) {
				coordinates.push([x, midpoint + k * increment]);
				coordinates.unshift([x, midpoint - k * increment]);
			}
		}
		return coordinates;
	}

	/**
	 * Generates the coordinates to lay out DNA nodes in a semicircle
	 * @param {Number} numNodes The number of nodes to lay out
	 * @returns {Array} The computed coordinate array [(x,y)..] in a semi-circle
	 */
	function positionDNACircular (numNodes) {
		// Set bounds for semi-circle (in radians)
		var topLimit;
		var bottomLimit;
		if (numNodes > 80) {
			// Increase arc size past vertical if many nodes
			topLimit = Math.PI / 2 - Math.PI / 8;
			bottomLimit = Math.PI * 1.5 + Math.PI / 8;
		} else {
			topLimit = Math.PI / 2;
			bottomLimit = Math.PI * 1.5;
		}

		// Angle in radians between nodes
		var increment = (bottomLimit - topLimit) / numNodes;

		// Rows of nodes to stagger
		var rows = 2;
		if (numNodes > 75) {
			rows += 1 + Math.floor(numNodes / 80);
		}
		// Counter to track current row
		var j = 1;

		// Final array of x,y coordinates of nodes
		var coordArray = [];

		for (var i = topLimit; i < bottomLimit; i += increment) {
			// Determine radius and distance between nodes
			var radius;
			var separationWeight;
			if (numNodes > 400) {
				radius = (10 - rows) * numNodes;
				separationWeight = 1 + rows * 0.1;
			} else if (numNodes > 100) {
				radius = (10 - 1.1 * rows) * numNodes;
				separationWeight = 1 + rows * 0.1;
			} else {
				radius = 7.5 * numNodes;
				separationWeight = 1 + rows * 0.3;
			}
			// Stagger rows, weight radius by number of nodes
			if (j % rows === 7) {
				radius += separationWeight * 315;
			} else if (j % rows === 6) {
				radius += separationWeight * 270;
			} else if (j % rows === 5) {
				radius += separationWeight * 225;
			} else if (j % rows === 4) {
				radius += separationWeight * 180;
			} else if (j % rows === 3) {
				radius += separationWeight * 135;
			} else if (j % rows === 2) {
				radius += separationWeight * 90;
			} else if (j % rows === 1) {
				radius += separationWeight * 45;
			}
			j++;
			coordArray.unshift(trigCalculator(radius, i));
		}
		return coordArray;
	}

	/**
	 * Generates the x-y coordinates of nodes using trigonometry
	 * @param {Number} radius The radius of the interaction edge
	 * @param {Number} angle The angle of the interaction edge in radians
	 * @returns {Tuple} Returns a tuple of (x, y)
	 */
	function trigCalculator (radius, angle) {
		var xCoord = radius * Math.cos(angle);
		var yCoord = radius * Math.sin(angle);
		return [xCoord, yCoord];
	}

}());
