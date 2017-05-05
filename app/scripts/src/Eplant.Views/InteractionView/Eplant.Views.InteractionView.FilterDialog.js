(function () {
	/* global Eplant*/

	/**
	 * Eplant.Views.InteractionView.FilterDialog class
	 * Coded by Ian Shi
	 * UI designed by Jamie Waese
	 *
	 * Dialog for user to choose filter settings for an interaction view.
	 *
	 * @constructor
	 * @param {Eplant.Views.InteractionView} interactionView The InteractionView that owns dialog.
	 */
	'use strict';
	Eplant.Views.InteractionView.FilterDialog = function (interactionView) {
		/**
		 * The interaction view that owns this dialog
		 * @type {Eplant.Views.InteractionView}
		 */
		this.interactionView = interactionView;
		/**
		 * The status of interaction filters
		 * @type {List}
		 */
		this.filterStatus = [false, false, false, false, false, false, false, false];
		/**
		 * The value of the EPPI correlation spinner
		 * @type {Number}
		 */
		this.EPPICorrValue = null;
		/**
		 * The value of the correlation spinner
		 * @type {Number}
		 */
		this.correlationValue = null;
		/**
		 * DOM container element
		 * @type {HTMLElement}
		 */
		this.domContainer = null;
		/**
		 * DOM element for EPPI correlation input
		 * @type {HTMLElement}
		 */
		this.domEPPICorr = null;
		/**
		 * DOM element for correlation input
		 * @type {HTMLElement}
		 */
		this.domCorrelation = null;
		/**
		 * DOM element for confidence checkbox
		 * @type {HTMLElementCheckbox}
		 */
		this.domEPPICorrCheckbox = null;
		/**
		 * DOM element for correlation checkbox
		 * @type {HTMLElementCheckbox}
		 */
		this.domCorrelationCheckbox = null;
		/**
		 * DOM element for experimental protein-protein interaction checkbox
		 * @type {HTMLElementCheckbox}
		 */
		this.domEPPICheckbox = null;
		/**
		 * DOM element for predicted protein-protein interactions checkbox
		 * @type {HTMLElementCheckbox}
		 */
		this.domPPPICheckbox = null;
		/**
		 * DOM element for experimental protein-DNA interactions checkbox
		 * @type {HTMLElementCheckbox}
		 */
		this.domEPDICheckbox = null;
		/**
		 * DOM element for predicted protein-DNA interactions checkbox
		 * @type {HTMLElementCheckbox}
		 */
		this.domPPDICheckbox = null;
		/**
		 * DOm container for the data filtering label
		 * @type {HTMLElement}
		 */
		this.filterLabelContainer = null;
		/**
		 * The visibility status of the data filtering label
		 * @type {Boolean}
		 */
		this.filterLabelVisible = null;

		/**
		 * String selector to filter EPPI
		 * @type {String}
		 */
		this.EPPISelector = '[type = "PPI"][method = "E"]';
		/**
		 * String selector to filter by correlation
		 * @type {String}
		 */
		this.corrSelector = '[correlation <= ';
		/**
		 * String selector to filter PPDI
		 * @type {String}
		 */
		this.PPPISelector = '[type = "PPI"][method = "P"]';
		/**
		 * String selector to filter by interolog confidence
		 */
		this.interConfSelector = '[interolog_conf <='
		/**
		 * String selector to filter EPDI
		 * @type {String}
		 */
		this.EPDISelector = '[type = "PDI"][method = "E"]';
		/**
		 * String selector to filter PPDI
		 * @type {String}
		 */
		this.PPDISelector = '[type = "PDI"][method = "P"]';
		/**
		 * String selector to filter by fimo confidence
		 */
		this.fimoConfSelector = '[fimo_conf >= '

		// Create DOM elements
		this.createDOM();
		// Create filter dialog
		this.createDialog();
		this.isVisible = true;
		// Assign DOM elements to properties
		this.assignProperties();
	};

	/**
	 * Creates DOM elements.
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.createDOM = function () {
		// Create DOM container
		this.domContainer = document.createElement('div');

		// Create spinner labels
		var corrLabel = 'Hide only with correlation less than:';
		var confPLabel = 'Hide only with confidence less than';
		var confDLabel = 'Hide only with confidence greater than';

		// Create container for checkboxes
		var checkboxContainer = document.createElement('div');
		// Create checkbox labels
		var EPPILabel = 'Hide ALL experimentally determined Protein-Protein interactions';
		var PPPILabel = 'Hide ALL predicted Protein-Protein interactions';
		var EPDILabel = 'Hide ALL experimentally determined Protein-DNA interactions';
		var PPDILabel = 'Hide ALL predicted Protein-DNA interactions';
		// Create and append checkbox elements
		var domContainer = this.domContainer;
		domContainer.appendChild(this.createCheckbox('EPPI', EPPILabel, '15px'));
		domContainer.appendChild(this.createSpinner('eppi-corr', corrLabel, 0.1, 0.5));
		domContainer.appendChild(this.createCheckbox('PPPI', PPPILabel));
		domContainer.appendChild(this.createSpinner('pppi-corr', corrLabel, 0.1, 0.5));
		domContainer.appendChild(this.createSpinner('pppi-conf', confPLabel, 1, 2));
		domContainer.appendChild(this.createCheckbox('EPDI', EPDILabel, '15px'));
		domContainer.appendChild(this.createCheckbox('PPDI', PPDILabel));
		domContainer.appendChild(this.createPDISpinner('ppdi-conf', confDLabel));

		$(this.domContainer).append(checkboxContainer);
	};

	/**
	 * Constructs spinner elements
	 * @param {string} id The name of the spinner
	 * @param {string} description The description appearing as DOM text
	 * @param {number} step The incremental change for the spinner
	 * @param {number} value The default value of the spinner
	 * @return {HTMLElement} container The container of spinner DOM elements
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.createSpinner = function (id, description,
		step, value) {
		// Create DOM container
		var container = document.createElement('div');
		container.style.marginLeft = '40px';
		// Create DOM checkbox
		var checkbox = this.createCheckbox(id, description);
		// Create DOM spinner container
		var spinnerContainer = document.createElement('div');
		$(spinnerContainer).css({
			'margin-left': '25px',
			'margin-top': '5px'
		});
		// Create DOM spinner
		var spinner = document.createElement('input');
		$(spinnerContainer).append(spinner);
		$(spinner).attr('id', id + '-spinner');
		$(spinner).width(60);
		$(spinner).spinner({
			step: step,
			spin: function (event, ui) {
				if (ui.value < 0) {
					$(this).spinner('value', 0);
				} else if (ui.value > 1) {
					$(this).spinner('value', 1);
				}
			}
		});
		$(spinner).spinner('value', value);
		// Construct DOM structure
		container.appendChild(checkbox);
		container.appendChild(spinnerContainer);

		return container;
	};

	/**
	 * Construct spinner for PDI confidence, displays values in exponential notation
	 * @param  {string} id The name of the spinner
	 * @param  {string} description The description appearing as DOM text
	 * @return {HTMLElement} The container of all created elements
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.createPDISpinner = function (id,
		description) {
		// Create DOM container
		var container = document.createElement('div');
		container.style.marginLeft = '40px';
		// Create DOM checkbox
		var checkbox = this.createCheckbox(id, description);
		// Create DOM spinner container
		var spinnerContainer = document.createElement('div');
		$(spinnerContainer).css({
			'margin-left': '25px',
			'margin-top': '5px'
		});
		// Create DOM spinner
		var spinner = document.createElement('input');
		$(spinnerContainer).append(spinner);
		$(spinner).attr('id', id + '-spinner');
		$(spinner).attr('value', '1e-4');
		$(spinner).width(60);
		$.widget("ui.pdispinner", $.ui.spinner, {
			options: {
				min: 2,
				max: 12
			},
			_parse: function(value) {
				if (typeof value === "string") {
					return parseInt(value.charAt(3));
				}
				return value
			},
			_format: function(value2) {
				return "1e-" + value2;
			},
			step: 1,
		});
		$(spinner).pdispinner();
		// Construct DOM structure
		container.appendChild(checkbox);
		container.appendChild(spinnerContainer);

		return container;
	}

	/**
	 * Constructs checkbox elements
	 * @param {string} id The name of the checkbox
	 * @param {string} description The description appearing as DOM text
	 * @param {string} marginTop CSS margin-top of checkbox container
	 * @return {HTMLElement} container The container of checkbox DOM elements
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.createCheckbox = function (id, description,
		marginTop) {
		// Create DOM container
		var container = document.createElement('div');
		if (typeof marginTop === 'undefined') {
			marginTop = '5px';
		}
		$(container).css('margin-top', marginTop);
		// Create DOM checkbox
		var checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		$(checkbox).attr('id', id + '-checkbox');
		$(checkbox).css({
			'margin-right': '5px',
			'vertical-align': 'middle'
		});

		// Create DOM text
		var text = document.createElement('span');
		$(text).html(description);
		// Construct DOM structure
		container.appendChild(checkbox);
		container.appendChild(text);

		return container;
	};

	/**
	 * Assigns DOM elements to properties
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.assignProperties = function () {
		this.domEPPICorr = $('#eppi-corr-spinner');
		this.domEPPICorrCheckbox = $('#eppi-corr-checkbox');
		this.domPPPICorr = $('#pppi-corr-spinner');
		this.domPPPICorrCheckbox = $('#pppi-corr-checkbox');
		this.domPPPIConf = $('#pppi-conf-spinner');
		this.domPPPIConfCheckbox = $('#pppi-conf-checkbox');
		this.domPPDIConf = $('#ppdi-conf-spinner');
		this.domPPDIConfCheckbox = $('#ppdi-conf-checkbox');
		this.domEPPICheckbox = $('#EPPI-checkbox');
		this.domPPPICheckbox = $('#PPPI-checkbox');
		this.domEPDICheckbox = $('#EPDI-checkbox');
		this.domPPDICheckbox = $('#PPDI-checkbox');
	};

	/**
	 * Creates and opens the dialog.
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.createDialog = function () {
		// Set attributes
		var options = {};
		options.content = this.domContainer;
		options.title = 'Filter Data';
		options.lock = true;
		options.background = '#000';
		options.opacity = 0.6;
		options.width = 500;
		options.window = 'top';
		options.fixed = true;
		options.drag = true;
		options.resize = false;
		options.close = $.proxy(function () {
			this.hide();
		}, this);
		// Onclick action for ok button
		options.ok = $.proxy(function () {
			// Escape if Cytoscape is not ready
			if (!this.interactionView.cy) {
				return;
			}
			// Reset all hidden nodes
			this.interactionView.cy.elements().show();
			// Update spinner values
			this.updateValues();

			// Create selectors
			var eppiCorr = this.EPPISelector + this.corrSelector + this.EPPICorrValue + ']';
			var pppiCorr = this.PPPISelector + this.corrSelector + this.PPPICorrValue + ']';
			var pppiConf = this.PPPISelector + this.interConfSelector + this.PPPIConfValue + ']';
			var ppdiConf = this.PPDISelector + this.fimoConfSelector + this.PPDIConfValue + ']';
			// Apply filters
			this.filterStatus[0] = this.applyFilter(this.domEPPICheckbox, 0, this.EPPISelector);
			this.filterStatus[1] = this.applyFilter(this.domEPPICorrCheckbox, 1, eppiCorr);
			this.filterStatus[2] = this.applyFilter(this.domPPPICheckbox, 2, this.PPPISelector);
			this.filterStatus[3] = this.applyFilter(this.domPPPICorrCheckbox, 3, pppiCorr);
			this.filterStatus[4] = this.applyFilter(this.domPPPIConfCheckbox, 4, pppiConf);
			this.filterStatus[5] = this.applyFilter(this.domEPDICheckbox, 5, this.EPDISelector);
			this.filterStatus[6] = this.applyFilter(this.domPPDICheckbox, 6, this.PPDISelector);
			this.filterStatus[7] = this.applyFilter(this.domPPDIConfCheckbox, 7, ppdiConf);
			// Hide orphaned nodes
			this.cleanNodes();
			// Hide parent nodes
			this.cleanCompoundNode('COMPOUND_DNA');
			this.cleanCompoundNode('COMPOUND_PROTEIN');

			// Check filter status
			var filterActive = this.filterStatus.indexOf(true) !== -1;
			//	Remove pre-existing data active filter
			this.removeDataFilterLabel();
			// Toggle data filtering label depending on filter status
			if (filterActive) {
				this.createDataFilterLabel();
			}
			// Close dialog
			this.hide();
		}, this);

		options.cancel = $.proxy(function () {
			this.hide();
		}, this);

		var dialog = window.top.art.dialog(options);

		// Change cancel button class to make button grey
		$('.aui_buttons:eq(0) button:eq(1)').addClass('aui_state_highlight_grey');
		$.extend(true, this, dialog);
	};

	/**
	 * Creates a label to notify when data filtering is active
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.createDataFilterLabel = function () {
		// Get DOM containers
		var container = document.getElementById('Cytoscape_container');
		// Create DOM elements
		var filterLabelContainer = document.createElement('div');
		$(filterLabelContainer).attr('id', 'Data-filtering-label');
		var filterLabel = document.createElement('div');
		$(filterLabel).html('Data Filtering Active');
		// Set CSS for DOM elements
		$(filterLabel).css({
			position: 'absolute',
			'z-index': '1',
			left: '40%',
			top: '40px',
			'font-size': '1.3em',
			'line-height': '1.5em'
		});
		this.filterLabelContainer = filterLabelContainer;
		// Append DOM elements to containers
		$(filterLabelContainer).append(filterLabel);
		$(container).append(filterLabelContainer);
		// Set data filtering label status
		this.filterLabelVisible = true;
	};

	/**
	 * Attaches data filter label to the current view
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.attachDataFilterLabel = function () {
		$('#Cytoscape_container').append(this.filterLabelContainer);
	};

	/**
	 * Detaches data filter label from current view
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.detachDataFilterLabel = function () {
		$(this.filterLabelContainer).detach();
	};

	/**
	 * Removes active data filter label
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.removeDataFilterLabel = function () {
		$('#Data-filtering-label').remove();
		this.filterLabelVisible = false;
	};

	/**
	 * Updates correlation and confidence values from their spinners
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.updateValues = function () {
		// Get EPPI correlation values
		var correlationEPPI = $(this.domEPPICorr).spinner('value');
		// Set correlation to values between -1 and 1
		if (correlationEPPI < -1) {
			correlationEPPI = -1;
		}
		if (correlationEPPI > 1) {
			correlationEPPI = 1;
		}
		// Get PPPI correlation
		var correlationPPPI = $(this.domPPPICorr).spinner('value');
		// Set correlation to values between -1 and 1
		if (correlationPPPI < -1) {
			correlationPPPI = -1;
		}
		if (correlationPPPI > 1) {
			correlationPPPI = 1;
		}
		// Get PPPI confidence
		var confPPPI = $(this.domPPPIConf).spinner('value');
		// Set correlation to values between -1 and 1
		if (confPPPI < 0) {
			confPPPI = 0;
		}
		// Get PPPI correlation
		var confPPDI = parseFloat('1e-' + $(this.domPPDIConf).attr('aria-valuenow'));
		// Set correlation to values between -1 and 1
		if (confPPDI < 0) {
			confPPDI = 0;
		}
		if (confPPDI > 1) {
			confPPDI = 1;
		}
		// Pass confidence and correlation to global attributes
		this.EPPICorrValue = correlationEPPI;
		this.PPPICorrValue = correlationPPPI;
		this.PPPIConfValue = confPPPI;
		this.PPDIConfValue = confPPDI;
	};


	/**
	 * Applies filter to get edges matching selector
	 * @param {HTMLElement} checkbox The related checkbox element
	 * @param {Number} index The related filterStatus index
	 * @param {String} selector The selector by which to filter edges
	 * @return {boolean} The state of the related checkbox element
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.applyFilter = function (checkbox, index,
		selector) {
		// Get checkbox status
		var checkboxStatus = checkbox.prop('checked');

		// Show or hide edges based on checkbox status
		if (checkboxStatus) {
			// Generate collection of targetted edges
			var edges = this.interactionView.cy.edges(selector);
			edges.hide();
		}

		return checkboxStatus;
	};

	/**
	 * Hides the dialog.
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.hide = function () {
		$(this.domContainer).dialog('close');
	};

	/**
	 * Removes the filter dialog
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.remove = function () {
		$(this.domContainer).remove();
	};

	/**
	 * Cleans interaction view of specified compound node if no nodes contained are visible
	 * @param {String} id Selector for compound node
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.cleanCompoundNode = function (id) {
		if (this.interactionView.cy.nodes('[parent = "' + id + '"]:visible').length === 0) {
			this.interactionView.cy.nodes('#' + id).hide();
		}
	};

	/**
	 * Clears interaction view of nodes without associated edges
	 * @returns {void}
	 */
	Eplant.Views.InteractionView.FilterDialog.prototype.cleanNodes = function () {
		// Get all nodes in interaction view
		var nodes = this.interactionView.cy.nodes();
		for (var n = 0; n < nodes.length; n = n + 1) {
			var node = nodes[n];
			var type = node.data('id').substring(9);

			// Remove nodes with no connecting interactions
			var isOrphaned = node.connectedEdges(':visible').length === 0;

			if (type === 'DNA_NODE' && isOrphaned) {
				node.hide();
			} else if (type === 'PROTEIN_NODE' && isOrphaned) {
				node._private.parent.hide();
			}
		}
	};
}());
