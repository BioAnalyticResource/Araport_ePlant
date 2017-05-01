(function() {
	
	/**
		* Eplant.Views.HeatMapView.Legend class
		* Coded by Hans Yu
		* UI designed by Jamie Waese
		*
		* @constructor
		* @param {Eplant.Views.HeatMapView} eFPView The EFPView that owns this legend.
	*/
	Eplant.Views.HeatMapView.Legend = function(view) {
		/* Attributes */
		this.view = view;			// Parent EFPView
		this.width = 300;				// Width of the legend
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
	Eplant.Views.HeatMapView.Legend.prototype.update = function() {
		/* Clear canvas */
		this.context.clearRect(0, 0, this.width, this.height);
		
		/* Distinguish eFP mode and draw legend */
		var modeText = "";
		var titleText = "";
		var controlText = "";
		this.context.save();
		this.context.font = "10px Helvetica";
		var noLabels = false;
		if (Eplant.viewColorMode ==  "absolute") {
			/* Find maximum value */
			var max=10;
			switch(Eplant.globalColorMode){
				case "absolute" :
				modeText = "Local Max";
				max = 10;
				noLabels=true;
				break;
				case "globalAbsolute" :
				modeText = "Global Max";
				if(!Eplant.activeSpecies.max){
					max = 10;
				}else{
					max= Eplant.activeSpecies.max;
				}
				break;
				case "customAbsolute" :
				modeText = "Custom Max";
				max = Eplant.customGlobalMax;
				break;
				default:
				max = 10;
				noLabels=true;
				break;
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
				if(!noLabels){
					
					this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);
				}
				
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
			var extremum =10;
			switch(Eplant.globalColorMode){
				case "absolute" :
				extremum = 10;
				noLabels=true;
				modeText = "Local Extrema";
				break;
				case "globalAbsolute" :
				if(!Eplant.activeSpecies.extremum){
					extremum = 10;
				}else{
					
					extremum= Eplant.activeSpecies.extremum;
				}
				modeText = "Global Extrema";
				break;
				case "customAbsolute" :
				max = Eplant.customGlobalExtremum;
				modeText = "Custom Extrema";
				break;
				default:
				extremum = 10;
				noLabels=true;
				break;
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
				if(!noLabels){
					this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);
				}
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
				if(!noLabels){
					this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);
				}
				/* Calculate value and color for next iteration */
				value += extremum / 5;
				color.red += (maxColor.red - midColor.red) / 5;
				color.green += (maxColor.green - midColor.green) / 5;
				color.blue += (maxColor.blue - midColor.blue) / 5;
			}
			
			/* Set title and control texts */
			titleText = "Log2 Ratio";
			controlText = "";
		}
		else if (Eplant.viewColorMode == "compare") {
			/* Find extremum log2 value */
			var extremum = 5;
			modeText = "Compare Mode";
			var noLabels = true;
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
				if(!noLabels){
					this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);
				}
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
				if(!noLabels){
					this.context.fillText(Math.round(value * 100) / 100, 20, (10 - n) * 12 + 10 + 29);
				}
				/* Calculate value and color for next iteration */
				value += extremum / 5;
				color.red += (maxColor.red - midColor.red) / 5;
				color.green += (maxColor.green - midColor.green) / 5;
				color.blue += (maxColor.blue - midColor.blue) / 5;
			}
			
			/* Set title and control texts */
			titleText = "Log2 Ratio";
			controlText = "";
		}
		
		/* Draw mask color */
		this.context.fillStyle = Eplant.maskColor;
		this.context.fillRect(0, 11 * 12 + 29, 16, 12);
		this.context.fillStyle = Eplant.Color.Black;
		var text = "Masked";
		if (!Eplant.isMaskEnabled) {
			text += " (N/A)";
		}
		else if (Eplant.maskThreshold === null) {
			text += " (off)";
		}
		else {
			text += " (" + String.fromCharCode(8805) + (Eplant.maskThreshold * 100) + "% RSE)";
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
		this.svg = this.context.getSerializedSvg(true); //true here will replace any named entities with numbered ones.
		
		$(this.domContainer).html(this.svg);
	};
	
	/**
		* Attaches the legend to the view.
	*/
	Eplant.Views.HeatMapView.Legend.prototype.attach = function() {
		$(this.view.domContainer).append(this.domContainer);
	};
	
	/**
		* Detaches the legend to the view.
	*/
	Eplant.Views.HeatMapView.Legend.prototype.detach = function() {
		$(this.domContainer).detach();
	};
	
	/**
		* Makes the legend visible.
	*/
	Eplant.Views.HeatMapView.Legend.prototype.show = function() {
		this.isVisible = true;
		if (ZUI.activeView == this.view) {
			this.attach();
		}
	};
	
	/**
		* Hides the legend.
	*/
	Eplant.Views.HeatMapView.Legend.prototype.hide = function() {
		this.isVisible = false;
		if (ZUI.activeView == this.view) {
			this.detach();
		}
	};
	
	/**
		* Removes the legend.
	*/
	Eplant.Views.HeatMapView.Legend.prototype.remove = function() {
		/* Remove DOM elements */
		$(this.domContainer).remove();
	};
	
})();
