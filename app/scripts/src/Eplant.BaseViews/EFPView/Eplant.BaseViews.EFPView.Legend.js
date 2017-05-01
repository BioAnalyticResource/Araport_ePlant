(function() {

	/**
		* Eplant.BaseViews.EFPView.Legend class
		* Coded by Hans Yu
		* UI designed by Jamie Waese
		*
		* @constructor
		* @param {Eplant.BaseViews.EFPView} eFPView The EFPView that owns this legend.
	*/
	Eplant.BaseViews.EFPView.Legend = function(eFPView) {
		/* Attributes */
		this.eFPView = eFPView;			// Parent EFPView
		this.width = 150;				// Width of the legend
		this.height = 173;				// Height of the legend
		this.x = 20;					// X-coordinate position of the legend
		this.y = 20;	// Y-coordinate position of the legend
		this.isVisible = true;			// Whether the legend is visible
		this.domContainer = null;			// DOM container for the legend
		this.canvas = null;				// Canvas for drawing
		this.context = null;				// Canvas context

		/* Create DOM container */
		this.domContainer = document.createElement("div");
		$(this.domContainer).css({
			"pointer-events": "none",
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
		//this.canvas = document.createElement("canvas");
		//this.canvas.width = this.width;
		//this.canvas.height = this.height;
		this.context = new C2S(this.width,this.height);//this.canvas.getContext("2d");

	};

	/**
		* Updates the legend.
	*/
	Eplant.BaseViews.EFPView.Legend.prototype.update = function() {
		/* Clear canvas */
		this.context.clearRect(0, 0, this.width, this.height);

		/* Distinguish eFP mode and draw legend */
				var modeText = "";
		var titleText = "";
		var controlText = "";
		this.context.save();
		this.context.font = "10px Helvetica";

		if (Eplant.viewColorMode ==  "absolute") {
			/* Find maximum value */
			var max=this.eFPView.max;
			switch(Eplant.globalColorMode){
				case "absolute" :
				/*if(Eplant.experimentColorMode==="all"&&this.eFPView.magnification===35){
					max= this.eFPView.geneticElement.experimentViewMax;
					}
				else{*/
				max = this.eFPView.max;
								modeText = "Local Max";

				break;
				case "globalAbsolute" :
				if(!this.eFPView.geneticElement.species.max){
					max = this.eFPView.max;
				}
				else if(/*Eplant.experimentColorMode==="all"&&this.eFPView.magnification===35*/this.eFPView.viewName!="CellView"){
					max= this.eFPView.geneticElement.species.max;//experimentViewMax;
				}
				else{
					max = this.eFPView.geneticElement.species.geneticViewMax[this.viewName];
				}
								modeText = "Global Max";
				break;
				case "customAbsolute" :
				if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.eFPView.viewName!="CellView"){
					max = Eplant.customGlobalMax;
				}
				else{
					max = this.eFPView.geneticElement.species.geneticViewMax[this.viewName];
				}
								modeText = "Custom Max";
				break;
				default:
				max = this.eFPView.max;
												modeText = "Local Max";
				break;
			}
			if(!max){
				modeText = "Local Max";
				max=this.eFPView.groups[0].mean;
				for (var n = 1; n < this.eFPView.groups.length; n++) {
					var group = this.eFPView.groups[n];
					if (group.mean > max) {
						max = group.mean;
					}
				}
			}


			/* Get legend colors */
			var minColor = ZUI.Util.getColorComponents(Eplant.midColor);
			var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);

			/* Draw legend */
			var value = 0;
			var color = {
				red: minColor.red,
				green: minColor.green,
				blue: minColor.blue
			};
			for (var n = 0; n < 11; n++) {
				/* Color */
				this.context.fillStyle = ZUI.Util.makeColorString(Math.round(color.red), Math.round(color.green), Math.round(color.blue));
				this.context.fillRect(0, (10 - n) * 12 + 29, 16, 12);

				/* Label */
				this.context.fillStyle = Eplant.Color.Black;
				this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);

				/* Calculate value and color for next iteration */
				value += max / 10;
				color.red += (maxColor.red - minColor.red) / 10;
				color.green += (maxColor.green - minColor.green) / 10;
				color.blue += (maxColor.blue - minColor.blue) / 10;
			}

			/* Set title and control texts */
			titleText = "Linear";
			controlText = "Absolute";
		}
		else if (Eplant.viewColorMode == "relative") {
			/* Find extremum log2 value */
			var extremum =this.eFPView.extremum;
			switch(Eplant.globalColorMode){
				case "absolute" :
				/*if(Eplant.experimentColorMode==="all" && this.eFPView.magnification===35){
					extremum= this.eFPView.geneticElement.experimentViewExtremum;
					}
				else{*/
				extremum = this.eFPView.extremum;
								modeText = "Local Extrema";
				break;
				case "globalAbsolute" :

				if(!this.eFPView.geneticElement.species.extremum){
					extremum = this.eFPView.extremum;
				}
				else if(/*Eplant.experimentColorMode==="all"&&this.eFPView.magnification===35*/this.eFPView.viewName!="CellView"){
					extremum= this.eFPView.geneticElement.species.extremum;//.experimentViewExtremum;
				}
				else{
					extremum = this.eFPView.geneticElement.species.geneticViewExtremum[this.viewName];
				}
								modeText = "Global Extrema";
				break;
				case "customAbsolute" :
				if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.eFPView.viewName!="CellView"){
					max = Eplant.customGlobalExtremum;
				}
				else{
					max = this.eFPView.geneticElement.species.geneticViewExtremum[this.viewName];
				}
								modeText = "Custom Extrema";
				break;
				default:
				extremum = this.eFPView.extremum;
				modeText = "Local Extrema";
				break;
			}
			if(!extremum){
			modeText = "Local Extrema";
				extremum = Math.abs(ZUI.Math.log(this.eFPView.groups[0].mean / this.eFPView.groups[0].ctrlMean, 2));
				for (var n = 1; n < this.eFPView.groups.length; n++) {
					var group = this.eFPView.groups[n];
					var absLog2Value = Math.abs(ZUI.Math.log(group.mean / group.ctrlMean, 2));
					if (absLog2Value > extremum) {
						if (isNaN(absLog2Value) || !isFinite(absLog2Value)) {
							} else {
							extremum = absLog2Value;
						}
					}
				}
			}


			/* Get legend colors */
			var minColor = ZUI.Util.getColorComponents(Eplant.minColor);
			var midColor = ZUI.Util.getColorComponents(Eplant.midColor);
			var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);

			/* Draw legend */
			/* -extremum to 0 */
			var value = -extremum;
			var color = {
				red: minColor.red,
				green: minColor.green,
				blue: minColor.blue
			};
			for (var n = 0; n < 5; n++) {
				/* Color */
				this.context.fillStyle = ZUI.Util.makeColorString(Math.round(color.red), Math.round(color.green), Math.round(color.blue));
				this.context.fillRect(0, (10 - n) * 12 + 29, 16, 12);

				/* Label */
				this.context.fillStyle = Eplant.Color.Black;
				this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);

				/* Calculate value and color for next iteration */
				value += extremum / 5;
				color.red += (midColor.red - minColor.red) / 5;
				color.green += (midColor.green - minColor.green) / 5;
				color.blue += (midColor.blue - minColor.blue) / 5;
			}
			/* 0 to extremum */
			value = 0;
			color = {
				red: midColor.red,
				green: midColor.green,
				blue: midColor.blue
			};
			for (var n = 5; n < 11; n++) {
				/* Color */
				this.context.fillStyle = ZUI.Util.makeColorString(Math.round(color.red), Math.round(color.green), Math.round(color.blue));
				this.context.fillRect(0, (10 - n) * 12 + 29, 16, 12);

				/* Label */
				this.context.fillStyle = Eplant.Color.Black;
				this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);

				/* Calculate value and color for next iteration */
				value += extremum / 5;
				color.red += (maxColor.red - midColor.red) / 5;
				color.green += (maxColor.green - midColor.green) / 5;
				color.blue += (maxColor.blue - midColor.blue) / 5;
			}

			/* Set title and control texts */
			titleText = "Log2 Ratio";
			controlText = "Relative to control: " + (Math.round(this.eFPView.groups[0].ctrlMean * 100) / 100);
		}
		else if (Eplant.viewColorMode == "compare") {
			/* Find extremum log2 value */
			modeText = "Compare Mode";
			var extremum = Math.abs(ZUI.Math.log(this.eFPView.groups[0].mean / this.eFPView.compareEFPView.groups[0].mean, 2));
			for (var n = 1; n < this.eFPView.groups.length; n++) {
				var group = this.eFPView.groups[n];
				var compareGroup = this.eFPView.compareEFPView.groups[n];
				var absLog2Value = Math.abs(ZUI.Math.log(group.mean / compareGroup.mean, 2));
				if (absLog2Value > extremum) {
					extremum = absLog2Value;
				}
			}

			/* Get legend colors */
			var minColor = ZUI.Util.getColorComponents(Eplant.minColor);
			var midColor = ZUI.Util.getColorComponents(Eplant.midColor);
			var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);

			/* Draw legend */
			/* -extremum to 0 */
			var value = -extremum;
			var color = {
				red: minColor.red,
				green: minColor.green,
				blue: minColor.blue
			};
			for (var n = 0; n < 5; n++) {
				/* Color */
				this.context.fillStyle = ZUI.Util.makeColorString(Math.round(color.red), Math.round(color.green), Math.round(color.blue));
				this.context.fillRect(0, (10 - n) * 12 + 29, 16, 12);

				/* Label */
				this.context.fillStyle = Eplant.Color.Black;
				this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);

				/* Calculate value and color for next iteration */
				value += extremum / 5;
				color.red += (midColor.red - minColor.red) / 5;
				color.green += (midColor.green - minColor.green) / 5;
				color.blue += (midColor.blue - minColor.blue) / 5;
			}
			/* 0 to extremum */
			value = 0;
			color = {
				red: midColor.red,
				green: midColor.green,
				blue: midColor.blue
			};
			for (var n = 5; n < 11; n++) {
				/* Color */
				this.context.fillStyle = ZUI.Util.makeColorString(Math.round(color.red), Math.round(color.green), Math.round(color.blue));
				this.context.fillRect(0, (10 - n) * 12 + 29, 16, 12);

				/* Label */
				this.context.fillStyle = Eplant.Color.Black;
				this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);

				/* Calculate value and color for next iteration */
				value += extremum / 5;
				color.red += (maxColor.red - midColor.red) / 5;
				color.green += (maxColor.green - midColor.green) / 5;
				color.blue += (maxColor.blue - midColor.blue) / 5;
			}

			/* Set title and control texts */
			titleText = "Log2 Ratio";
			controlText = "Relative to " + this.eFPView.compareEFPView.geneticElement.identifier;
		}

		/* Draw mask color */
		this.context.fillStyle = this.eFPView.maskColor;
		this.context.fillRect(0, 11 * 12 + 29, 16, 12);
		this.context.fillStyle = Eplant.Color.Black;
		var text = "Masked";
		if (!this.eFPView.isMaskEnabled) {
			text += " (N/A)";
		}
		else if (this.eFPView.maskThreshold === null) {
			text += " (off)";
		}
		else {
			text += " (" + String.fromCharCode(8805) + (this.eFPView.maskThreshold * 100) + "% RSE)";
		}
		this.context.fillText(text, 20, 11 * 12 + 10 + 29);
		this.context.restore();

		/* Draw legend title and control texts */
		this.context.save();
		this.context.fillStyle = Eplant.Color.Black;
		this.context.font = "12px Helvetica";
		this.context.fillText(modeText, 0, 10);
		this.context.fillText(titleText, 0, 25);
		//this.context.fillText(controlText, 130, this.height - 1);
		this.context.restore();


		//ok lets serialize to SVG:
		this.svg = $(this.context.getSerializedSvg(true)); //true here will replace any named entities with numbered ones.

		var texts = $('text',this.svg);

		var modeText = texts[texts.length-2];
		$(modeText).click(function(){
			var globalColorModeDialog = new Eplant.GlobalColorModeDialog();
		});
		$(modeText).css({
			"pointer-events": "auto",
			'cursor':'pointer'});
		if(this.eFPView.modeButton&&this.eFPView.modeButton.click){
			var absRelModeText = texts[texts.length-1];
			$(absRelModeText).click($.proxy(this.eFPView.modeButton.doClick,this.eFPView.modeButton));
			$(absRelModeText).css({
				"pointer-events": "auto",
				'cursor':'pointer'});
		}
		$(this.domContainer).html(this.svg);
	};

	/**
		* Attaches the legend to the view.
	*/
	Eplant.BaseViews.EFPView.Legend.prototype.attach = function() {
		$(this.eFPView.domContainer).append(this.domContainer);
	};

	/**
		* Detaches the legend to the view.
	*/
	Eplant.BaseViews.EFPView.Legend.prototype.detach = function() {
		$(this.domContainer).detach();
	};

	/**
		* Makes the legend visible.
	*/
	Eplant.BaseViews.EFPView.Legend.prototype.show = function() {
		this.isVisible = true;
		if (ZUI.activeView == this.eFPView) {
			this.attach();
		}
	};

	/**
		* Hides the legend.
	*/
	Eplant.BaseViews.EFPView.Legend.prototype.hide = function() {
		this.isVisible = false;
		if (ZUI.activeView == this.eFPView) {
			this.detach();
		}
	};

	/**
		* Removes the legend.
	*/
	Eplant.BaseViews.EFPView.Legend.prototype.remove = function() {
		/* Remove DOM elements */
		$(this.domContainer).remove();
	};

})();
