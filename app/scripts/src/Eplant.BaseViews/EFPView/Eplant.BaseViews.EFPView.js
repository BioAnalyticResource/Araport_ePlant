(function() {
	
	/**
		* Eplant.BaseViews.EFPView class
		* Coded by Hans Yu
		* UI designed by Jamie Waese
		*
		* @constructor
		* @augments Eplant.View
		* @param {Eplant.GeneticElement} geneticElement The GeneticElement that this EFPView is associated with.
		* @param {String} efpURL The URL of the EFP definition file.
		* @param {Object} configs Configurations.
		* @param {Boolean} configs.isRelativeEnabled Whether relative mode is enabled.
		* @param {Boolean} configs.isCompareEnabled Whether compare mode is enabled.
		* @param {Boolean} configs.isMaskEnabled Whether masking is enabled.
	*/
	Eplant.BaseViews.EFPView = function(geneticElement, efpSvgURL, efpXmlURL, configs) {
		this.domContainer = $("#efp_container");
		/* Attributes */
		this.isEFPView=true;
		this.viewMode = "svg";
		this.svgdom = null;
		this.svgURL = efpSvgURL;
		this.isSvgLoaded = false;
		this.loadsvg();
		
		this.heatmapDom = null;
		
		this.xmlURL = efpXmlURL;
		this.geneticElement = geneticElement;
		this.maskColor = "#B4B4B4"; // Mask color
		this.errorColor = "#cccccc"; // Error color
		this.paletteButton = null;
		this.infoButton= null;
		this.modeButton = null; // Mode ViewSpecificUIButton
		this.compareButton = null; // Compare ViewSpecificUIButton
		this.maskButton = null; // Mask ViewSpecificUIButton
		this.isMaskOn = false; // Whether masking is on
		this.maskThreshold = 1; // Masking threshold
		this.isRelativeEnabled = true; // Whether relative mode is enabled
		this.isCompareEnabled = true; // Whether compare mode is enabled
		this.isMaskEnabled = true; // Whether masking is enabled
		this.isLegendVisible = true;
		this.compareEFPView = null; // EFP view for comparing to
		this.mode = "absolute"; // EFP mode
		this.tooltipInfo = null; // Information for creating tooltip
		this.tooltip = null;
		this.linkDialog = null;
		this.max=0;
		this.extremum=0;
		this.viewGlobalConfigs = {
			isMaskOn:false, // Whether masking is on
			maskThreshold:1, // Masking threshold
			//compareEFPView : {}, // EFP view for comparing to
			maskColor :  "#B4B4B4", // Mask color
			errorColor : "#FFFFFF", // Error color
			//mode : "absolute", // EFP mode
			left: 0,
			top:0,
			width:'100%',
			height:'100%',
			isLegendVisible:true
		};
		/* Apply configurations */
		if (configs) {
			if (configs.isRelativeEnabled !== undefined) {
				this.isRelativeEnabled = configs.isRelativeEnabled;
			}
			if (configs.isCompareEnabled !== undefined) {
				this.isCompareEnabled = configs.isCompareEnabled;
			}
			if (configs.isMaskEnabled !== undefined) {
				this.isMaskEnabled = configs.isMaskEnabled;
			}
		}
		
		this.transitionCenter = null;
		
		/* Create view-specific UI buttons */
		this.createViewSpecificUIButtons();
		
		/* Load data */
		this.loadData();
		
		
		/* Create legend */
		this.legend = new Eplant.BaseViews.EFPView.Legend(this);
		this.geneDistributionChart = new Eplant.BaseViews.EFPView.GeneDistributionChart(this);
		
		
		if(this.name)
		{
			$(this.labelDom).empty();
			this.viewNameDom = document.createElement("span");
			var labelText = this.geneticElement.identifier;
			if (this.geneticElement.aliases && this.geneticElement.aliases.length && this.geneticElement.aliases[0].length) {
				labelText += " / " + this.geneticElement.aliases.join(", ");
			}
			var text = this.name+': '+labelText;
			/*if(this.geneticElement.isRelated){
				text += ", "+this.geneticElement.identifier+" correlates to "+this.geneticElement.relatedGene.identifier+" with an r-value of "+this.geneticElement.rValueToRelatedGene;
			}*/
			this.viewNameDom.appendChild(document.createTextNode(text));
			$(this.viewNameDom).appendTo(this.labelDom);
			/*if(this.geneticElement.isRelated){
				$('<br>').appendTo(this.labelDom);
				var viewNameRelatedDom = document.createElement("span");
				
				viewNameRelatedDom.appendChild(document.createTextNode(this.geneticElement.identifier+" correlates to "+this.geneticElement.relatedGene.identifier+" with an r-value of "+this.geneticElement.rValueToRelatedGene));
				$(viewNameRelatedDom).css({
				"font-size":'0.7em',
				"line-height":'1em'
				}).appendTo(this.labelDom);
			}*/
		}
		this.labelDomClone = $(this.labelDom).clone();
		/* Bind events */
		/*this.bindEvents();*/
		
	};
	ZUI.Util.inheritClass(Eplant.View, Eplant.BaseViews.EFPView); // Inherit parent prototype
	Eplant.BaseViews.EFPView.isEFPView = true;
	
	/**
		* Active callback method.
		*
		* @override
	*/
	Eplant.BaseViews.EFPView.prototype.active = function() {
		/* Call parent method */
		Eplant.View.prototype.active.call(this);
		if(!this.isLoadedData)
		{
			Eplant.queue.add(this.active, this,null,this.geneticElement.identifier+"_Loading");
		}
		if(this.magnification ===35){
			Eplant.activeSpecies.updateGlobalMax();
			Eplant.experimentSelectList.getSidebar().done($.proxy(function(domSideBar){
				$('#efp_experiement_list').css('width','150px');
				$('#efp_container').css('margin-left','150px');
				Eplant.experimentSelectList.updateActive(this.viewName);
			},this));
			
		}
		$('#efp_container').append(this.svgdom);
		$('#efp_container').append(this.labelDom);
		$(this.domDisplayTable).appendTo("#displayTableBody");
		$(this.labelDomClone).appendTo("#displayTableBody");
		if (this.isLegendVisible) {
			if(this.legend)
			this.legend.attach();
			if(this.geneDistributionChart)
			this.geneDistributionChart.attach();
		}
		
		$( this.svgdom).draggable();
		/* Update eFP */
		this.checkButtons();
		//this.updateDisplay();
		
	};
	
	Eplant.BaseViews.EFPView.prototype.makeDraggable = function() {
		var svgdom =$( this.svgdom)[0]
		svgdom.addEventListener('mousedown', mouseDown, false);
		window.addEventListener('mouseup', mouseUp, false);
		
		function mouseUp()
		{
			window.removeEventListener('mousemove', divMove, true);
		}
		
		function mouseDown(e){
			window.addEventListener('mousemove', divMove, true);
		}
		
		function divMove(e){
			var div = svgdom;
			div.style.position = 'absolute';
			div.style.top = e.clientY + 'px';
			div.style.left = e.clientX + 'px';
		}
		
	}
	
	
	
	Eplant.BaseViews.EFPView.prototype.afterActive = function() {
		Eplant.View.prototype.afterActive.call(this);
		$(this.svgdom).css({
			width: this.viewGlobalConfigs.width,
			height: this.viewGlobalConfigs.height,
			top: this.viewGlobalConfigs.top,
			left: this.viewGlobalConfigs.left
		});
		
	};
	
	/**
		* Clean up view.
		*
		* @override
	*/
	Eplant.BaseViews.EFPView.prototype.remove = function () {
		
		$(this.svgdom).remove();
		delete this.svgdom;
		$(this.domDisplayTable).remove();
		delete this.domDisplayTable;
		$(this.labelDomClone).remove();
		delete this.labelDomClone;
		$(this.geneDistributionChart).remove();
		delete this.geneDistributionChart;
		$(this.legend).remove();
		delete this.legend;
		// Call parent method
		Eplant.View.prototype.remove.call(this);
	};
	
	
	Eplant.BaseViews.EFPView.prototype.saveGlobalConfigs = function() {
		
		this.viewGlobalConfigs.width =$(this.svgdom).width();
		this.viewGlobalConfigs.height =$(this.svgdom).height();
		this.viewGlobalConfigs.top =$(this.svgdom).css('top');
		this.viewGlobalConfigs.left =$(this.svgdom).css('left');
		
		Eplant.View.prototype.saveGlobalConfigs.call(this);
		
	};
	
	Eplant.BaseViews.EFPView.prototype.generateScreenshotSvgStr = function(citation) {
		if(!this.isLoadedData) return;
		var returnedSvg = $(this.svgdom).clone();
		var viewBox = $(returnedSvg).prop("viewBox").baseVal;
		if(this.legend){
			$(this.legend.svg).clone().attr("y",viewBox.height-160+"").appendTo(returnedSvg);
		}
		
		if(this.geneDistributionChart){
			$(this.geneDistributionChart.svg).clone().attr({"y":viewBox.height-220+"","x":"-10"}).show().appendTo(returnedSvg);
		}
		$(this.getLabelSvg()).attr("y","20").appendTo(returnedSvg);
		if(citation){
			$('<text display="inline" fill="grey" stroke="" stroke-width="0.5" stroke-miterlimit="10" font-family="\'Helvetica\'" font-size="'+Math.round(viewBox.width/70)+'" y="20" x="0">'+citation+'</text>').attr({"y":viewBox.height-20+"","x":"170"}).appendTo(returnedSvg);
		}
		return $(returnedSvg)[0].outerHTML;
	};
	
	Eplant.BaseViews.EFPView.prototype.checkButtons = function() {
		if(this.modeButton&&Eplant.viewColorMode==="relative"){
			/* Update mode button */
			this.modeButton.setImageSource("app/img/efpmode-relative.png");
			this.modeButton.setDescription("Toggle data mode: relative.");
		}
		if(this.modeButton&&this.compareButton&&Eplant.viewColorMode==="compare"){
			/* Update mode button */
			this.modeButton.setImageSource("app/img/efpmode-relative.png");
			this.modeButton.setDescription("Data mode: compare. Click on Compare button to turn off.");
			
			/* Update compare button */
			this.compareButton.setImageSource("app/img/active/efpmode-compare.png");
			this.compareButton.setDescription("Turn off compare mode.");
		}
	};
	
	/**
		* Inactive callback method.
		*
		* @override
	*/
	Eplant.BaseViews.EFPView.prototype.inactive = function() {
		/* Call parent method */
		Eplant.View.prototype.inactive.call(this);
		if(this.infoButton){
			$(this.infoButton.domContainer).detach();
		}
		$('#efp_experiement_list').empty();
		$('#efp_experiement_list').css('width','0px');
		$('#efp_container').css('margin-left','0px');
		$(this.svgdom).detach();
		$(this.domDisplayTable).detach();
		$(this.labelDomClone).detach();
		$("#displayTableBody").empty();
		//$(this.labelDom).detach();
		if (this.tooltip) {
			this.tooltip.close();
			this.tooltip = null;
		}
		if (this.legend&&this.legend.isVisible) {
			if(this.legend){
				this.legend.detach();
			}
			
			if(this.geneDistributionChart){
				this.geneDistributionChart.detach();
			}
			
			
		}
	};
	
	/**
		* Creates view-specific UI buttons.
	*/
	Eplant.BaseViews.EFPView.prototype.createViewSpecificUIButtons = function() {
		/* Mode */
		if (this.isRelativeEnabled) {
			this.modeButton = new Eplant.ViewSpecificUIButton(
			"app/img/efpmode-absolute.png",		// imageSource
			"Toggle data mode: absolute.",	// Description
			function(data) {			// click
				/* Update button */
				if (Eplant.viewColorMode == "absolute") {
					Eplant.viewColorMode = "relative";
					this.setImageSource("app/img/efpmode-relative.png");
					this.setDescription("Toggle data mode: relative.");
				}
				else if (Eplant.viewColorMode == "relative" ||Eplant.viewColorMode == "compare") {
					Eplant.viewColorMode = "absolute";
					this.setImageSource("app/img/efpmode-absolute.png");
					this.setDescription("Toggle data mode: absolute.");
				}
				
				/* Update eFP */
				data.eFPView.updateDisplay();
				var event = new ZUI.Event("update-colors", Eplant, null);
				ZUI.fireEvent(event);
			},
			{
				eFPView: this
			}
			);
			this.viewSpecificUIButtons.push(this.modeButton);
			
		}
		
		/* Compare */
		if (this.isRelativeEnabled && this.isCompareEnabled) {
			this.compareButton = new Eplant.ViewSpecificUIButton(
			"app/img/unavailable/efpmode-compare.png",		// imageSource
			"Compare to another gene. Please load another gene first.",			// Description
			function(data) {				// click
				/* Check whether compare mode is already activated */
				
				if (Eplant.viewColorMode == "compare") {	// Yes
					/* Change mode to relative */
					Eplant.viewColorMode = "absolute";
					
					/* Update mode button */
					data.eFPView.modeButton.setImageSource("app/img/efpmode-absolute.png");
					data.eFPView.modeButton.setDescription("Toggle data mode: absolute.");
					/* Update compare button */
					if(data.eFPView.geneticElement.species.displayGeneticElements.length > 1){
						this.setImageSource("app/img/available/efpmode-compare.png");
						this.setDescription("Compare to another gene.");
					}
					else{
						this.setImageSource("app/img/unavailable/efpmode-compare.png");
						this.setDescription("Compare to another gene. Please load another gene first.");
					}
					
					
					/* Update eFP */
					data.eFPView.updateDisplay();
					var event = new ZUI.Event("update-colors", Eplant, null);
					ZUI.fireEvent(event);
				}
				else {		// No
					/* Create compare dialog */
					if(data.eFPView.geneticElement.species.displayGeneticElements.length > 1){
						var compareDialog = new Eplant.BaseViews.EFPView.CompareDialog(data.eFPView);
					}
				}
			},
			{
				eFPView: this
			}
			);
			this.viewSpecificUIButtons.push(this.compareButton);
			var eventListener = new ZUI.EventListener("remove-geneticElement", null, function(event, eventData, listenerData) {
				if (Eplant.viewColorMode !== "compare") {
					if(listenerData.view.geneticElement.species.displayGeneticElements.length > 2){
						
						listenerData.compareButton.setImageSource("app/img/unavailable/efpmode-compare.png");
						listenerData.compareButton.setDescription("Compare to another gene. Please load another gene first.");
					}
					else{
						listenerData.compareButton.setImageSource("app/img/available/efpmode-compare.png");
						listenerData.compareButton.setDescription("Compare to another gene.");
					}
				}
				}, {
				compareButton: this.compareButton,
				view:this
			});
			ZUI.addEventListener(eventListener);
			
			/* Update GeneticElement panel when the activeGeneticElement of activeSpecies changes */
			var eventListener = new ZUI.EventListener("add-geneticElement", null, function(event, eventData, listenerData) {
				if (!Eplant.viewColorMode == "compare") {
					if(listenerData.view.geneticElement.species.displayGeneticElements.length > 1){
						listenerData.compareButton.setImageSource("app/img/available/efpmode-compare.png");
						listenerData.compareButton.setDescription("Compare to another gene.");
					}
					else{
						listenerData.compareButton.setImageSource("app/img/unavailable/efpmode-compare.png");
						listenerData.compareButton.setDescription("Compare to another gene. Please load another gene first.");
					}
				}
				}, {
				compareButton: this.compareButton,
				view:this
			});
			ZUI.addEventListener(eventListener);
			
		}
		
		/* Mask */
		if (this.isMaskEnabled) {
		this.maskButton = new Eplant.ViewSpecificUIButton(
		"app/img/off/filter.png",		// imageSource
		"Mask data with below threshold confidence.",		// description
		function(data) {				// click
			/* Check whether masking is already on */
			if (Eplant.isMaskOn) {		// Yes
				/* Update button */
				this.setImageSource("app/img/off/filter.png");
				
				/* Turn off masking */
				Eplant.isMaskOn = false;
				
				/* Update eFP */
				data.eFPView.updateDisplay();
			}
			else {		// No
				/* Create mask dialog */
				var maskDialog = new Eplant.BaseViews.EFPView.MaskDialog(data.eFPView);
			}
		},
		{
			eFPView: this
		}
		);
		this.viewSpecificUIButtons.push(this.maskButton);
		
		
		
		}
		
		/* Legend */
		var viewSpecificUIButton = new Eplant.ViewSpecificUIButton(
		"app/img/legend.png",		// imageSource
		"Toggle legend.",		// description
		function(data) {		// click
			/* Check whether legend is showing */
			if (data.eFPView.legend.isVisible) {		// Yes
				this.setImageSource("app/img/off/legend.png");
				/* Hide legend */
				if(data.eFPView.legend){
					data.eFPView.legend.hide();
				}
				
				if(data.eFPView.geneDistributionChart){
					data.eFPView.geneDistributionChart.hide();
				}
				
				data.eFPView.isLegendVisible=false;
			}
			else {		// No
				this.setImageSource("app/img/on/legend.png");
				/* Show legend */
				if(data.eFPView.legend){
					data.eFPView.legend.show();
				}
				
				if(data.eFPView.geneDistributionChart){
					data.eFPView.geneDistributionChart.show();
				}
				
				data.eFPView.isLegendVisible=true;
			}
		},
		{
			eFPView: this
		}
		);
		this.viewSpecificUIButtons.push(viewSpecificUIButton);
		
		
		
		var viewSpecificUIButton = new Eplant.ViewSpecificUIButton(
		"app/img/palette.png",		// imageSource
		"Set eFP colors",		// description
		function(data) {		// click
			var paletteDialog = new Eplant.PaletteDialog();
		},
		{
			eFPView: this
		}
		);
		this.viewSpecificUIButtons.push(viewSpecificUIButton);
		
		
		
		var viewSpecificUIButton = new Eplant.ViewSpecificUIButton(
		"app/img/setting.png",		// imageSource
		"Change the Color Gradient Settings",		// description
		function(data) {		// click
			var globalColorModeDialog = new Eplant.GlobalColorModeDialog();
			
		},
		{
			eFPView: this
		}
		);
		this.viewSpecificUIButtons.push(viewSpecificUIButton);
		
	};
	
	Eplant.BaseViews.EFPView.prototype.downloadRawData = function() {
		if(this.rawSampleData){
			var downloadString = "";
			var currentdate = new Date();
			var datetime = "This file contains raw data downloaded from ePlant on " + currentdate.getDate() + "/"
			+ (currentdate.getMonth()+1)  + "/"
			+ currentdate.getFullYear() + " @ "
			+ currentdate.getHours() + ":"
			+ currentdate.getMinutes() + ":"
			+ currentdate.getSeconds();
			downloadString+=datetime+"\n";
			var labelText = this.geneticElement.identifier;
			if (this.geneticElement.aliases && this.geneticElement.aliases.length && this.geneticElement.aliases[0].length) {
				labelText += " / " + this.geneticElement.aliases.join(", ");
			}
			downloadString+=this.name+": "+labelText+"\n";
			
			downloadString+="URL: "+Eplant.urlForCurrentState()+"\n";
			downloadString+="JSON data: \n";
			downloadString+=this.rawSampleData;
			var blob = new Blob([downloadString], {type: "text/plain;charset=utf-8"});
			saveAs(blob, this.name+"-"+this.geneticElement.identifier+".txt");
		}
	};
	
	Eplant.BaseViews.EFPView.prototype.loadsvg = function() {
		
		this.Xhrs.loadsvgXhr = $.ajax({
			type: "GET",
			url: this.svgURL,
			success:$.proxy(function(data) {
				this.Xhrs.loadsvgXhr =null;
				// Get the SVG tag, ignore the rest
				var $svg = $(data).find('svg');
				//$("g", $svg).not('[id*=label],[id*=Label]').attr('stroke', "black");
				$("text", $svg).attr('stroke','');
				$("text", $svg).attr('fill','black');
				
				// Add replaced image's classes to the new SVG
				$svg = $svg.attr('class', 'efp-view-svg');
				// Remove any invalid XML tags as per http://validator.w3.org
				$svg = $svg.removeAttr('xmlns:a');
				
				// Replace image with new SVG
				//$img.replaceWith($svg);
				this.svgdom = $svg;
				this.isSvgLoaded=true;
			}, this)
		});
		
	};
	
	/**
		* Loads eFP definition and data.
	*/
	Eplant.BaseViews.EFPView.prototype.loadData = function() {
		var efp = this;
		/* Get eFP definition */
		this.Xhrs.loadDataXhr = $.ajax({
			type: "GET",
			url: this.xmlURL,
			dataType: "xml",
			success: $.proxy(function(response) {
				this.Xhrs.loadDataXhr =null; // Araport
				var infoXml = $(response).find('info');
				if (infoXml.length > 0) {
					this.infoHtml = infoXml.html();
					
				}
				this.database = null;
				if($(response).find('view')[0]&&$(response).find('view')[0].attributes['db'])this.database = $(response).find('view')[0].attributes['db'].value;
				
				var webServiceXml = $(response).find('webservice');
				if (webServiceXml.length > 0) {
					this.webService = Eplant.ServiceUrl +  webServiceXml.text();
					} else {
					if(this.database){
						
						this.webService = Eplant.ServiceUrl + "plantefp.cgi?datasource="+this.database+"&";
					}
					else{
						
						this.webService = Eplant.ServiceUrl + "plantefp.cgi?datasource=atgenexp_plus&";
					}
				}
				/* Prepare array for samples loading */
				var samples = [];
				
				/* Create labels */
				//this.labels = $(response).find('labels');
				
				
				/* Create groups */
				this.groups = [];
				var groupsXml = $(response).find('tissue');
				for (var n = 0; n < groupsXml.length; n++) {
					
					/* Get group data */
					var groupData = groupsXml[n];
					
					/* Asher: My solution is to have an if statement to read all control data for each group
						if (typeof groupData.control != 'undefined') {
						alert(groupData.control.id);
						}
					*/
					
					/* Create group object */
					var group = {
						id: groupData.attributes['id'].value,
						name: groupData.attributes['name'].value,
						samples: [],
						ctrlSamples: [],
						source: groupData.source,
						color: Eplant.Color.White,
						isHighlight: false,
						tooltip: null,
						fillColor: Eplant.Color.White,
						ePlantLink: groupData.attributes['ePlantLink']?groupData.attributes['ePlantLink'].value:null,
						link: $('link', groupData).attr('url'),
						database: this.database?this.database:'',
						colorKey:groupData.attributes['colorKey'].value
					};
					/* Prepare wrapper object for proxy */
					var wrapper = {
						group: group,
						eFPView: this
					};
					
					/* Prepare samples */
					var samplesXml = $('sample', groupData);
					for (var m = 0; m < samplesXml.length; m++) {
						var sample = {
							name: samplesXml[m].attributes['name'].value,
							value: null
						};
						
						/* Add it the samples array */
						samples.push(sample);
						
						/* Add to group samples */
						group.samples.push(sample);
					}
					
					/* Asher: Prepare samples for controls if it exists in the group */
					var controlsXml = $('sample', groupsXml);
					if (controlsXml !== undefined) {
						for (var m = 0; m < controlsXml.length; m++) {
							var sample = {
								name: controlsXml[m].attributes['name'].value,
								value: null
							};
							
							/* Add it the samples array */
							samples.push(sample);
							group.ctrlSamples.push(sample);
						}
					}
					
					/* Append group to array */
					this.groups.push(group);
					
				}
				this.InfoButtons = [];
				var InfoButtonsXml = $(response).find('InfoButton');
				for (var n = 0; n < InfoButtonsXml.length; n++) {
					var InfoButton = {
						id: InfoButtonsXml[n].attributes['id'].value,
						text: InfoButtonsXml[n].attributes['name'].value
					};
					this.InfoButtons.push(InfoButton);
				}
				
				/* Get sample values */
				/* Get sample names */
				var sampleNames = [];
				for (var n = 0; n < samples.length; n++) {
					if ($.inArray(samples[n].name, sampleNames) === -1) {
						sampleNames.push(samples[n].name);
					}
				}
				/* Prepare wrapper for proxy */
				var wrapper = {
					samples: samples,
					eFPView: this
				};
				/* Query */
				this.Xhrs.loadSamplesXhr = $.ajax({
					beforeSend: function(request) {
						request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
					},
					dataType: "json",
					type: "GET",
					url: this.webService + "id=" + this.geneticElement.identifier + "&samples=" + JSON.stringify(sampleNames), 
					success: $.proxy(function(response) {
						this.eFPView.Xhrs.loadSamplesXhr =null;
						var haveNulls = false;
						var numNulls = 0;
						for (var m = 0; m < response.length; m++) {
							if(response[m].value===null){
								numNulls++;
							}
						}
						if(((numNulls / response.length) >> 0)===1){
							haveNulls = true;
						}
						this.eFPView.rawSampleData= JSON.stringify(response);
						/* Match results with samples and copy values to samples */
						
						if(haveNulls){
							this.eFPView.errorLoadingMessage="The sample database does not have any information for this gene.";
						}
						else{
							for (var n = 0; n < this.samples.length; n++) {
								for (var m = 0; m < response.length; m++) {
									if (this.samples[n].name == response[m].name) {
										this.samples[n].value = Number(response[m].value);
										break;
									}
								}
							}
						}
						/* Process values */
						this.eFPView.processValues();
					}, wrapper)
				});
			}, this)
		});
	};
	
	Eplant.BaseViews.EFPView.prototype.loadFinish = function() {
		/* Call parent method */
		Eplant.View.prototype.loadFinish.call(this);
	};
	
	/**
		* Binds events.
	*/
	Eplant.BaseViews.EFPView.prototype.bindEvents = function() {
		/* update-annotationTags */
		this.updateAnnotationTagsEventListener = new ZUI.EventListener("update-annotationTags", this.geneticElement, function(event, eventData, listenerData) {
			/* Get EFPView */
			var eFPView = listenerData.eFPView;
			
			/* Update tags */
			eFPView.updateTags();
			}, {
			eFPView: this
		});
	};
	
	/**
		* Calculates useful information from raw values.
	*/
	Eplant.BaseViews.EFPView.prototype.processValues = function() {
		/* Processes raw values for a group */
		function processGroupValues() {
			var values = [];
			for (var n = 0; n < this.samples.length; n++) {
				var sample = this.samples[n];
				if (!isNaN(sample.value)) {
					values.push(sample.value);
				}
			}
			this.mean = Math.round(ZUI.Statistics.mean(values)* 100) / 100;
			this.n = values.length;
			this.stdev = Math.round(ZUI.Statistics.stdev(values)* 100) / 100;
			this.sterror = Math.round(ZUI.Statistics.sterror(values)* 100) / 100;
			
			if (this.ctrlSamples === undefined) {
				return;
			}
			
			/* Asher: Calculate the stats for group control */
			var values = [];
			for (var n = 0; n < this.ctrlSamples.length; n++) {
				var sample = this.ctrlSamples[n];
				if (!isNaN(sample.value)) {
					values.push(sample.value);
				}
			}
			if(values.length===0){
				this.ctrlMean = 0;
				this.ctrln = 0;
				this.ctrlStdev = 0;
				this.ctrlSterror = 0;
			}
			else{
				this.ctrlMean = Math.round(ZUI.Statistics.mean(values)* 100) / 100;
				this.ctrln = values.length;
				this.ctrlStdev = Math.round(ZUI.Statistics.stdev(values)* 100) / 100;
				this.ctrlSterror = Math.round(ZUI.Statistics.sterror(values)* 100) / 100;
			}
			
			
			this.log2Value = Math.round(ZUI.Math.log(this.mean / this.ctrlMean, 2) * 100) / 100;
			this.absLog2Value = this.log2Value<0?-this.log2Value:this.log2Value;
		}
		
		/* Groups */
		for (var n = 0; n < this.groups.length; n++) {
			var group = this.groups[n];
			Eplant.queue.add(processGroupValues, group,null,this.geneticElement.identifier+"_Loading");
		}
		/*Eplant.queue.add(function(){
			this.max = this.groups[0].mean;
			for (var n = 1; n < this.groups.length; n++) {
			var group = this.groups[n];
			if (group.mean > this.max) {
			this.max = group.mean;
			}
			}
			
		}, this);*/
		
		Eplant.queue.add(function(){
			this.max = this.groups[0].mean;
			for (var n = 1; n < this.groups.length; n++) {
				var group = this.groups[n];
				if (group.mean > this.max) {
					this.max = group.mean;
				}
			}
			
			if(this.geneDistributionChart){
				this.geneDistributionChart.update(this.max);
			}
			
			this.extremum = Math.abs(ZUI.Math.log(this.groups[0].mean / this.groups[0].ctrlMean, 2));
			for (var n = 1; n < this.groups.length; n++) {
				var group = this.groups[n];
				if (group.absLog2Value > this.extremum) {
					if (isNaN(group.absLog2Value) || !isFinite(group.absLog2Value)) {} else {
						this.extremum = group.absLog2Value;
					}
				}
			}
			
		}, this,null,this.geneticElement.identifier+"_Loading");
		/* Update eFP */
		//this.eFPView.updateDisplay();
		Eplant.queue.add(this.updateDisplay, this,null,this.geneticElement.identifier+"_Loading");
		
		
		
		/* bind events to svg elements eFP */
		//this.eFPView.bindSvgEvents();
		Eplant.queue.add(this.bindSvgEvents, this,null,this.geneticElement.identifier+"_Loading");
		/* Finish loading */
		//this.eFPView.loadFinish();
		//Eplant.queue.add(this.loadFinish, this);
	};
	
	
	
	Eplant.BaseViews.EFPView.prototype.getAbsoluteColor=function(group,max,minColor,maxColor){
		
		/* Get value ratio relative to maximum */
		var ratio = group.mean / max;
		var color;
		/* Check whether ratio is invalid */
		if (isNaN(ratio) || !isFinite(ratio)) { // Invalid
			color = '';
		}
		else
		{ // Valid
			if(ratio>1) ratio=1;
			var red = minColor.red + Math.round((maxColor.red - minColor.red) * ratio);
			var green = minColor.green + Math.round((maxColor.green - minColor.green) * ratio);
			var blue = minColor.blue + Math.round((maxColor.blue - minColor.blue) * ratio);
			color = ZUI.Util.makeColorString(red, green, blue);
		}
		
		return color?color:group.color;
	};
	Eplant.BaseViews.EFPView.prototype.getDisplayTable=function(group,max){
		/* Return if data are not loaded */
		if (!this.isLoadedData) {
			return;
		}
		this.domDisplayTable = document.createElement('div');
		$(this.domDisplayTable).append("<div class='row'><span class='col1' style='margin-left:28px;'><h4>Value</h4></span><span class='col2'><h4>Category</h4></span><span class='col3''><h4>Sample</h4></span></div>");
		
		// build the table
		for (var i = 0; i < this.groups.length; i++) {
			
			var color = this.groups[i].color;
			var value = this.groups[i].mean;
			var inputBox = '<span class="col1"><input class="selectionTableTextInput" style="background-color:'+color+';" size="8" maxlength="4" value="'+value+'"></input></span>';
			category = "<span class='col2'>"+this.name+'</span>';
			var sample = "<span class='col3' style='background-color:"+this.groups[i].color+"''>"+this.groups[i].name+"</span>";
			
			var row="<div class='row'>"+inputBox+category+sample+"</div>";
			$(this.domDisplayTable).append(row);
		}
		
		
	}
	
	/**
		* Updates eFP.
	*/
	Eplant.BaseViews.EFPView.prototype.updateDisplay = function() {
		/* Return if data are not loaded */
		/*if (!this.isLoadedData) {
			return;
			}
		*/
		/* Update eFP */
		
		
		/* Find extremum log2 value */
		if(this.errorLoadingMessage){
			for (var n = 0; n < this.groups.length; n++) {
				/* Get group */
				var group = this.groups[n];
				
				group.color = this.errorColor;
				
				
				/* Set color of ViewObject */
				$("#" + group.id + "", this.svgdom).find("*").attr('fill', group.color);
				$("#" + group.id + "", this.svgdom).attr('fill', group.color);
				$("#" + group.id + " *", this.svgdom).attr('stroke-width', '0');
			}
		}
		else if (Eplant.viewColorMode == "relative") {
			var extremum=this.extremum;
			switch(Eplant.globalColorMode){
				case "absolute" :
				/*if(Eplant.experimentColorMode==="all"&&this.magnification===35){
					extremum= this.geneticElement.experimentViewExtremum;
					}
				else{*/
				extremum = this.extremum;
				break;
				case "globalAbsolute" :
				if(!this.geneticElement.species.extremum){
					extremum = this.extremum;
				}
				else if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.viewName!="CellView"){
					extremum= this.geneticElement.species.extremum;//experimentViewExtremum;
				}
				else{
					extremum = this.geneticElement.species.geneticViewExtremum[this.viewName];
				}
				
				break;
				case "customAbsolute" :
				if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.viewName!="CellView"){
					extremum = Eplant.customGlobalExtremum;
				}
				else{
					extremum = this.geneticElement.species.geneticViewExtremum[this.viewName];
				}
				
				
				break;
				default:
				extremum = this.extremum;
				break;
			}
			
			/* Color groups */
			var minColor = ZUI.Util.getColorComponents(Eplant.minColor);
			var midColor = ZUI.Util.getColorComponents(Eplant.midColor);
			var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);
			for (var n = 0; n < this.groups.length; n++) {
				/* Get group */
				var group = this.groups[n];
				/*var log2Value = ZUI.Math.log(group.mean / group.ctrlMean, 2);
					group.log2Value = log2Value;
				/* Get log2 value ratio relative to extremum */
				var ratio = group.log2Value / extremum;
				
				/* Check whether ratio is invalid */
				if (isNaN(ratio) || !isFinite(ratio)) { // Invalid
					group.color = this.errorColor;
					} else { // Valid
					var color1, color2;
					if (ratio < 0) {
						color1 = midColor;
						color2 = minColor;
						ratio *= -1;
						} else {
						color1 = midColor;
						color2 = maxColor;
					}
					if(ratio>1)ratio=1;
					var red = color1.red + Math.round((color2.red - color1.red) * ratio);
					var green = color1.green + Math.round((color2.green - color1.green) * ratio);
					var blue = color1.blue + Math.round((color2.blue - color1.blue) * ratio);
					group.color = ZUI.Util.makeColorString(red, green, blue);
				}
				
				/* Set color of ViewObject */
				$("#" + group.id + "", this.svgdom).find("*").attr('fill', group.color);
				$("#" + group.id + "", this.svgdom).attr('fill', group.color);
				$("#" + group.id + " *", this.svgdom).attr('stroke-width', '0');
			}
		}
		else if (Eplant.viewColorMode == "absolute") {
			/* Find maximum value */
			var max = this.max;
			switch(Eplant.globalColorMode){
				case "absolute" :
				/*if(Eplant.experimentColorMode==="all"&&this.magnification===35){
					max= this.geneticElement.experimentViewMax;
					}
				else{*/
				max = this.max;
				break;
				case "globalAbsolute" :
				if(!this.geneticElement.species.max){
					max = this.max;
				}
				else if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.viewName!="CellView"){
					max= this.geneticElement.species.max;//experimentViewMax;
				}
				else{
					max = this.geneticElement.species.geneticViewMax[this.viewName];
				}
				break;
				case "customAbsolute" :
				if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.viewName!="CellView"){
					max = Eplant.customGlobalMax;
				}
				else{
					max = this.geneticElement.species.geneticViewMax[this.viewName];
				}
				
				break;
				default:
				max = this.eFPView.max;
				break;
			}
			
			/* Color groups */
			var minColor = ZUI.Util.getColorComponents(Eplant.midColor);
			var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);
			for (var n = 0; n < this.groups.length; n++) {
				/* Get group */
				var group = this.groups[n];
				group.color = this.getAbsoluteColor(group,max,minColor,maxColor);
				
				/* Set color of ViewObject */
				$("#" + group.id + "", this.svgdom).find("*").attr('fill', group.color);
				$("#" + group.id + "", this.svgdom).attr('fill', group.color);
				$("#" + group.id + " *", this.svgdom).attr('stroke-width', '0');
			}
		}
		else if (Eplant.viewColorMode == "compare") {
			
			this.compare(Eplant.compareGeneticElement);
			
			
			/* Find extremum log2 value */
			var extremum ;
			if(Eplant.compareGeneticElement.identifier===this.geneticElement.identifier){
				extremum=this.extremum;
			}
			else{
				extremum = Math.abs(ZUI.Math.log(this.groups[0].mean / this.compareEFPView.groups[0].mean, 2));
				for (var n = 1; n < this.groups.length; n++) {
					var group = this.groups[n];
					var compareGroup = this.compareEFPView.groups[n];
					var absLog2Value = Math.abs(ZUI.Math.log(group.mean / compareGroup.mean, 2));
					if (absLog2Value > extremum) {
						extremum = absLog2Value;
					}
				}
				
			}
			
			
			/* Color groups */
			var minColor = ZUI.Util.getColorComponents(Eplant.minColor);
			var midColor = ZUI.Util.getColorComponents(Eplant.midColor);
			var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);
			for (var n = 0; n < this.groups.length; n++) {
				/* Get group */
				var group = this.groups[n];
				var compareGroup = this.compareEFPView.groups[n];
				
				/* Get log2 value relative to control */
				var log2Value = ZUI.Math.log(group.mean / compareGroup.mean, 2);
				
				/* Get log2 value ratio relative to extremum */
				var ratio = log2Value / extremum;
				
				/* Check whether ratio is invalid */
				if (isNaN(ratio) || !isFinite(ratio)) { // Invalid
					group.color = this.errorColor;
					} else { // Valid
					var color1, color2;
					if (ratio < 0) {
						color1 = midColor;
						color2 = minColor;
						ratio *= -1;
						} else {
						color1 = midColor;
						color2 = maxColor;
					}
					var red = color1.red + Math.round((color2.red - color1.red) * ratio);
					var green = color1.green + Math.round((color2.green - color1.green) * ratio);
					var blue = color1.blue + Math.round((color2.blue - color1.blue) * ratio);
					group.color = ZUI.Util.makeColorString(red, green, blue);
				}
				
				/* Set color of ViewObject */
				$("#" + group.id + "", this.svgdom).find("*").attr('fill', group.color);
				$("#" + group.id + "", this.svgdom).attr('fill', group.color);
				$("#" + group.id + " *", this.svgdom).attr('stroke-width', '0');
			}
		}
		
		/* Apply masking */
		if (Eplant.isMaskOn) {
			for (var n = 0; n < this.groups.length; n++) {
				var group = this.groups[n];
				if (isNaN(group.sterror) || group.sterror >= group.mean * Eplant.maskThreshold) {
					group.color = this.maskColor;
					$("#" + group.id + "", this.svgdom).find("*").attr('fill', group.color);
					$("#" + group.id + "", this.svgdom).attr('fill', group.color);
					$("#" + group.id + " *", this.svgdom).attr('stroke-width', '0');
				}
			}
		}
		/* Update legend */
		this.legend.update();
		if(this.svgdom){
			var snapshot = this.svgdom.clone().css({width:'100%',height:'80%',left:0,top:0});
			$('text',snapshot).remove();
			if ($(this.svgImage,document).length>0) {
				$(this.svgImage).replaceWith(snapshot);
			}
			this.svgImage= snapshot;
			
		}
		if(!this.isLoadedData){
			this.loadFinish();
		}
	};
	
	Eplant.BaseViews.EFPView.prototype.getTooltipContent = function(group) {
		return '' + group.name + '</br>Level: ' + group.mean + ', SD: ' + group.stdev + '</br>Sample Size: ' + group.samples.length + '';
	};
	Eplant.BaseViews.EFPView.prototype.bindSvgEvents = function() {
		
		if (this.groups) {
			for (var n = 0; n < this.groups.length; n++) {
				var group = this.groups[n];
				
				var obj = {
					group:group,
					view:this,
					tooltipText:this.getTooltipContent(group)
				};
				
				
				$("#" + group.id, this.svgdom).click($.proxy(function( event ) {
					event.preventDefault();
					
					var div = document.createElement("div");
					var info = document.createElement("div");
					$(info).html(this.tooltipText);
					$(div).append(info);
					
					var EAViewName = Eplant.expressionAnglerViewNameMap[this.view.viewName];
					/*if(EAViewName)
						{
						$(div).append(document.createElement("br"));
						var a1 = $('<a></a>',{
						text: 'Find genes that are highly expressed in this sample',
						'class': ''
						}).appendTo(div).css({
						'font-size': '13px',
						'margin-top': '5px',
						color:'#99cc00'
						});
						
						$(a1).click($.proxy(function() {
						if(this.view.linkDialog)this.view.linkDialog.close();
						Eplant.ExpressionAngler.generateStandardSearchQuery(EAViewName,this.view,this.group,true);
						},this));
					}*/
					if(EAViewName)
					{
						$(div).append(document.createElement("br"));
						var a1 = $('<a></a>',{
							text: 'Find genes that are specifically expressed in this sample',
							'class': ''
							}).appendTo(div).css({
							'font-size': '13px',
							'margin-top': '5px',
							color:'#99cc00'
						});
						
						$(a1).click($.proxy(function() {
							if(this.view.linkDialog)this.view.linkDialog.close();
							Eplant.ExpressionAngler.generateStandardSearchQuery(EAViewName,this.view,this.group,false);
						},this));
					}
					if(this.group.link)
					{
						$(div).append(document.createElement("br"));
						var a1 = $('<a></a>',{
							text: 'Open NASCArrays Information in a separate window',
							'class': ''
							}).appendTo(div).css({
							'font-size': '13px',
							'margin-top': '5px',
							color:'#99cc00'
						});
						
						$(a1).click($.proxy(function() {
							window.open(this.group.link, '_blank');
						},this));
					}
					if(Eplant.citations[Eplant.activeSpecies.scientificName][this.view.name]){
						$(div).append(document.createElement("br"));
						var a1 = $('<a></a>',{
							text: 'Get citation information for this view',
							'class': ''
							}).appendTo(div).css({
							'font-size': '13px',
							'margin-top': '5px',
							color:'#99cc00'
						});
						
						$(a1).click($.proxy(function() {
							if(this.showCitation){
								this.showCitation()
							}
							else{
								Eplant.showCitation();
							}
						},this.view));
					}
					if(this.view.rawSampleData){
						$(div).append(document.createElement("br"));
						var a1 = $('<a></a>',{
							text: 'Get raw data for this view',
							'class': ''
							}).appendTo(div).css({
							'font-size': '13px',
							'margin-top': '5px',
							color:'#99cc00'
						});
						
						$(a1).click($.proxy(function() {
							
							this.downloadRawData()
							
						},this.view));
					}
					
					
					if(this.group.ePlantLink && this.view.geneticElement.views[this.group.ePlantLink])
					{
						$(div).append(document.createElement("br"));
						var a2 = $('<a></a>',{
							text: 'Zoom to '+this.group.ePlantLink+' viewer',
							'class': ''
							}).appendTo(div).css({
							'font-size': '13px',
							'margin-top': '5px',
							color:'#99cc00'
						});
						$(a2).click($.proxy(function() {
							Eplant.changeActiveView(this.view.geneticElement.views[this.group.ePlantLink]);
							if(this.view.linkDialog)this.view.linkDialog.close();
						},this));
					}
					
					this.view.linkDialog = DialogManager.artDialogDynamic(div);
					
					
				},obj));
				
				$("#" + group.id, this.svgdom).on({
					mouseleave: function(event) {
						if($(event.currentTarget).attr('fill')){
							$("*", event.currentTarget).attr('stroke-width', "0");
						}
					},
					mouseover: function() {
						$("*", this).attr('stroke-width', "1");
					}
				});
				$("#" + group.id, this.svgdom).qtip({
					content: {
						text: obj.tooltipText
					},
					style: {
						classes: 'qtip-bootstrap',
						tip: {
							corner: true,
							width: 20,
							height:10
						}
					},
					position:{
						viewport: $(window),
						my:"center left",
						at:"center right",
						target: 'mouse', // Track the mouse as the positioning target
						adjust: {
							method: 'none shift',
							x: +5
							
						} // Offset it slightly from under the mouse
					},
					events: {
						show: $.proxy(function(event, api) {
							var content = this.tooltipText;
							if(Eplant.viewColorMode == "relative"){
								if(this.log2Value){
									content += "</br>Log2 Ratio relative to control: " + this.group.log2Value;
									api.tooltip.css({
										width:"265px"
									});
								}
								else{
									api.tooltip.css({
										width:"200px"
									});
								}
								
							}
							else{
								api.tooltip.css({
									width:"200px"
								})
							}
							api.set('content.text', content);
							
						},obj),
						hide: function(event, api) {
						}
					}
					
				});
			}
		}
		if (this.InfoButtons) {
			for (var n = 0; n < this.InfoButtons.length; n++) {
				var InfoButton = this.InfoButtons[n];
				
				$("#" + InfoButton.id, this.svgdom).qtip({
					content: {
						text: InfoButton.text
					},
					style: {
						classes: 'qtip-bootstrap',
						tip: {
							corner: true,
							width: 20,
							height:10
						}
					},
					position:{
						viewport: $(window),
						my:"center left",
						at:"center right",
						target: 'mouse', // Track the mouse as the positioning target
						adjust: {
							method: 'none shift',
							x: +5
							
						} // Offset it slightly from under the mouse
					},
					events: {
						show: function(event, api) {
							
						},
						hide: function(event, api) {
						}
					}
					
				});
			}
		}
	};
	
	
	/**
		* Activates compare mode and compares data of this GeneticElement to the specified GeneticElement.
	*/
	Eplant.BaseViews.EFPView.prototype.compare = function(geneticElement) {
		/* Confirm GeneticElement that is compared to has views loaded */
		if (!geneticElement.isLoadedEFPViewsData) {
			alert("Please load data for " + geneticElement.identifier + " first.");
			return;
		}
		
		/* Get name of the eFP view */
		var viewName = Eplant.getViewName(this);
		
		/* Switch to compare mode */
		this.compareEFPView = geneticElement.views[viewName];
		Eplant.viewColorMode = "compare";
		if(this.modeButton){
			/* Update mode button */
			this.modeButton.setImageSource("app/img/efpmode-relative.png");
			this.modeButton.setDescription("Data mode: compare. Click on Compare button to turn off.");
			
		}
		if(this.compareButton){
			/* Update compare button */
			this.compareButton.setImageSource("app/img/active/efpmode-compare.png");
			this.compareButton.setDescription("Turn off compare mode.");
		}
		/* Update eFP */
		//this.updateDisplay();
	};
	
	Eplant.BaseViews.EFPView.prototype.zoomIn = function() {
		var relativePercentage = ($(this.svgdom).width() / $(this.svgdom).parent('div').width()) * 100;
		var leftPercentage = (parseInt($(this.svgdom).css('left').replace('auto', '0')) / $(this.svgdom).parent('div').width()) * 100;
		var topPercentage = (parseInt($(this.svgdom).css('top').replace('auto', '0')) / $(this.svgdom).parent('div').height()) * 100;
		$(this.svgdom).stop().animate({
			width: (relativePercentage + 4) + "%",
			height: (relativePercentage + 4) + "%",
			left: (leftPercentage - 2) + "%",
			top: (topPercentage - 2) + "%"
		}, 100);
		return true;
	};
	
	Eplant.BaseViews.EFPView.prototype.zoomOut = function() {
		var relativePercentage = ($(this.svgdom).width() / $(this.svgdom).parent('div').width()) * 100;
		var leftPercentage = (parseInt($(this.svgdom).css('left').replace('auto', '0')) / $(this.svgdom).parent('div').width()) * 100;
		var topPercentage = (parseInt($(this.svgdom).css('top').replace('auto', '0')) / $(this.svgdom).parent('div').height()) * 100;
		$(this.svgdom).stop().animate({
			width: (relativePercentage - 4) + "%",
			height: (relativePercentage - 4) + "%",
			left: (leftPercentage + 2) + "%",
			top: (topPercentage + 2) + "%"
		}, 100);
		return true;
	};
	
	/**
		* Returns The exit-out animation configuration.
		*
		* @override
		* @return {Object} The exit-out animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getExitOutAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitOutAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.svgdom).stop().animate({
				width: "0%",
				height: "0%",
				left: "50%",
				top: "50%"
			}, 1000);
		}, this);
		return config;
	};
	
	/**
		* Returns The enter-out animation configuration.
		*
		* @override
		* @return {Object} The enter-out animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getEnterOutAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterOutAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			if(this.transitionCenter){
				$(this.svgdom).css({
					width: "100%",
					height: "100%",
					left: "0%",
					top: "0%",
				}, 1000);
				var box = $(this.transitionCenter)[0].getBoundingClientRect();
				var width = box.right-box.left;
				var height = box.bottom-box.top;
				var center = {
					left:width/2+$(this.transitionCenter).position().left,
					top:height+$(this.transitionCenter).position().top
				};
				var halfWidth = $(this.svgdom).width()/2;
				var leftPercentOffset = (halfWidth - center.left)/$(this.svgdom).width()*1000;
				var halfHeight = $(this.svgdom).width()/2;
				var topPercentOffset = (halfHeight - center.top)/$(this.svgdom).width()*1000;
				$(this.svgdom).css({
					width: "1000%",
					height: "1000%",
					left: -450+leftPercentOffset+"%",
					top: -450+topPercentOffset+"%",
				}, 1000);
			}
			else{
				$(this.svgdom).css({
					width: "1000%",
					height: "1000%",
					left: -450+"%",
					top: -450+"%",
				}, 1000);
			}
			$(this.svgdom).stop().animate({
				width: this.viewGlobalConfigs.width,
				height: this.viewGlobalConfigs.height,
				top: this.viewGlobalConfigs.top,
				left: this.viewGlobalConfigs.left
			}, 1000);
		}, this);
		return config;
	};
	
	/**
		* Returns The exit-in animation configuration.
		*
		* @override
		* @return {Object} The exit-in animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getExitInAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitInAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			if(this.transitionCenter){
				var box = $(this.transitionCenter)[0].getBoundingClientRect();
				var width = box.right-box.left;
				var height = box.bottom-box.top;
				var center = {
					left:width/2+$(this.transitionCenter).position().left,
					top:height+$(this.transitionCenter).position().top
				};
				var halfWidth = $(this.svgdom).width()/2;
				var leftPercentOffset = (halfWidth - center.left)/$(this.svgdom).width()*1000;
				var halfHeight = $(this.svgdom).width()/2;
				var topPercentOffset = (halfHeight - center.top)/$(this.svgdom).width()*1000;
				$(this.svgdom).stop().animate({
					width: "1000%",
					height: "1000%",
					left: -450+leftPercentOffset+"%",
					top: -450+topPercentOffset+"%",
				}, 1000);
			}
			else{
				$(this.svgdom).stop().animate({
					width: "1000%",
					height: "1000%",
					left: -450+"%",
					top: -450+"%",
				}, 1000);
			}
			
		}, this);
		return config;
	};
	
	/**
		* Returns The enter-in animation configuration.
		*
		* @override
		* @return {Object} The enter-in animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getEnterInAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterInAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.svgdom).css({
				width: "0%",
				height: "0%",
				left: "50%",
				top: "50%"
			});
			$(this.svgdom).stop().animate({
				width: this.viewGlobalConfigs.width,
				height: this.viewGlobalConfigs.height,
				top: this.viewGlobalConfigs.top,
				left: this.viewGlobalConfigs.left
			}, 1000);
		}, this);
		return config;
	};
	
	/**
		* Returns The exit-right animation configuration.
		*
		* @override
		* @return {Object} The exit-right animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getExitDownAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitDownAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.svgdom).css({
				width: "100%",
				height: "100%",
				left: "0%",
				top: "0%"
			});
			$(this.svgdom).stop().animate({
				top: "300%"
			}, 1000);
		}, this);
		return config;
	};
	
	/**
		* Returns The enter-right animation configuration.
		*
		* @override
		* @return {Object} The enter-right animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getEnterDownAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterDownAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.svgdom).css({
				width: "100%",
				height: "100%",
				left: "0%",
				top: "-300%"
			});
			$(this.svgdom).stop().animate({
				width: "100%",
				height: "100%",
				top: "0%"
			}, 1000);
		}, this);
		return config;
	};
	
	/**
		* Returns The exit-right animation configuration.
		*
		* @override
		* @return {Object} The exit-right animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getExitUpAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitUpAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.svgdom).css({
				width: "100%",
				height: "100%",
				left: "0%",
				top: "0%"
			});
			$(this.svgdom).stop().animate({
				top: "-300%"
			}, 1000);
		}, this);
		return config;
	};
	
	/**
		* Returns The enter-right animation configuration.
		*
		* @override
		* @return {Object} The enter-right animation configuration.
	*/
	Eplant.BaseViews.EFPView.prototype.getEnterUpAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterUpAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.svgdom).css({
				width: "100%",
				height: "100%",
				left: "0%",
				top: "300%"
			});
			$(this.svgdom).stop().animate({
				width: "100%",
				height: "100%",
				top: "0%"
			}, 1000);
		}, this);
		return config;
	};
	
})();
