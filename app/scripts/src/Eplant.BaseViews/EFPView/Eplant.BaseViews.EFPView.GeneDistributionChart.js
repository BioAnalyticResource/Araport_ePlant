(function() {

	/**
		* Eplant.BaseViews.EFPView.GeneDistributionChart class
		* Coded by Hans Yu
		* UI designed by Jamie Waese
		*
		* @constructor
		* @param {Eplant.BaseViews.EFPView} eFPView The EFPView that owns this legend.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart = function(eFPView) {
		/* Attributes */
		this.eFPView = eFPView;			// Parent EFPView
		this.width = 90;				// Width of the legend
		this.height = 73;				// Height of the legend
		this.x = 5;					// X-coordinate position of the legend
		this.y = 192;	// Y-coordinate position of the legend
		this.isVisible = true;			// Whether the legend is visible
		this.domContainer = null;			// DOM container for the legend
		this.canvas = null;				// Canvas for drawing
		this.context = null;				// Canvas context
		this.svgLoaded =false;
		this.pinUpdated = false;
		/* Create DOM container */
		this.domContainer = document.createElement("div");
		$(this.domContainer).css({
			"position": "absolute",
			"left": this.x,
			"bottom": this.y,
			"width": this.width,
			"height": this.height
		});
		this.domContainer.ondragstart = function() {	// Disable dragging on the legend
			return false;
		};
		/* Create canvas */
		this.svgSrc = "app/data/experiment/GeneDistributionChart.svg";

		if(!Eplant.BaseViews.EFPView.GeneDistributionChart.svgDom){
			$.get(this.svgSrc, $.proxy(function(data) {
				Eplant.BaseViews.EFPView.GeneDistributionChart.svgDom = $(data).find('svg');
				// Get the SVG tag, ignore the rest
				this.svg = Eplant.BaseViews.EFPView.GeneDistributionChart.svgDom.clone();
				// Replace image with new SVG
				$(this.domContainer).append(this.svg);
				$(this.svg).css({
					"width": this.width,
					"height": 56
				});
				this.svgLoaded = true;
				this.update(0);
				if(this.eFPView.max>0){
					this.update(this.eFPView.max);

				}
			},this));
		}
		else{
			this.svg = Eplant.BaseViews.EFPView.GeneDistributionChart.svgDom.clone();
			// Replace image with new SVG
			$(this.domContainer).append(this.svg);
			$(this.svg).css({
				"width": this.width,
				"height": 56
			});
			this.svgLoaded = true;
			this.update(0);
			if(this.eFPView.max>0){
				this.update(this.eFPView.max);

			}
		}

		$(this.svg).css({
			"width": this.width,
			"height": this.height
		});
		$(this.domContainer).append(this.svg);
		this.domContainer.className = "hint--right hint--success hint--rounded";
		this.domContainer.setAttribute("data-enabled", Eplant.isTooltipOn.toString());
		this.domContainer.setAttribute("data-hint", "Gene expression distribution chart");
	};

	/**
		* Updates the legend.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart.prototype.update = function(exp) {
		if(!this.pinUpdated){
			$.ajax({
				beforeSend: function(request) {
					request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
				},
				type: "GET",
				url: Eplant.ServiceUrl + "get_rank.php?expression="+exp, 
				success: $.proxy(function(data) {
					if(data.status==="success"){
						var value = parseInt(data.result[0].percentile,10);
						var svgDoc = this.svg[0];

						// map incoming value onto chart to get mappedValue
						var baseline = svgDoc.getElementById("baseline");
						var x1 = parseInt( baseline.getAttributeNode("x1").nodeValue );
						var x2 = parseInt( baseline.getAttributeNode("x2").nodeValue );
						var mappedValue = ( x1 + ((value/100) * (x2-x1)) );

						// move the pin and adjust the value label
						var circle = svgDoc.getElementById("pinMarkerCircle");
						circle.setAttributeNS(null, "cx", mappedValue);

						var line = svgDoc.getElementById("pinMarkerLine");
						line.setAttributeNS(null, "x1", mappedValue);
						line.setAttributeNS(null, "x2", mappedValue);

						var text = svgDoc.getElementById("pinMarkerValue");
						text.setAttributeNS(null, "x", mappedValue);
						text.textContent = value+"%";
						this.pinUpdated = true;
					}
				},this)
			});
		}

	};

	/**
		* Attaches the legend to the view.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart.prototype.attach = function() {
		$(this.eFPView.domContainer).append(this.domContainer);
	};

	/**
		* Detaches the legend to the view.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart.prototype.detach = function() {
		$(this.domContainer).detach();
	};

	/**
		* Makes the legend visible.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart.prototype.show = function() {
		this.isVisible = true;
		if (ZUI.activeView == this.eFPView) {
			this.attach();
		}
	};

	/**
		* Hides the legend.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart.prototype.hide = function() {
		this.isVisible = false;
		if (ZUI.activeView == this.eFPView) {
			this.detach();
		}
	};

	/**
		* Removes the legend.
	*/
	Eplant.BaseViews.EFPView.GeneDistributionChart.prototype.remove = function() {
		/* Remove DOM elements */
		$(this.domContainer).remove();
	};

})();
