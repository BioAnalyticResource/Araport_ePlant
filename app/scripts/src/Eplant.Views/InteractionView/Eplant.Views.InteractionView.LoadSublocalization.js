(function () {
	/* global Eplant */
	/**
	 * Eplant.Views.InteractionView.Sublocalization class
	 * Coded by Ian Shi
	 *
	 * Used to load node sublocalizations, and returns a promise when done
	 *
	 * @constructor
	 * @param {Object} nodes CyConf nodes
	 */
	'use strict';
	Eplant.Views.InteractionView.LoadSublocalization = function (nodes) {
		// Get nodes from cyConf
		this.nodes = nodes;
		// Get data
		var loadDataPromise = loadData.bind(this);
		var dataLoadedPromise = new Promise(loadDataPromise);

		// Promise which resolves when all sublocalizations have been processed
		var sublocLoadedPromise = new Promise(function (resolve) {
			// Begin processing once JSON is loaded
			dataLoadedPromise.then(function (data) {
				this.data = data;
				this.setSublocal(this.data);
				resolve(this.nodes);
			}.bind(this));
		}.bind(this));

		return sublocLoadedPromise;
	};

	/**
	 * Set the sublocalization for each pie node
	 * @param {Object} data JSON sublocalization object from webservice
	 * @return {void}
	 */
	Eplant.Views.InteractionView.LoadSublocalization.prototype.setSublocal = function (data) {
		var backNodes = [];
		for (var i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].data.id.substr(-4) === 'BACK') {
				backNodes.push(this.nodes[i]);
			}
		}
		for (var n = 0; n < backNodes.length; n++) {
			var id = backNodes[n].data.id.substring(0, 9);
			var subData = data.filter(function (item) { return item.id === id })[0];
			var topLocals = subData ? getTopSublocals(subData) : [];
			var pred = subData ? subData.includes_predicted : true;
			setSublocalizationStyle(topLocals, pred === 'yes', backNodes[n]);
		}
	};

	/**
	 * Gets sublocalization data from webservice
	 * @param  {Function} resolve Promise resolve function
	 * @return {void}
	 */
	function loadData (resolve) {
		// Get all protein ids
		var ids = [];
		for (var n = 0; n < this.nodes.length; n++) {
			var id = this.nodes[n].data.id.substring(0, 9);
			var type = this.nodes[n].data.id.substring(9);

			if (type === 'PROTEIN_NODE' || type === 'QUERY_NODE') {
				ids.push(id);
			}
		}

		// URL for sublocalization webservices, do not include predicted
		var urlSUBA = Eplant.ServiceUrl + 'groupsuba3.cgi?ids=';
		var expQuery = urlSUBA + JSON.stringify(ids) + '&include_predicted=no';
		// Get data from webservice, including predicted if non-predicts do not exist

		$.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			type: "GET",
			dataType: "json",
			url: expQuery,
			success: $.proxy(function(response) {
				var expData = response;
				// Get genes without exp data to re-query 
				var predIds = []
				for (var i = 0; i < expData.length; i++) {
					if (expData[i].includes_experimental === 'no') {
						predIds.push(expData[i].id);
					}
				}
				if (predIds.length === 0) {
					resolve(response);
				}
				var predQuery = urlSUBA + JSON.stringify(predIds) + '&include_predicted=yes';

				$.ajax({
					beforeSend: function(request) {
						request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
					},
					type: "GET",
					dataType: "json",
					url: predQuery,
					success: $.proxy(function(response) {
						var predData = response;
						for (var k = 0; k < expData.length; k++) {
							var resp = expData[k];
							// Use predicted data for genes without exp data
							if (resp.includes_experimental === 'no') {
								var pred = predData.filter( function (item) { 
									return item.id === resp.id
								});	
								resp.data = pred[0].data;
								resp.includes_predicted = 'yes';
							}
						}
						resolve(expData);
					})
				});
			})
		});
	}

	/**
	 * Return the top 4 sublocalizations of each node
	 * @param  {Object} data The sublocalization data for one gene
	 * @return {Array} Array of sublocalizations and score
	 */
	function getTopSublocals (data) {
		var locals = data.data;
		// Get the score of sublocalizations
		var arrayLocalization = [];
		for (var local in locals) {
			arrayLocalization.push([local, locals[local]]);
		}

		// Return top sublocalizations, up to 4
		if (arrayLocalization.length < 5) {
			return arrayLocalization;
		}
		// Sort to get largest 4th keys
		arrayLocalization.sort(function (a, b) {
			return a[1] - b[1];
		});
		return arrayLocalization.slice(-4);
	}

	/**
	 * Set the cytoscape styles for pie nodes
	 * @param {Array} sublocalizations Array of top 4 sublocalizations and score
	 * @param {Boolean} pred Whether sublocalizations are predicted
	 * @param {Object} node Pie protein node
	 * @return {Object} The update pie node
	 */
	function setSublocalizationStyle (sublocalizations, pred, node) {
		// Calculate total sum of scores
		var total = 0;
		for (var n = 0; n < sublocalizations.length; n++) {
			total += sublocalizations[n][1];
		}
		// Calculate pie size and colours
		var percentages = [100, 0, 0, 0];
		var colour = ['#787878', '#787878', '#787878', '#787878'];
		for (var i = 0; i < sublocalizations.length; i++) {
			percentages[i] = sublocalizations[i][1] * 100 / total;
			colour[i] = getColour(sublocalizations[i][0]);
		}
		// Set styles
		node.data.pie1Size = percentages[0];
		node.data.pie2Size = percentages[1];
		node.data.pie3Size = percentages[2];
		node.data.pie4Size = percentages[3];
		node.data.pie1Colour = colour[0];
		node.data.pie2Colour = colour[1];
		node.data.pie3Colour = colour[2];
		node.data.pie4Colour = colour[3];
		node.data.height = pred ? '46px' : '50px';
		node.data.width = pred ? '46px' : '50px';
		node.data.borderWidth = pred ? 0 : 4;

		return node;
	}

	/**
	 * Return a hex colour code representing a compartment
	 * @param  {String} compartment The compartment to represent
	 * @return {String} The hex colour code
	 */
	function getColour (compartment) {
		// Define color map
		var map = {
			cytoskeleton: '#FF2200',
			cytosol: '#E04889',
			'endoplasmic reticulum': '#D0101A',
			extracellular: '#6D3F1F',
			golgi: '#A5A417',
			mitochondrion: '#41ABF9',
			nucleus: '#0032FF',
			peroxisome: '#660066',
			'plasma membrane': '#ECA926',
			plastid: '#179718',
			vacuole: '#F6EE3C'
		};

		// Get color
		var color = map[compartment];
		if (!color) {
			color = '#787878';
		}

		// Return color
		return color;
	}
}());
