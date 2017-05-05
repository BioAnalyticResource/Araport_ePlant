(function () {
	/* global Eplant */

	/**
	 * Eplant.Views.InteractionView.LoadInteraction class
	 * Coded by Ian Shi
	 *
	 * Used to load all interactions to construct graph, and returns a promise when done
	 *
	 * @constructor
	 * @param {Object} geneticElement The current genetic element
	 */
	'use strict';
	Eplant.Views.InteractionView.LoadInteraction = function (geneticElement) {
		this.data = null;
		this.geneticElement = geneticElement;
		this.loadFlags = null;

		this.nodes = null;
		this.edges = null;

		this.query = geneticElement.identifier.toUpperCase();

		// Asynchronously load data
		var loadQuery = loadJSON.bind(this, this.query);
		var dataLoadedPromise = new Promise(loadQuery);

		// Promise which resolves when all nodes/edges are loaded
		var interactionsLoadedPromise = new Promise(function (resolve) {
			// Begin processing once JSON is loaded
			dataLoadedPromise.then(function (data) {
				this.data = data[this.query];

				this.getLoadFlags(this.data);
				this.loadInteractions(this.data);

				var returnObject = {
					nodes: this.nodes,
					edges: this.edges,
					loadFlags: this.loadFlags
				}
				resolve(returnObject);
			}.bind(this));
		}.bind(this));

		return interactionsLoadedPromise;
	};

	/**
	 * Get flags used in futher loading
	 * @param  {Object} data JSON format interaction data
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.getLoadFlags = function (data) {
		var loadFlags = {
			empty: checkEmpty(data),
			existsPDI: checkExistsPDI(data),
			existsPPI: checkExistsPPI(data),
			recursive: checkRecursive(data)
		};
		this.loadFlags = loadFlags;
	};

	/**
	 * Convert interactions from JSON to cytoscape node/edges without PDIs
	 * @param  {Object} data Interaction data from JSON
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.loadInteractions = function (data) {
		if (!this.loadFlags.recursive) {
			createRecursiveLabel();
		}

		this.nodes = [];
		this.edges = [];

		if (!this.loadFlags.empty) {
			// Create top levelcompound nodes
			if (this.loadFlags.existsPDI) {
				this.createCompoundDNA();
				if (this.loadFlags.existsPPI) {
					this.createCompoundProtein();
				}
			}
			// Load interactions
			if (this.loadFlags.existsPDI) {
				this.loadInteractionsChr(data);
			} else {
				this.loadInteractionsNoDNA(data);
			}
		} else {
			this.createQueryNode(this.query);
			this.createNonIntNode();
		}
	};

	/**
	 * Convert interactions from JSON to cytoscape node/edges with PDIs
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.loadInteractionsDNA = function () {
		this.createQueryNode(this.query);
		var createFunctions = [];
		createFunctions.push(this.createSelfQPI.bind(this));
		createFunctions.push(this.createQPI.bind(this));
		createFunctions.push(this.createPPI.bind(this));
		createFunctions.push(this.createPDI.bind(this));

		this.createInteractions(createFunctions);
	};

	Eplant.Views.InteractionView.LoadInteraction.prototype.loadInteractionsChr = function () {
		this.createQueryNode(this.query);
		this.createChromosomes(this.data);
		var createFunctions = [];
		createFunctions.push(this.createSelfQPI.bind(this));
		createFunctions.push(this.createQPI.bind(this));
		createFunctions.push(this.createPPI.bind(this));
		createFunctions.push(this.createChr.bind(this));
		this.createInteractions(createFunctions);
	};

	/**
	 * Convert interactions from JSON to cytoscape node/edges without PDIs
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.loadInteractionsNoDNA = function () {
		this.createQueryNode(this.query);
		var createFunctions = [];
		createFunctions.push(this.createSelfQPI.bind(this));
		createFunctions.push(this.createQPI.bind(this));
		createFunctions.push(this.createPPI.bind(this));

		this.createInteractions(createFunctions);
	};

	/**
	 * Creates interactions using creation functions
	 * @param  {Array} funcArr Array of functions which to call to construct graph
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createInteractions = function (funcArr) {
		var data = this.data.slice();
		for (var n = 0; n < funcArr.length; n++) {
			var addedIndices = [];
			for (var i = 0; i < data.length - 1; i++) {
				var re = /At\dg\d{5}/;
				if (re.test(data[i].source) && re.test(data[i].target) && funcArr[n](data[i])) {
					addedIndices.unshift(i);
				}
			}

			for (var k = 0; k < addedIndices.length; k++) {
				data.splice(addedIndices[k], 1);
			}
		}

		if (data.length > 1) {
			console.error('Error: ' + data.length + ' interactions not processed.');
		}
	};

	/**
	 * Create nodes for chromosomal nodes
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createChromosomes = function (data) {
		var chrs = [];
		var chrNums = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
		for (var k = 0; k < data.length - 1; k++) {
			var chr = data[k].target.substring(2, 3);
			if (data[k].index === '2') {
				chrNums[chr]++;
				if (!chrs.includes(chr)) {
					chrs.push(chr);
				}
			} 
		}

		for (var chr in chrNums) {
			if (chrNums[chr] === 0) delete chrNums[chr];
		}

		var i = 0;
		for (var c in chrNums) {
			this.createChromosomeNode(chrs[i], chrNums[c]);
			this.createChromosomeEdge(chrs[i]);
			i++;
		}
	};

	/**
	 * Creates top level protein compound node
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createCompoundProtein = function () {
		var proteinCompound = {
			group: 'nodes',
			data: {
				id: 'COMPOUND_PROTEIN'
			},
			classes: 'compound-top'
		};
		this.nodes.push(proteinCompound);
	};

	/**
	 * Creates top level dna compound node
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createCompoundDNA = function () {
		var dnaCompound = {
			group: 'nodes',
			data: {
				id: 'COMPOUND_DNA'
			},
			classes: 'compound-top'
		};
		this.nodes.push(dnaCompound);
	};

	/**
	 * Create no interactions node
	 * @return {void} Node object
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createNonIntNode = function () {
		var nonIntNode = {
			group: 'nodes',
			data: {
				id: 'noInteractionLabel'
			},
			position: {
				x: 0,
				y: 400
			}
		};
		this.nodes.push(nonIntNode);			
	};

	/**
	 * Create the query node; the one which user has entered
	 * @param  {String} query ID of query gene
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createQueryNode = function (query) {
		var geneticElement = this.geneticElement.species.getGeneticElementByIdentifier(query);
		var compound = {
			group: 'nodes',
			data: {
				id: query + 'QUERY_COMPOUND'
			},
			classes: 'protein-compound'
		};

		var border = {
			group: 'nodes',
			data: {
				id: query + 'QUERY_BACK',
				parent: query + 'QUERY_COMPOUND'
			},
			classes: 'protein-back'
		};

		var node = {
			group: 'nodes',
			data: {
				id: query + 'QUERY_NODE',
				content: query,
				geneticElement: geneticElement,
				parent: query + 'QUERY_COMPOUND'
			},
			classes: 'protein-node loaded'
		};

		this.nodes.push(compound);
		this.nodes.push(border);
		this.nodes.push(node);
	};

	/**
	 * Create Protein Nodes. Consists of three nodes: regular protein body, a pie node for border,
	 * and a compound container to keep nodes together.
	 * @param  {String} id ID of gene to represent
	 * @return {Object} Node object
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createProteinNode = function (id) {
		id = id.toUpperCase();
		var geneticElement = this.geneticElement.species.getGeneticElementByIdentifier(id);
		var compound = {
			group: 'nodes',
			data: {
				id: id + 'PROTEIN_COMPOUND'
			},
			classes: 'protein-compound'
		};

		var border = {
			group: 'nodes',
			data: {
				id: id + 'PROTEIN_BACK',
				parent: id + 'PROTEIN_COMPOUND'
			},
			classes: 'protein-back'
		};

		var node = {
			group: 'nodes',
			data: {
				id: id + 'PROTEIN_NODE',
				content: id,
				geneticElement: geneticElement,
				parent: id + 'PROTEIN_COMPOUND'
			},
			classes: 'protein-node'
		};

		if (this.loadFlags.existsPDI) {
			compound.data.parent = 'COMPOUND_PROTEIN';
		}
		if (geneticElement && geneticElement.isLoadedViews) {
			node.classes = 'protein-node loaded';
		}

		this.nodes.push(compound);
		this.nodes.push(border);
		this.nodes.push(node);

		return { compound: compound, border: border, node: node };
	};

	/**
	 * Create DNA node
	 * @param  {String} id ID of gene to represent
	 * @return {Object} Node object
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createDNANode = function (id) {
		id = id.toUpperCase();
		var geneticElement = this.geneticElement.species.getGeneticElementByIdentifier(id);
		var node = {
			group: 'nodes',
			data: {
				id: id + 'DNA_NODE',
				content: id,
				geneticElement: geneticElement,
				parent: 'COMPOUND_DNA'
			},
			classes: 'dna-node'
		};
		if (geneticElement && geneticElement.isLoadedViews) {
			node.classes = 'dna-node loaded';
		}
		this.nodes.push(node);

		return { node: node };
	};
	
	/**
	 * Create chromosomal node
	 * @param {Number} id Chromosomal number
	 * @return {Object} Node object
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createChromosomeNode = function (id, n) {
		var node = {
			data: {
				id: 'chr' + id,
				content: 'Chr ' + id + ': ' + n + ' PDIs',
				parent: 'COMPOUND_DNA',
				genes: []
			}, 
			classes: 'dna-node'
		};
		this.nodes.push(node);
		return { node: node };
	};

	/**
	 * Create edges representing PPIs
	 * @param  {Object} data JSON interaction data
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createProteinEdge = function (data) {
		// Gets method used to determine interaction
		var method = data.reference === 'None' ? 'P' : 'E';

		var source = data.source.toUpperCase();
		var target = data.target.toUpperCase();

		source = source === this.query ? source + 'QUERY_NODE' : source + 'PROTEIN_NODE';
		target = target === this.query ? target + 'QUERY_NODE' : target + 'PROTEIN_NODE';

		var edge = {
			data: {
				source: source,
				target: target,
				tooltip: null,
				type: 'PPI',
				method: method,
				correlation: data.correlation_coefficient
			},
			classes: 'protein-edge'
		};

		if (method === 'P') {
			edge.data.interolog_conf = data.interolog_confidence;
		}

		if (data.reference !== 'None') {
			edge.data.reference = data.reference;
		}

		edge = this.setProteinEdgeStyles(edge);
		edge.data.tooltipContent = this.setEdgeTooltipContent(edge);
		this.edges.push(edge);
	};

	/**
	 * Create edges representing PDIs
	 * @param  {Object} data JSON interaction data
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createDNAEdge = function (data) {
		// Gets method used to determine interaction
		var method = data.index === '3' ? 'P' : 'E';

		var source = data.source.toUpperCase();
		var target = data.target.toUpperCase();

		source = source === this.query ? source + 'QUERY_NODE' : source + 'PROTEIN_NODE';
		target = target + 'DNA_NODE';

		var edge = {
			data: {
				source: source,
				target: target,
				tooltip: null,
				type: 'PDI',
				method: method
			},
			classes: 'dna-edge'
		};

		// Set confidence if predicted
		if (method === 'P') {
			edge.data.fimo_conf = data.interolog_confidence;
		}

		if (data.reference !== 'None') {
			edge.data.reference = data.reference;
		}

		edge = this.setDNAEdgeStyles(edge);
		edge.data.tooltipContent = this.setEdgeTooltipContent(edge);
		this.edges.push(edge);
	};
	
	/**
	 * Create interaction to chromosomal node
	 * @param {Number} id Chromosomal number
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createChromosomeEdge = function (id) {
		var edge = {
			data: {
				source: this.query + 'QUERY_NODE',
				target: 'chr' + id,
				tooltip: null, 
				type: 'PDI',
				method: 'E'
			},
			classes: 'chr-edge'
		};
		edge = this.setDNAEdgeStyles(edge);
		//edge.data.tooltipContent = this.setEdgeTooltipContent(edge);
		this.edges.push(edge);
	};

	/**
	 * Sets edge styles for protein edges
	 * @param {Object} edge The edge object with completed data entry
	 * @return {Object} Edge object with styles
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.setProteinEdgeStyles = function (edge) {
		// Set edge style and size based on confidence
		edge.data.lineStyle = 'solid';
		if (edge.data.method === 'E') {
			edge.data.size = 6;
		} else if (edge.data.interolog_confidence > 10) {
			edge.data.size = 6;
		} else if (edge.data.interolog_confidence > 5) {
			edge.data.size = 4;
		} else if (edge.data.interolog_confidence > 2) {
			edge.data.size = 1;
		} else {
			edge.data.lineStyle = 'dashed';
			edge.data.size = 1;
		}

		if (edge.data.method === 'E') {
			edge.data.lineColor = '#99CC00';
		} else if (edge.data.correlation_coefficient > 0.8) {
			edge.data.lineColor = '#B1171D';
		} else if (edge.data.correlation_coefficient > 0.7) {
			edge.data.lineColor = '#D32E09';
		} else if (edge.data.correlation_coefficient > 0.6) {
			edge.data.lineColor = '#E97911';
		} else if (edge.data.correlation_coefficient > 0.5) {
			edge.data.lineColor = '#EEB807';
		} else {
			edge.data.lineColor = '#A0A0A0';
		}

		return edge;
	};

	/**
	 * Sets edge styles for DNA edges
	 * @param {Object} edge The edge object with completed data entry
	 * @return {Object} Edge object with styles
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.setDNAEdgeStyles = function (edge) {
		// Set edge width
		edge.data.lineStyle = 'solid';
		if (edge.data.method === 'E') {
			edge.data.size = 6;
		} else if (edge.data.fimo_conf <= 0.0000000001) {
			edge.data.size = 6;
		} else if (edge.data.fimo_conf <= 0.00000001) {
			edge.data.size = 4;
		} else if (edge.data.fimo_conf < 0.000001) {
			edge.data.size = 1;
		} else {
			edge.data.lineStyle = 'dashed';
			edge.data.size = 1;
		}

		// Set edge color based on method
		if (edge.data.method === 'E') {
				edge.data.lineColor = '#669900';
		} else {
				edge.data.lineColor = '#A0A0A0';
		}

		return edge;
	};

	/**
	 * Generate the tooltip associated with an edge from interaction data
	 * @param {Object} edge The cyConf edge object
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.setEdgeTooltipContent = function (edge) {
		// First line declaring type
		var typeString = edge.data.type === 'PDI' ? 'DNA' : 'Protein';
		var firstLine = 'Protein-' + typeString + ' Interaction';
		// Add method of determination
		if (edge.data.method === 'E') {
			firstLine += ' (E)';
		} else {
			firstLine += ' (P)';
		}
		// Remaining lines containing data
		var dataLines = '';
		if (edge.data.type === 'PDI') {
			if (edge.data.method === 'P') {
				dataLines += 'Confidence(FIMO): ' + edge.data.fimo_conf + '<br>';
			}
		} else {
			if (edge.data.method === 'P') {
				dataLines += 'Confidence(Interolog): ' + edge.data.interolog_conf + '<br>';
			}
			dataLines += 'Co-expression coefficient: ' + edge.data.correlation + '<br>';
		}

		var final = firstLine + '<br>' + dataLines;
		return final;
	};

	/**
	 * Check if a node already exists in the collection of all nodes
	 * @param  {String} searchID The ID of the element to be compared against the collection
	 * @return {Boolean} Returns true if a node with the same id already exists
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.checkNodeExists = function (searchID) {
		// Checks if current interaction source exists as a node
		for (var n = 0; n < this.nodes.length; n++) {
			// Compares interaction with existing node elements
			if (this.nodes[n].data.id.toUpperCase() === searchID) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Create interaction from query node to itself.
	 * @param  {Object} data Object containing interaction data
	 * @return {Boolean} Whether an interaction was created
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createSelfQPI = function (data) {
		// Verify that the inputted index is correct
		var index = data.index;
		var sourceID = data.source.toUpperCase();
		var targetID = data.target.toUpperCase();

		// Check if the source and target nodes are the query node
		var isQuerySource = sourceID === this.query;
		var isQueryTarget = targetID === this.query;
		if (index < 2 && isQuerySource && isQueryTarget) {
			this.createProteinEdge(data);
			return true;
		}
		return false;
	};

	/**
	 * Create interactions from Query to Proteins.
	 *
	 * @param  {Object} data The object which contains data for this interaction
	 * @return {Boolean} Whether a QPI was created
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createQPI = function (data) {
		// Store interaction data
		var sourceID = data.source.toUpperCase();
		var targetID = data.target.toUpperCase();

		// Checks if the source node is the query node
		var isQuerySource = sourceID === this.query;
		// Checks if the target node is the query node
		var isQueryTarget = targetID === this.query;

		// Create interaction if above conditions are met. Interaction must be PPI, and source and
		// target must be different, as self interctions should not be handled.
		if (data.index < 2 && sourceID !== targetID && (isQuerySource || isQueryTarget)) {
			// Add appropriate identifier tag to source
			var existsSource;
			var existsTarget;
			if (isQuerySource) {
				existsSource = true;
				existsTarget = this.checkNodeExists(data.target + 'PROTEIN_NODE');
			} else {
				existsSource = this.checkNodeExists(data.source + 'PROTEIN_NODE');
				existsTarget = true;
			}

			// Create source node if not pre-existing
			if (!existsSource) {
				this.createProteinNode(data.source.toUpperCase());
			}

			// Create target node if not pre-existing
			if (!existsTarget) {
				this.createProteinNode(data.target.toUpperCase());
			}

			// Create an interaction if not pre-existing
			if (!existsTarget || !existsSource) {
				this.createProteinEdge(data);
				return true;
			}
		}
		return false;
	};

	/**
	 * Creates protein-protein interactions which do not include the query node.
	 * Must be executed after the createQPI method has run.
	 * This ensures that all PPIs will have an origin from a query node rooted protein.
	 * This method will include the creation of self PPIs.
	 *
	 * @param  {Object} data Object containing interaction data
	 * @return {Boolean} Whether an interaction was created
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createPPI = function (data) {
		// Store interaction data
		var sourceID = data.source.toUpperCase();
		var targetID = data.target.toUpperCase();

		// Checks that both the source and target nodes are pre-existing
		var existsProteinSource = this.checkNodeExists(sourceID + 'PROTEIN_NODE');
		var existsProteinTarget = this.checkNodeExists(targetID + 'PROTEIN_NODE');

		// Check that source and target nodes are not the query node
		var existsQuerySource = this.checkNodeExists(sourceID + 'QUERY_NODE');
		var existsQueryTarget = this.checkNodeExists(targetID + 'QUERY_NODE');

		var existsQuery = existsQuerySource || existsQueryTarget;

		if (data.index < 2 && (existsProteinSource || existsProteinTarget) && !existsQuery) {
			// Create source node if not pre-existing
			if (!existsProteinSource) {
				this.createProteinNode(data.source.toUpperCase());
			}

			// Create target node if not pre-existing
			if (!existsProteinTarget) {
				// Create target node
				this.createProteinNode(data.target.toUpperCase());
			}

			this.createProteinEdge(data);

			return true;
		}
		return false;
	};

	/**
	 * Creates protein DNA interactions.
	 * The elements are only created if an existing protein source exists.
	 * This method must be run after createPPI method.
	 *
	 * @param  {Object} data Object containing interaction data
	 * @return {Boolean} Whether an interaction was created
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createPDI = function (data) {
		var querySourceID = data.source.toUpperCase() + 'QUERY_NODE';
		var proteinSourceID = data.source.toUpperCase() + 'PROTEIN_NODE';

		var querySourceExists = this.checkNodeExists(querySourceID);
		var proteinSourceExists = this.checkNodeExists(proteinSourceID);

		// Verify that the index is correct, and a source query or protein node exists
		if (data.index >= 2 && (querySourceExists || proteinSourceExists)) {
			// Create DNA node if non-existing
			if (!this.checkNodeExists(data.target + 'DNA_NODE')) {
				this.createDNANode(data.target.toUpperCase());
			}
			// Create new edge
			this.createDNAEdge(data);

			// Return true if an interaction has been created
			return true;
		}
		return false;
	};
	
	/**
	 * Creates DNA interactions assigned to chromosomal nodes
	 * @param {Object} JSON data object
	 * @return Whether an interaction was created
	 */
	Eplant.Views.InteractionView.LoadInteraction.prototype.createChr = function (data) {
		if (data.index !== '2') {
			return false;
		}
		var chr = data.target.substring(2, 3);
		var chrNode = this.nodes.filter(function (item) {
			return item.data.id === 'chr' + chr;
		})[0];
		chrNode.data.genes.push(data.target);
		return true;	
	};
	
	/**
	 * Shows recursive label
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.showRecursiveLabel = function () {
		if ($('#nonRecursiveLabel').length === 1) {
			$('#nonRecursiveLabel').show();
		}
	};
	/**
	 * Hides recursive label
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadInteraction.hideRecursiveLabel = function () {
		if ($('#nonRecursiveLabel').length === 1) {
			$('#nonRecursiveLabel').hide();
		}
	};

	/**
	 * Creates the recursive HTML label and appends it to view
	 * @return {void}
	 */
	function createRecursiveLabel () {
		// Checks if label is pre-existing
		if ($('#nonRecursiveLabel').length === 0) {
			// Get cytoscape container
			var cytoContainer = $('#Cytoscape_container');
			// Create DOM elements
			var recContainer = document.createElement('div');
			recContainer.id = 'nonRecursiveLabel';
			var recLabel = document.createElement('div');
			recLabel.innerHTML = 'Recursive interactions not shown';
			// Set CSS for DOM elements
			$(recLabel).css({
				'color': '#444444',
				'font-size': '1.3em',
				'left': '20px',
				'line-height': '1.5em',
				'position': 'absolute',
				'top': '40px',
				'z-index': '1'
			});
			$(recContainer).hide();
			// Append DOM elements to containers
			$(recContainer).append(recLabel);
			$(cytoContainer).append(recContainer);
		}
	}

	/**
	 * Returns if protein-dna interactions exists in data
	 * @param  {Object} data JSON format interaction data
	 * @return {Boolean} Whether PDIs exist in data
	 */
	function checkExistsPDI (data) {
		for (var n = 0; n < data.length - 1; n++) {
			// Checks for PDI interactions, which have an index > 1
			if (data[n].index > 1) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Returns if protein-protein interactions exists in data
	 * @param  {Object} data JSON format interaction data
	 * @return {Boolean} Whether PDIs exist in data
	 */
	function checkExistsPPI (data) {
		for (var n = 0; n < data.length - 1; n++) {
			// Checks for PPI interactions, which have an index < 1
			if (data[n].index < 2) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if JSON data includes recursive interactions
	 * @param  {Object} data Last object contains recursive data
	 * @return {Boolean} Whether data includes recursive interactions
	 */
	function checkRecursive (data) {
		return data[data.length - 1].recursive === 'true';
	}

	/**
	 * Checks if any interactions exist in data
	 * @param  {Object} data JSON format interaction data
	 * @return {Boolean} Whether interactions exist
	 */
	function checkEmpty (data) {
		return data.length < 2;
	}

	/**
	 * Calls upon webservice to get all interactions related to a query
	 * @param  {String} query   The name of the gene to query
	 * @param  {Function} resolve Promise call back on success
	 * @return {void}
	 */
	function loadJSON (query, resolve) {
		//var u = '//bar.utoronto.ca/eplant/cgi-bin/get_interactions_dapseq.php'; // Araport
		var req = '?request=[{"agi":' + JSON.stringify(query) + '}]';
		$.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			dataType: "json",
			type: "GET",
			url: Eplant.ServiceUrl + "get_interactions_dapseq.php" + req,
			success: $.proxy(function(response) {
				resolve(response);
			})
		});
	}
}());
