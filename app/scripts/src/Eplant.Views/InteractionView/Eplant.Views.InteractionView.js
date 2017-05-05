(function () {
	/* global Eplant, ZUI, cytoscape*/
	
	/**
		* Eplant.Views.InteractionView class
		* Coded by Ian Shi & Hans Yu
		* UI designed by Jamie Waese
		*
		* eFP View for browsing protein-protein interactions data.
		* Uses the Cytoscape.js plugin.
		*
		* @constructor
		* @augments Eplant.View
		* @param {Eplant.GeneticElement} geneticElement The GeneticElement associated with this view.
	*/
	'use strict';
	Eplant.Views.InteractionView = function (geneticElement) {
		// Get constructor
		var constructor = Eplant.Views.InteractionView;
		
		// Call parent constructor
		Eplant.View.call(this,
			constructor.displayName,
			// Name of the View visible to the user
			constructor.viewName,
			// Hierarchy of the View
			constructor.hierarchy,
			// Magnification level of the View
			constructor.magnification,
			// Description of the View visible to the user
			constructor.description,
			// Citation template of the View
			constructor.citation,
			// URL for the active icon image
			constructor.activeIconImageURL,
			// URL for the available icon image
			constructor.availableIconImageURL,
			// URL for the unavailable icon image
			constructor.unavailableIconImageURL
		);
		
		// Attributes
		
		/**
			* The GeneticElement associated with this view
			* @type {Eplant.geneticElement}
		*/
		this.geneticElement = geneticElement;
		/**
			* Cytoscape object
			* @type {Cytoscape Object}
		*/
		this.cy = null;
		/**
			* Cytoscape configuration object. Stores Cytoscape parameters prior to initialization
			* @type {Object}
		*/
		this.cyConf = null;
		/**
			* GeneticElementDialog information
			* @type {Object}
		*/
		this.geneticElementDialogInfo = null;
		/**
			* Interaction tooltip information
			* @type {Object}
		*/
		this.interactionTooltipInfo = null;
		/**
			* Legend
			* @type {Eplant.Views.InteractionView.Legend}
		*/
		this.legend = null;
		/**
			* Event listeners
			* @type {Array}
		*/
		this.eventListeners = [];
		/**
			* FilterDialog Object
			* @type {Eplant.Views.InteractionView.FilterDialog}
		*/
		this.filterDialog = null;
		/**
			* The fitted state of the cytoscape object
			* @type {Boolean}
		*/
		this.fitted = false;
		/**
			* The eplant view mode of this view
			* @type {String}
		*/
		this.viewMode = 'cytoscape';
		/**
			* The currently active node dialog object
		*/
		this.nodeDialog = null;
		/**
			* The collection of all visible node dialogs
		*/
		this.nodeDialogs = [];
		
		// Create view-specific UI buttons
		this.createViewSpecificUIButtons();
		
		// Set Containers
		this.setCyConf();
		this.domHolder = document.createElement('div');
		$(this.domHolder).css({
			width: '100%',
			height: '100%',
			'background-color':"#ffffff"
		});
		this.domContainer = document.createElement('div');
		$(this.domContainer).css({
			width: '100%',
			height: '100%'
		});

		$(this.domHolder).append(this.domContainer);
		document.getElementById("Cytoscape_container").appendChild(this.domHolder); // Araport
		
		//$(document.body).append(this.domHolder); Araport

		// Load interaction data, then load sublocalization data 
		this.intLoader = new Eplant.Views.InteractionView.LoadInteraction(this.geneticElement);

		this.intLoader.then((function(data) {
			this.cyConf.elements.nodes = data.nodes;
			this.cyConf.elements.edges = data.edges;
			this.loadFlags = data.loadFlags;

			this.subLoader = new Eplant.Views.InteractionView.LoadSublocalization(data.nodes);
			this.subLoader.then((function(data) {
				// Update nodes
				this.cyConf.elements.nodes = data;
				// Initialize cytoscape
				$(this.domContainer).cytoscape(this.cyConf);
			}).bind(this));
		}).bind(this));



		// Create legend
		this.legend = new Eplant.Views.InteractionView.Legend(this);
		
		if(this.name) {
			$(this.labelDom).empty();
			this.viewNameDom = document.createElement('span');
			var labelText = this.geneticElement.identifier;
			if (this.geneticElement.aliases && this.geneticElement.aliases.length && this.geneticElement.aliases[0].length) {
				labelText += ' / ' + this.geneticElement.aliases.join(', ');
			}
			var text = this.name + ': ' + labelText;
			this.viewNameDom.appendChild(document.createTextNode(text));
			$(this.viewNameDom).appendTo(this.labelDom);
		}
		
		// Bind events
		this.bindEvents();
	};
	
	// Inherit parent prototype
	ZUI.Util.inheritClass(Eplant.View, Eplant.Views.InteractionView);
	Eplant.Views.InteractionView.displayName = 'Interaction Viewer';
	Eplant.Views.InteractionView.viewName = 'Interaction Viewer';
	Eplant.Views.InteractionView.hierarchy = 'genetic element';
	Eplant.Views.InteractionView.magnification = 60;
	Eplant.Views.InteractionView.description = 'Interaction viewer';
	Eplant.Views.InteractionView.citation = '';
	Eplant.Views.InteractionView.activeIconImageURL = 'app/img/active/interaction.png';
	Eplant.Views.InteractionView.availableIconImageURL = 'app/img/available/interaction.png';
	Eplant.Views.InteractionView.unavailableIconImageURL = 'app/img/unavailable/interaction.png';
	
	/** Static variables */

	Eplant.Views.InteractionView.domContainer = null;
	
	/* Static methods */
	Eplant.Views.InteractionView.getZUIDistance = function (zoom) {
		return ZUI.width / 2 / zoom;
	};

	Eplant.Views.InteractionView.getZUIPosition = function (pan) {
		return {
			x: ZUI.camera.unprojectDistance(ZUI.width / 2) - ZUI.width / 2 -
			ZUI.camera.unprojectDistance(pan.x),
			y: ZUI.camera.unprojectDistance(ZUI.height / 2) - ZUI.height / 2 -
			ZUI.camera.unprojectDistance(pan.y)
		};
	};

	Eplant.Views.InteractionView.getCyZoom = function (distance) {
		return ZUI.width / 2 / distance;
	};

	Eplant.Views.InteractionView.getCyPan = function (position) {
		return {
			x: ZUI.camera.projectDistance(ZUI.camera.unprojectDistance(ZUI.width / 2) -
			ZUI.width / 2 - position.x),
			y: ZUI.camera.projectDistance(ZUI.camera.unprojectDistance(ZUI.height / 2) -
			ZUI.height / 2 - position.y)
		};
	};
	
	/**
		* Initializes the view's pre-requisites.
		* @returns {void}
	*/
	Eplant.Views.InteractionView.initialize = function () {
		// Get DOM container and cache
		var cytoscapeContainer = document.getElementById('Cytoscape_container');
		var cytoscapeCache = document.getElementById('Cytoscape_cache');
		// Assignment to interactionView attributes
		Eplant.Views.InteractionView.domContainer = cytoscapeContainer;
		Eplant.Views.InteractionView.domCacheContainer = cytoscapeCache;
	};
	
	/**
		* Active callback method.
		*
		* @override
	*/
	Eplant.Views.InteractionView.prototype.active = function () {
		// Call parent method
		Eplant.View.prototype.active.call(this);
		// Start Cytoscape
		//if (this.isLoadedData) {
			$(this.domHolder).appendTo(Eplant.Views.InteractionView.domContainer);
			this.fit();
			this.cy.resize();
		//}
		
		// Attach legend
		if (this.legend.isVisible) {
			this.legend.attach();
		}

		// Attach data filtering label
		if (this.filterDialog && this.filterDialog.filterLabelVisible) {
			this.filterDialog.attachDataFilterLabel();
		}
		// Attach recursive label
		if (!this.loadFlags.recursive) {
			$('#nonRecursiveLabel').show();
		}
	};
	
	/**
		* Inactive callback method.
		*
		* @override
	*/
	Eplant.Views.InteractionView.prototype.inactive = function () {
		// Call parent method
		Eplant.View.prototype.inactive.call(this);
		$(this.domHolder).appendTo(Eplant.Views.InteractionView.domCacheContainer);
		
		// Save layout
		if (this.cy) {
			this.cyConf.layout.name = 'preset';
		}
		
		if (this.tooltip) {
			this.tooltip.close();
			this.tooltip = null;
		}
		
		// Detach legend
		if (this.legend.isVisible) {
			this.legend.detach();
		}
		
		// Detach data label
		if (this.filterDialog && this.filterDialog.filterLabelVisible) {
			this.filterDialog.detachDataFilterLabel();
		}
		// Detach recursive label
		if (!this.loadFlags.recursive) {
			$('#nonRecursiveLabel').hide();
		}
		
		// Close all node dialogs
		if(this.nodeDialog) {
			this.nodeDialog.close();
		}

		if (this.nodeDialogs) {
			for (var n = 0; n < this.nodeDialogs.length; n = n + 1) {
				if (this.nodeDialogs[n]) {
					this.nodeDialogs[n].close();
				}
			}
		}
		this.nodeDialog = null;
		this.nodeDialogs = [];
		
		// Stop passing input events to Cytoscape
		ZUI.passInputEvent = null;
		this.cyConf.zoom = this.zoom;
		this.cyConf.pan = this.pan;
	};
	
	/**
		* Draw callback method.
		*
		* @override
	*/
	Eplant.Views.InteractionView.prototype.draw = function () {
		/* Call parent method */
		Eplant.View.prototype.draw.call(this);
		
		/* Draw annotations */
		if (this.cy) {
			var nodes = this.cy.nodes();
			for (var n = 0; n < nodes.length; n = n + 1) {
				var node = nodes[n];
				if (node._private.data.annotation && node.visible()) {
					node._private.data.annotation.draw();
				}
			}
		}
	};
	
	/**
		* Clean up view.
		*
		* @override
	*/
	Eplant.Views.InteractionView.prototype.remove = function () {
		// Call parent method
		Eplant.View.prototype.remove.call(this);
		
		
		// Remove EventListeners
		for (var n = 0; n < this.eventListeners.length; n = n + 1) {
			var eventListener = this.eventListeners[n];
			ZUI.removeEventListener(eventListener);
		}
	};
	
	/**
		* Creates view-specific UI buttons.
		* @returns {void}
	*/
	Eplant.Views.InteractionView.prototype.createViewSpecificUIButtons = function () {
		// Filter
		this.filterButton = new Eplant.ViewSpecificUIButton(
		// imageSource
		'app/img/filter-interaction.png',
		// description
		'Filter interactions.',
		function (data) {
			if (data.interactionView.filterDialog) {
				data.interactionView.filterDialog.createDialog();
				} else {
				// Create Filter Dialog
				var filterDialog = new Eplant.Views.InteractionView.FilterDialog(
				data.interactionView);
				data.interactionView.filterDialog = filterDialog;
			}
		}, {interactionView: this});
		this.viewSpecificUIButtons.push(this.filterButton);
		
		// Legend
		var viewSpecificUIButton = new Eplant.ViewSpecificUIButton(
		// imageSource
		'app/img/legend.png',
		// description
		'Toggle legend.',
		function (data) {
			// Check whether legend is showing
			if (data.interactionView.legend.isVisible) {
				// Hide legend
				data.interactionView.legend.hide();
				} else {
				// Show legend
				data.interactionView.legend.show();
			}
		}, {interactionView: this}
		);
		this.viewSpecificUIButtons.push(viewSpecificUIButton);
	};
	
	/**
		* Sets Cytoscape configurations.
		* @returns {void}
	*/
	Eplant.Views.InteractionView.prototype.setCyConf = function () {
		this.cyConf = { 
			wheelSensitivity: 0.2,
			layout: { name : 'null' },
			style: this.setCytoscapeStyles(),
			elements: {
				nodes: [],
				edges: []
			}
		};

		// Ready event handler
		this.cyConf.ready = $.proxy(function () {
			// Save Cytoscape 
			this.cy = $(this.domContainer).cytoscape('get');
			
			// Use Cytoscape Automove to make protein compounds move in sync
			var proteinPairMove = this.cy.automove({
				nodesMatching: function (node) {
					var type = node._private.data.id.substring(9);
					return type === 'PROTEIN_NODE' || type === 'QUERY_NODE';
				},
				reposition: function (node) {
					var pos = node.position();
					// Set the back node to have the same position
					var backNode = node.siblings();
					backNode.position(pos);
					return pos;
				},
				when: 'matching'
			});

			// Save query node to interactions view
			var querySelector = '#' + this.geneticElement.identifier.toUpperCase() + 'QUERY_NODE';
			this.queryNode = this.cy.nodes(querySelector);
			
			// Update annotations
			for (var n = 0; n < this.cyConf.elements.nodes.length; n = n + 1) {
				var node = this.cyConf.elements.nodes[n];
				if (node.data.annotation) {
					node.data.annotation.update();
				}
			}
			// Listen for zoom events
			this.cy.on('zoom', $.proxy(function () {
				// Synchronize with ZUI camera distance
				ZUI.camera.setDistance(Eplant.Views.InteractionView.getZUIDistance(this.cy.zoom()));
				this.zoom = this.cy.zoom();
				this.cyConf.zoom = this.zoom;
			}, this));

			// Listen for pan events
			this.cy.on('pan', $.proxy(function () {
				// Synchronize with ZUI camera position
				var position = Eplant.Views.InteractionView.getZUIPosition(this.cy.pan());
				ZUI.camera.setPosition(
					position.x,
					position.y
				);
				this.pan = this.cy.pan();
				this.cyConf.pan = this.pan;
			}, this));
			
			// Listen for mouseover events on nodes
			this.cy.on('mouseover', 'node', $.proxy(function (event) {
				var nodeID = event.cyTarget.data('id');
				// Check that the node is not a compound node
				if (nodeID !== 'COMPOUND_DNA' && nodeID !== 'COMPOUND_PROTEIN') {
					if (nodeID.substring(0,3) === 'chr') {
						this.chrNodeMouseOverHandler(this, event);
					} else {
						this.nodeMouseOverHandler(this, event);
					}
				}
			}, this));
			// Listen for mouseout events on nodes
			this.cy.on('mouseout', 'node', $.proxy(function (event) {
				var nodeID = event.cyTarget.data('id');
				if (nodeID !== 'COMPOUND_DNA' && nodeID !== 'COMPOUND_PROTEIN') {
					this.nodeMouseOutHandler(this, event);
				}
			}, this));
			// Listen for tap events on nodes			
			this.cy.on('tap', 'node', $.proxy(function (event) {
				var nodeID = event.cyTarget.data('id');
				if (nodeID !== 'COMPOUND_DNA' && nodeID !== 'COMPOUND_PROTEIN') {
					if (nodeID.substring(0,3) !== 'chr') {
						this.nodeMouseTapHandler(this, event);
					}
				}
			}, this));
			
			// Node reposition handler
			this.cy.on('position', 'node', $.proxy(function (event) {
				// Get node
				var node = event.cyTarget;
				
				// Update annotation position
				var annotation = node._private.data.annotation;
				if (annotation) {
					annotation.update();
				}
			}, this));
			
			// Handle edge events
			this.edgeEventHandler();
			
			// Set layout
			if (!this.loadFlags.empty) {
				var layout = new Eplant.Views.InteractionView.Layout(this, this.loadFinish.bind(this));
			} else {
				this.cy.nodes('#noInteractionLabel').position({ x: 0, y: 100 });
				this.loadFinish();
			}

		}, this);
	};

	/**
	 * Generate cytoscape stylesheet
	 * @returns {Object} Cytoscape stylesheet containing set styles
	 */
	Eplant.Views.InteractionView.prototype.setCytoscapeStyles = function () {
		var styleSheet = cytoscape.stylesheet()
		.selector('node')
		.css({
			'text-background-shape': 'roundrectangle',
			'text-background-color': '#B4B4B4',
			'text-background-opacity': 0.8,
			'background-color': '#B4B4B4',
			'font-size': '11px',
			'font-weight': 'bold',
			'text-halign': 'center',
			'border-width': '0px',
		})
		.selector('.compound-top')
		.css({
			shape: 'roundrectangle',
			'background-color': '#F3F3F3',
			'text-background-color': '#FFF',
			'text-wrap': 'wrap',
			color: '#000',
			'font-size': 13,
			'font-weight': 'normal',
			'text-outline-width': '0px',
			'text-valign': 'top',
		})
		.selector('#COMPOUND_DNA')
		.css({
			'padding': '100px 5px 5px 0px',
			'background-opacity': '0.4',
			'text-background-opacity': '0',
			content: 'Protein-DNA\nInteractions',
		})
		.selector('#COMPOUND_PROTEIN')
		.css({
			'padding': '100px 25px 25px 0px',
			'background-opacity': '0',
			'text-background-opacity': '1',
			content: 'Protein-Protein\nInteractions',
		})
		.selector('.protein-compound')
		.css({
			'background-opacity': 0,
			'events': 'no'
		})
		.selector('.protein-back')
		.css({
			'height': 'data(height)',
			'width': 'data(width)',
			'pie-size': '100%',
			'pie-1-background-color': 'data(pie1Colour)',
			'pie-1-background-size': 'data(pie1Size)',
			'pie-1-background-opacity': 1,
			'pie-2-background-color': 'data(pie2Colour)',
			'pie-2-background-size': 'data(pie2Size)',
			'pie-2-background-opacity': 1,
			'pie-3-background-color': 'data(pie3Colour)',
			'pie-3-background-size': 'data(pie3Size)',
			'pie-3-background-opacity': 1,
			'pie-4-background-color': 'data(pie4Colour)',
			'pie-4-background-size': 'data(pie4Size)',
			'pie-4-background-opacity': 1,
			'border-width': 'data(borderWidth)',
			'border-color': '#99CC00', 
			'events': 'no',
		})
		.selector('.protein-node')
		.css({
			'height': '36px',
			'width': '36px',
			'padding': '3px 3px 3px 3px',
			'text-valign': 'center',
			'content': 'data(content)',
			'events': 'yes'
		})
		.selector('[id $= "QUERY_BACK"]')
		.css({
			height: '60px',
			width: '60px',
		})
		.selector('[id $= "QUERY_NODE"]')
		.css({
			height: '48px',
			width: '48px',
			'font-size': '13px',
		})
		.selector('.dna-node')
		.css({
			shape: 'square',
			width: '34px',
			height: '34px',
			'border-width': '4px',
			'padding': '3px 3px 3px 3px',
			'border-color': '#030303',
			'text-valign': 'center',
			'content': 'data(content)',
		})
		.selector('edge')
		.css({
			width: 'data(size)',
			'line-style': 'data(lineStyle)',
			'line-color': 'data(lineColor)',
			'control-point-distance': '50px',
			'control-point-weight': '0.5'
		})
		.selector('.protein-edge')
		.css({
			'curve-style': 'bezier',
			'mid-target-arrow-shape': 'none',
		})
		.selector('.dna-edge')
		.css({
			'curve-style': 'unbundled-bezier',
			'mid-target-arrow-shape': 'triangle',
			'mid-target-arrow-color': 'data(lineColor)',
		})	
		.selector('.chr-edge')
		.css({
			width: '6',
			'line-style': 'solid',
			'line-color': '#669900',
			'curve-style': 'unbundled-bezier',
			'mid-target-arrow-shape': 'triangle',
			'mid-target-arrow-color': '#669900',
			'control-point-distance': '50px',
			'control-point-weight': '0.5'
		})
		.selector('.loaded')
		.css({
			'background-color': '#3C3C3C',
			'text-background-color': '#3C3C3C',
			color: '#FFFFFF'
		})
		.selector('#noInteractionLabel')
		.css({
			shape: 'circle',
			content: 'No interactions found for this gene.',
			width: '1px',
			height: '1px',
			color: '#000',
			'text-background-opacity': '0',
			'font-size': 15,
		})
		return styleSheet;
	};
	
	/**
		* Creates Node Dialogs using the Eplant Genetic Element Dialogs
		* @param {Eplant.GeneticElement} geneticElement The gene which the dialog is created for
		* @param {Object} node The cytoscape node object which the dialog is created for
		* @param {Object} data Additional loading data for this node dialog
		* @returns {void}
	*/
	Eplant.Views.InteractionView.prototype.createNodeDialog = function (geneticElement, node,
	data) {
		// Get node position
		var nodePosition = node.renderedPosition();
		
		var positionDialog = {
			x: nodePosition.x + 200,
			y: nodePosition.y - 120 - node.renderedHeight()
		};
		
		// Use specified position if avaiable
		if (data && data.position) {
			positionDialog = {
				x: data.position.x,
				y: data.position.y
			};
		}
		
		var orientation = null;
		
		// Set orientation if dialog is created by a click/tap event
		if (data && data.orientation) {
			orientation = data.orientation;
		}
		
		// Create GeneticElementDialog
		var geneticElementDialog = new Eplant.GeneticElementDialog(
			geneticElement,
			positionDialog.x,
			positionDialog.y,
			orientation
		);
		
		geneticElementDialog.isActive = true;
		// Get the rendered height of the node dialog with all its contents
		var nodeDialogHeight = $(geneticElementDialog.domContainer).height();
		// Get the DOM element containing the node dialog
		var nodeDialogDOM = $(geneticElementDialog.dialog.DOM.wrap[0]);
		// Set height by distance from dialog bottom to node top
		nodeDialogDOM.css('top', nodePosition.y - nodeDialogHeight);

		// Move dialog down if height exceeds bounds
		if (positionDialog.y - nodeDialogHeight <= 0) {
			nodeDialogDOM.css('top', "20%");
		}
		return geneticElementDialog;
	};

		/**
		* Creates Chromosme Node Dialogs using the Eplant Genetic Element Dialogs
		* @param {Object} node The cytoscape node object which the dialog is created for
		* @returns {void}
	*/
	Eplant.Views.InteractionView.prototype.createChrNodeDialog = function (node) {
		// Get node position
		var nodePosition = node.renderedPosition();
		
		var positionDialog = {
			x: nodePosition.x + 200,
			y: nodePosition.y - node.renderedHeight()
		};

		// Create GeneticElementDialog
		var chrDialog = new Eplant.Views.InteractionView.ChromosomeDialog(
			node._private.data.id.substring(3, 4),
			node._private.data.genes,
			positionDialog.x,
			positionDialog.y
		);

		return chrDialog;
	};

	/**
		* Handles all node mouseover events. Creates a node dialog based on GeneticElement information,
		* and initializes the GeneticElement if not pre-existing. Closes any previously existing dialog
		*
		* @param {Eplant.Views.InteractionView} scope The execution context for this mouse over event
		* @param {Object} event The event object
		* @returns {void}
	*/
	Eplant.Views.InteractionView.prototype.nodeMouseOverHandler = function (scope, event) {
		// Change cursor
		ZUI.container.style.cursor = 'pointer';
		// Get node
		var node = event.cyTarget;
		// Track mouseover status
		node._private.data.mousedOver = true;
		// Highlight node
		node.addClass('highlight');
		// Add timer to detect true user intention to view dialog
		this.nodeDialogStartTimer = setTimeout(function () {
			// Close any pre-existing nodeDialogs
			if (scope.nodeDialog) {
				scope.nodeDialog.close();
				scope.nodeDialog.isActive = false;
				scope.nodeDialog = null;
			}
			// Open GeneticElementDialog
			var geneticElement = node._private.data.geneticElement;
			// Check if GeneticElement exists
			if (geneticElement) {
				var nodeDialog = geneticElement.geneticElementDialog;
				// Check that there are no currently active genetic element dialogs
				if (!nodeDialog && !scope.nodeDialog) {
					nodeDialog = scope.createNodeDialog(geneticElement, node);
					scope.nodeDialog = nodeDialog;
				}
				// Call back node if not a trans node
			} else if (node._private.data.id.substring(9) !== 'TRANS') {
				var options = {};
				options.callback = $.proxy(function (cbGeneticElement) {
					// Attach GeneticElement to node
					node._private.data.geneticElement = cbGeneticElement;
					var cdNodeDialog = cbGeneticElement.geneticElementDialog;
					// Make sure GeneticElementDialog is not already open and is still moused over
					if (!cdNodeDialog && !scope.nodeDialog && node._private.data.mousedOver) {
						cdNodeDialog = scope.createNodeDialog(cbGeneticElement, node);
						scope.nodeDialog = cbGeneticElement.geneticElementDialog;
					}
				}, scope);
				// GeneticElement doesn't exist, create it
				scope.geneticElement.species.loadGeneticElementByIdentifier(
				node.data('id').substring(0, 9), options);
			}
		}, 250);
	};

	/**
	 * Handles all node mouseover events. Creates a node dialog based on GeneticElement information,
	 * and initializes the GeneticElement if not pre-existing. Closes any previously existing dialog
	 *
	 * @param {Eplant.Views.InteractionView} scope The execution context for this mouse over event
	 * @param {Object} event The event object
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.prototype.chrNodeMouseOverHandler = function (scope, event) {
		// Change cursor
		ZUI.container.style.cursor = 'pointer';
		// Get node
		var node = event.cyTarget;
		// Track mouseover status
		node._private.data.mousedOver = true;

		// Add timer to detect true user intention to view dialog
		this.nodeDialogStartTimer = setTimeout(function () {
			// Close any pre-existing nodeDialogs
			if (scope.nodeDialog) {
				scope.nodeDialog.close();
				scope.nodeDialog.isActive = false;
				scope.nodeDialog = null;
			}
			scope.createChrNodeDialog(node);
		}, 250);
	};

	/**
		* Handles mouse out events on nodes. Closes node dialogs after a delay, and sets makes them
		* invisible to the code.
		*
		* @param {Eplant.Views.InteractionView} scope The execution context (InteractionView object)
		* @param {Object} event The event object which triggered this function
		* @return {void}
	*/
	Eplant.Views.InteractionView.prototype.nodeMouseOutHandler = function (scope, event) {
		// Restore cursor
		ZUI.container.style.cursor = 'default';
		// Get node
		var node = event.cyTarget;
		// Remove node highlight
		node.removeClass('highlight');
		
		// Track mouseover status
		node._private.data.mousedOver = false;
		
		// Clear startup timer
		clearTimeout(this.nodeDialogStartTimer);
		
		// Get genetic element
		var geneticElement = node._private.data.geneticElement;
		
		// Check if genetic element exists and is not pinned
		if (geneticElement && geneticElement.geneticElementDialog
		&& !geneticElement.geneticElementDialog.pinned) {
			// Get dialog
			var dialog = geneticElement.geneticElementDialog;
			// Start close timer
			var timer = setTimeout(function () {
				// Check that the node dialog is still active
				if (dialog.isActive) {
					dialog.close();
					dialog.isActive = false;
					// Set active node dialog to null
					scope.nodeDialog = null;
				}
			}, 500);
			// Get top level container
			var topContainer = $(dialog.domContainer).parents().eq(10);
			// Stop close timer if mouse in dialog
			topContainer.mouseenter($.proxy(function () {
				clearTimeout(timer);
				clearTimeout(this.edgeStationaryTimer);
				if (this.tooltip) {
					this.tooltip.close();
					this.tooltip = null;
				}
			}, this));
			// Reset close timer if mouse leaves dialog
			topContainer.mouseleave(function () {
				timer = setTimeout(function () {
					// Check that the node dialog is still active
					if (dialog.isActive) {
						dialog.close();
						dialog.isActive = false;
						// Reset active node dialog
						scope.nodeDialog = null;
					}
				}, 250);
			});
		}
	};
	
	/**
		* Handles mouse tap events on nodes. Creates a node dialog which does not disappear unless the
		* user specifically closes it.
		*
		* @param {Eplant.Views.InteractionView} scope The execution context
		* @param {Object} event The event which triggered this handler
		* @return {void}
	*/
	Eplant.Views.InteractionView.prototype.nodeMouseTapHandler = function (scope, event) {
		// Get node
		var node = event.cyTarget;
		
		// Get GeneticElement
		var geneticElement = node._private.data.geneticElement;
		
		if (geneticElement) {
			// Make sure GeneticElementDialog is not already open
			if (!geneticElement.geneticElementDialog) {
				var data = {};
				// Get node position
				var position = node.position();
				
				// Get orientation
				data.orientation = position.x > ZUI.width / 2 ? 'left' : 'right';
				
				// Create dialog
				geneticElement.geneticElementDialog = scope.createNodeDialog(geneticElement,
				node, data);
			}
		} else {
			var options = {};
			// Callback for loading node
			options.callback = $.proxy(function(geneticElement) {
				// Get node
				var node = scope.cy.nodes('[id *= "' + geneticElement.identifier + '"]')[0];
				
				// Attach GeneticElement to node
				node._private.data.geneticElement = geneticElement;
				
				// Make sure node is still highlighted and GeneticElementDialog is not already open
				if (node.hasClass('highlight') && !geneticElement.geneticElementDialog) {
					var data = {};
					// Get node position
					var position = node.position();
					
					// Get orientation
					data.orientation = position.x > ZUI.width / 2 ? 'left' : 'right';
					
					// Create dialog
					geneticElement.geneticElementDialog = scope.createNodeDialog(geneticElement,
					node, data);
				}
			}, scope);
			
			// Load the genetic element, and create a dialog afterwards
			scope.geneticElement.species.loadGeneticElementByIdentifier(
			node.data("id").substring(0, 9), options);
		}
		
		// Check whether GeneticElement is created
		if (geneticElement) {
			// Check whether GeneticElementDialog is created
			if (geneticElement.geneticElementDialog) {
				// Pin
				geneticElement.geneticElementDialog.pinned = true;
				// Disable node dialog closing
				geneticElement.geneticElementDialog.isActive = false;
				this.nodeDialogs.push(geneticElement.geneticElementDialog);
				} else {
				// Set GeneticElementDialog information
				this.geneticElementDialogInfo = {
					finish: ZUI.appStatus.progress,
					node: node,
					pin: true
				};
			}
			} else {
			var options = {};
			// Call back on data loading
			options.callback = $.proxy(function (geneticElement) {
				// Get node
				var node = scope.cy.nodes('[id *= "' + geneticElement.identifier + '"]')[0];
				
				// Attach GeneticElement to node
				node._private.data.geneticElement = geneticElement;
				
				// Check whether GeneticElementDialog is created
				if (geneticElement.geneticElementDialog) {
					// Pin
					geneticElement.geneticElementDialog.pinned = true;
					geneticElement.geneticElementDialog.isActive = false;
					scope.nodeDialogs.push(geneticElement.geneticElementDialog);
					} else {
					// Set GeneticElementDialog information
					scope.geneticElementDialogInfo = {
						finish: ZUI.appStatus.progress,
						node: node,
						pin: true
					};
				}
			}, scope);
			// Load data
			scope.geneticElement.species.loadGeneticElementByIdentifier(
			node.data('id').substring(0, 9), options);
		}
		this.nodeDialog = null;
	};
	
	/**
		* Handles all events bound to interaction edges
		* @return {void}
	*/
	Eplant.Views.InteractionView.prototype.edgeEventHandler = function () {
		// Timer for exit event
		var exitTimer;
		// Timer which tracks intention for tooltip creation
		this.edgeStationaryTimer;
		// Sets scope for async timeout functions
		var _this = this;
		// Tracks mouse position in between mouseover and tooltip creation events
		var currCoords = null;
		// Tracks the edge with an active tooltip by index
		var currIndex = null;
		
		// Listen for pointer events on edges
		this.cy.on('mouseover', 'edge', $.proxy(function (event) {
			// No tooltip on chr edges
			if (event.cyTarget._private.classes['chr-edge']) {
				return false;
			}
			// Start a timer to determine if user intends to hover on edge
			_this.edgeStationaryTimer = setTimeout(function () {
				// Change cursor
				ZUI.container.style.cursor = 'pointer';

				// Get data
				var edge = event.cyTarget;
				var interaction = edge._private.data;

				// Remove previous tooltip and stop timer
				if (_this.tooltip) {
					clearTimeout(exitTimer);
					_this.tooltip.close();
					_this.tooltip = null;
				}
				
				// Instantiate mouse position
				var mouseX = null;
				var mouseY = null;
				
				// Set mouse position
				if (currCoords) {
					mouseX = currCoords.x;
					mouseY = currCoords.y - 5;
				} else {
					mouseX = event.originalEvent.clientX;
					mouseY = event.originalEvent.clientY - 5;
				}
			
				// Create tooltip
				var tooltip = new Eplant.Views.InteractionView.EdgeInfoTooltip({
					// Tooltip content
					content: edge._private.data.tooltipContent,
					// Set position
					x: mouseX,
					y: mouseY
				}, interaction);
				// Save tooltip
				_this.tooltip = tooltip;
				// Reset temporary coordinates
				currCoords = null;
				// Track which interaction edge the tooltip is attached to
				currIndex = event.cyTarget._private.index;
			}, 350);
		}, this));
		
		// Listen for edge mouse out events
		this.cy.on('mouseout', 'edge', $.proxy(function () {
			// Clear intention timer if user exits edge
			clearTimeout(_this.edgeStationaryTimer);
			// Verify tooltip exists
			if (this.tooltip) {
				// Start closedown timer
				exitTimer = setTimeout(function () {
					// Check if tooltip still exists
					if (_this.tooltip) {
						_this.tooltip.close();
						_this.tooltip = null;
						// Reset edge index tracker
						currIndex = null;
					}
				}, 250);
				
				// Stop close timer if mouse in tooltip
				$(_this.tooltip.domContainer).parent().mouseenter(function () {
					clearTimeout(exitTimer);
				});
				
				// Close tooltip if mouse leaves tooltip
				$(_this.tooltip.domContainer).parent().mouseleave(function () {
					_this.tooltip.close();
					_this.tooltip = null;
					// Reset edge index tracker
					currIndex = null;
				});
			}
		}, this));
		
		// Listen for mouse move to reposition tooltip
		this.cy.on('mousemove', 'edge', $.proxy(function (event) {
			// Verifies that the tooltip exists, and the event is executing on the correct edge
			if (this.tooltip && event.cyTarget._private.index === currIndex) {
				this.tooltip.changeTooltipPosition(event.originalEvent);
				} else {
				// Track mouse position for usage in updating tooltip position when it initializes
				currCoords = event.originalEvent;
			}
		}, this));
	};

	/**
		* Binds events.
		* @returns {void}
	*/
	Eplant.Views.InteractionView.prototype.bindEvents = function () {
		// load-views
		var eventListenerLoad = new ZUI.EventListener('load-views', null,
		function (event, eventData, listenerData) {
			// Check the target GeneticElement Species is associated with InteractionView
			if (listenerData.interactionView.geneticElement.species === event.target.species) {
				// Check that Cytoscape is ready, access node via Cytoscape
				if (listenerData.interactionView.cy) {
					// Check whether the GeneticElement is part of the interaction network
					var loadedNodes = listenerData.interactionView.cy.nodes('[id ^= "' +
					event.target.identifier.toUpperCase() + '"]');
					
					for (var n = 0; n < loadedNodes.length; n = n + 1) {
						var node = loadedNodes[n];
						
						// Change node style
						node.addClass('loaded');
						
						// Create annotation
						var annotation = new Eplant.Views.InteractionView.Annotation(
						event.target, listenerData.interactionView);
						node._private.data.annotation = annotation;
					}
					} else {
					// Cytoscape is not ready, access node via Cytoscape configurations
					// Check whether the GeneticElement is part of the interaction network
					var nodes = listenerData.interactionView.cyConf.elements.nodes;
					var loadedNodes = [];
					for (var n = 0; n < nodes.length; n = n + 1) {
						if (nodes[n].data.id.toUpperCase().substring(0, 9) ===
						event.target.identifier.toUpperCase()) {
							loadedNodes.push(nodes[n]);
						}
					}
					
					for (var n = 0; n < loadedNodes.length; n = n + 1) {
						var node = loadedNodes[n];
						
						// Add node class
						node.classes = node.classes + ' loaded';
						// Create annotation
						var annotation = new Eplant.Views.InteractionView.Annotation(
						event.target, listenerData.interactionView);
						node.data.annotation = annotation;
					}
				}
			}
		}, {interactionView: this});
		this.eventListeners.push(eventListenerLoad);
		ZUI.addEventListener(eventListenerLoad);
		
		// drop-views
		var eventListenerDrop = new ZUI.EventListener('drop-views', null,
		function (event, eventData, listenerData) {
			// Check the target GeneticElement parent Species is associated with InteractionView
			if (listenerData.interactionView.geneticElement.species === event.target.species) {
				if (listenerData.interactionView.cy) {
					// Cytoscape is ready, access node via Cytoscape
					// Check whether the GeneticElement is part of the interaction network
					var loadedNodes = listenerData.interactionView.cy.nodes('[id ^= "' +
					event.target.identifier.toUpperCase() + '"]');
					
					for (var n = 0; n < loadedNodes.length; n = n + 1) {
						var node = loadedNodes[n];
						
						// Remove node loaded class
						node.removeClass('loaded');
						
						// Remove annotation
						if (node._private.data.annotation) {
							node._private.data.annotation.remove();
							node._private.data.annotation = null;
						}
					}
					} else {
					// Cytoscape is not ready, access node via Cytoscape configurations
					// Check whether the GeneticElement is part of the interaction network
					var nodes = listenerData.interactionView.cyConf.elements.nodes;
					var loadedNodes;
					for (var n = 0; n < nodes.length; n = n + 1) {
						if (nodes[n].data.id.toUpperCase().substring(0, 9) ===
						event.target.identifier.toUpperCase()) {
							loadedNodes.push(nodes[n]);
						}
					}
					
					for (var n = 0; n < loadedNodes.length; n = n + 1) {
						var node = loadedNodes[n];
						// Change node style
						node.classes.replace('loaded', '');
						// Remove annotation
						if (node.data.annotation) {
							node.data.annotation.remove();
							node.data.annotation = null;
						}
					}
				}
			}
		}, {interactionView: this});
		this.eventListeners.push(eventListenerDrop);
		ZUI.addEventListener(eventListenerDrop);
		
		// mouseover-geneticElementPanel-item
		var eventListenerMouseOver = new ZUI.EventListener('mouseover-geneticElementPanel-item',
		null, function (event, eventData, listenerData) {
			// Check the target GeneticElement parent Species is associated with InteractionView
			if (listenerData.interactionView.geneticElement.species === event.target.species) {
				if (listenerData.interactionView.cy) {
					// Highlight node
					listenerData.interactionView.cy.$('node#' +
					event.target.identifier.toUpperCase()).addClass('highlight');
				}
			}
		}, {interactionView: this});
		this.eventListeners.push(eventListenerMouseOver);
		ZUI.addEventListener(eventListenerMouseOver);
		
		// mouseout-geneticElementPanel-item
		var eventListenerMouseOut = new ZUI.EventListener('mouseout-geneticElementPanel-item', null,
		function (event, eventData, listenerData) {
			// Check the target GeneticElement parent Species is associated with InteractionView
			if (listenerData.interactionView.geneticElement.species === event.target.species) {
				if (listenerData.interactionView.cy) {
					// Remove node highlight
					listenerData.interactionView.cy.$('node#' +
					event.target.identifier.toUpperCase()).removeClass('highlight');
				}
			}
		}, {interactionView: this});
		this.eventListeners.push(eventListenerMouseOut);
		ZUI.addEventListener(eventListenerMouseOut);
		window.addEventListener('resize', $.proxy(this.resize, this), false);
	};
	
	/**
		* Resizes the cytoscape window to fit all elements
		* @return {void}
	*/
	Eplant.Views.InteractionView.prototype.resize = function () {
		this.fit();
	};
	
	/**
		* Grabs the View's screen.
		*
		* @override
		* @return {DOMString} The data url for the canvas
	*/
	Eplant.Views.InteractionView.prototype.getViewScreen = function () {
		// Get Cytoscape canvases
		var canvases = Eplant.Views.InteractionView.domContainer.getElementsByTagName('canvas');
		
		// Sort canvases by z-index
		Array(canvases).sort(function (a, b) {
			return a.style.zIndex - b.style.zIndex;
		});
		
		// Create temporary canvas for drawing the combined image
		var canvas = document.createElement('canvas');
		canvas.width = ZUI.width;
		canvas.height = ZUI.height;
		var context = canvas.getContext('2d');
		
		// Combine Cytoscape canvases
		for (var n = 0; n < canvases.length; n = n + 1) {
			context.drawImage(canvases[n], 0, 0);
		}
		
		// Return data URL
		return canvas.toDataURL();
	};
	
	/**
		* Returns The exit-out animation configuration.
		*
		* @override
		* @return {Object} The exit-out animation configuration.
	*/
	Eplant.Views.InteractionView.prototype.getExitOutAnimationConfig = function () {
		var config = Eplant.View.prototype.getExitOutAnimationConfig.call(this);
		config.begin = $.proxy(function () {
			this.cy.animate({
				fit: {
					padding: 10000
				}
			}, {
				duration: 1000
			});
		}, this);
		return config;
	};
	
	/**
		* Returns The enter-out animation configuration.
		*
		* @override
		* @return {Object} The enter-out animation configuration.
	*/
	Eplant.Views.InteractionView.prototype.getEnterOutAnimationConfig = function () {
		var config = Eplant.View.prototype.getEnterOutAnimationConfig.call(this);
		config.begin = $.proxy(function () {
			this.cy.fit(-10000);
			if (this.loadFlags.empty) {
				this.cy.animate({
					fit: {
						padding: 150
					}
				}, {
					duration: 1000
				});
			} else {
				this.cy.animate({
					fit: {
						padding: 100
					}
				}, {
					duration: 1000
				});
			}
		}, this);
		return config;
	};
	
	/**
		* Returns The exit-in animation configuration.
		*
		* @override
		* @return {Object} The exit-in animation configuration.
	*/
	Eplant.Views.InteractionView.prototype.getExitInAnimationConfig = function () {
		var config = Eplant.View.prototype.getExitInAnimationConfig.call(this);
		config.begin = $.proxy(function () {
			this.cy.animate({
				fit: {
					padding: -10000
				}
			}, {
				duration: 1000
			});
		}, this);
		return config;
	};
	
	/**
		* Returns The enter-in animation configuration.
		*
		* @override
		* @return {Object} The enter-in animation configuration.
	*/
	Eplant.Views.InteractionView.prototype.getEnterInAnimationConfig = function () {
		var config = Eplant.View.prototype.getEnterInAnimationConfig.call(this);
		config.begin = $.proxy(function () {
			this.cy.fit(10000);
			if (this.loadFlags.empty) {
				this.cy.animate({
					fit: {
						padding: 150
					}
				}, {
					duration: 1000
				});
			} else {
				this.cy.animate({
					fit: {
						padding: 100
					}
				}, {
					duration: 1000
				});
			}
		}, this);
		return config;
	};
	
	Eplant.Views.InteractionView.prototype.zoomIn = function () {
		if (this.cy) {
			this.zoom = this.zoom + 0.05;
			this.cy.zoom({
				level: this.zoom,
				position: this.queryNode.position()
			});
		}
	};
	
	Eplant.Views.InteractionView.prototype.zoomOut = function () {
		if (this.cy) {
			this.zoom = this.zoom - 0.05;
			this.cy.zoom({
				level: this.zoom,
				position: this.queryNode.position()
			});
		}
	};
	
	Eplant.Views.InteractionView.prototype.fit = function () {
		if (ZUI.activeView === this) {
			if (this.cy) {
				if (this.loadFlags.empty) {
					this.cy.fit(150);
				} else {
					this.cy.fit(100);
				}
				
				this.zoom = this.cy.zoom();
				this.pan = this.cy.pan();
			}
		}
	};
}());
