(function() {
	
	/**
		* Eplant namespace
		* By Hans Yu
		*
		* This namespace is for the ePlant core.
		*
		* @namespace
	*/
	Eplant = {};
	
	/* Constants */
	Eplant.ServiceUrl = 'https://api.araport.org/community/v0.3/asher-live/eplant_service_v0.6/access/'; // Base services url
	ExpressionAnglerUrl = 'https://api.araport.org/community/v0.3/asher-live/expression_angler_service_v0.3/access/'; // Expression Angler URL

	Eplant.Year = "2017";
	Eplant.Authours = "Waese, Fan, Yu, Pasha & Provart";
	Eplant.AuthoursW = "Waese et al.";
	/* Attributes */
	Eplant.species = []; // Array of Species objects
	Eplant.activeSpecies = null; // Species that is under active study
	Eplant.views = null; // Object container for Views associated with ePlant
	Eplant.isLoadedViews = false; // Whether Views are loaded
	Eplant.isLoadedSpecies = false; // Whether Species are loaded
	Eplant.isAnimateActiveViewChange = true; // Whether activeView changes are animated
	Eplant.showViewIntruction = true; // Whether activeView changes are animated
	Eplant.isFirstLoad = false;
	Eplant.viewSpecificUIButtonsContainer = null; // DOM container for ViewSpecificUIButtons
	Eplant.isTooltipOn = true; // Whether tooltips are enabled
	Eplant.history = null; // Keeps track of history
	Eplant.activeView = null; // Active view
	Eplant.activeViews = {}; // Active views
	Eplant.activeTabId = null; // Active Tab
	Eplant.viewLoadTimeout = null; // time out for loading active view
	Eplant.viewLoadTick = 0 ;
	Eplant.identifierQuery = []; // Identifier array
	Eplant.zoomTimeout = null; // Zooming process timeout
	/* icon dock related */
	Eplant.iconList = []; // View Icon List
	Eplant.iconIndex = 0; // Index used for carousel
	Eplant.visibleIcons = 0; // Number of visible icons in the carousel
	/* RSVP related */
	Eplant.RSVPOn = false; // Is RSVP mode on or not
	Eplant.RSVPOnMode = 1; // hover mode
	Eplant.geneticElementPanelMapOn = false; // Is RSVP mode on or not
	Eplant.RSVPSpeed = 100; // RSVP transition time interval, .5 seconds by default
	Eplant.RSVPTimeout = null; // RSVP Timeout storing variable
	Eplant.smallMultipleOn=false;
	Eplant.geneLoadingTimeout = null; //Gene panel loading Timeout storing variable
	Eplant.genesAllLoaded = true;
	Eplant.sidebarOpen = true;
	Eplant.globalViewConfigs = {}; //global configs for each view
	Eplant.expressionAnglerDbMap = [];
	Eplant.maskColor = "#B4B4B4"; // Maximum color
	Eplant.minColor = "#0000FF"; // Minimum color
	Eplant.midColor = "#FFFF00"; // Middle color
	Eplant.maxColor = "#FF0000"; // Maximum color
	
	Eplant.citations = {};
	
	Eplant.viewInstructions={};
	Eplant.globalColorMode = "globalAbsolute";
	Eplant.viewColorMode = "absolute";
	Eplant.experimentColorMode = "all";
	Eplant.customGlobalExtremum = 5;
	Eplant.customGlobalMax = 1000;
	Eplant.globalSettingMin=1;
	Eplant.globalSettingMax=100;
	Eplant.isMaskOn = false; // Whether masking is on
	Eplant.maskThreshold = 1; // Masking threshold
	Eplant.isMaskEnabled = true; // Whether masking is enabled
	Eplant.MoleculeViewTooltip = null;
	Eplant.updatingColors = false;
	
	Eplant.loadingDialog = null;
	
	Eplant.viewPortTopOffset=84;
	/**
		* Initializes ePlant
	*/
	Eplant.initialize = function() {
		Eplant.loadSharedResources();
		
		/* Initialize ZUI */
		ZUI.initialize({
			canvas: document.getElementById("ZUI_canvas"),
			background: "#ffffff",
			backgroundAlpha: 0,
			frameRate: 45,
			cameraMoveRate: 0.25,
			width: width,
			height: height
		});
		
		Eplant.EFPViewsCount = 0;
		Eplant.geneticElementViewsCount = 0;
		/* Initialize View modules */
		for (var ViewName in Eplant.Views) {
			/* Get View constructor */
			var View = Eplant.Views[ViewName];
			if(View.isEFPView) Eplant.EFPViewsCount++;
			if(View.hierarchy ==="genetic element")Eplant.geneticElementViewsCount++;
			/* Initialize */
			if (View.initialize) {
				View.initialize();
			}
			
			
		}
		Eplant.eachEFPViewAsPercent = 1/Eplant.EFPViewsCount;
		Eplant.eachGeneticViewAsPercent = 1/Eplant.geneticElementViewsCount;
		
		
		
		/* Sort Views by magnification (ascending) */
		var sortedViewNames = [];
		for (var ViewName in Eplant.Views) {
			sortedViewNames.push(ViewName);
		}
		sortedViewNames.sort(function(a, b) {
			return (Eplant.Views[a].magnification - Eplant.Views[b].magnification);
		});
		/* Add View icons to the dock */
		if(sortedViewNames.length>0){
			var lastMagnification = Eplant.Views[sortedViewNames[0]].magnification;
			for (var n = 0; n < sortedViewNames.length; n++) {
				/* Get View constructor */
				var ViewName = sortedViewNames[n];
				/* Skip the Species View in the Dock. Can't change species if we selected a species */
				if (ViewName === "SpeciesView") {
					continue;
				}
				
				var View = Eplant.Views[sortedViewNames[n]];
				
				/* Skip eFP experimental views */
				if (View.magnification === 35) {
					continue;
				}
				
				/* Append line break if magnification level is higher
					if (Math.floor(View.magnification) > Math.floor(lastMagnification)) {
					var br = document.createElement("br");
					$("#navigationContainer").append(br);
				}*/
				lastMagnification = View.magnification;
				
				/* Create and append icon */
				var icon = document.createElement("div");
				icon.id = ViewName + "Icon";
				icon.className = "icon hint--right hint--success hint-rounded";
				icon.setAttribute("data-hint", View.description);
				icon.setAttribute("title", View.description);
				icon.setAttribute("data-enabled", "false");
				/*if(ViewName=="ExperimentView")
					{
					icon.setAttribute("data-dropdown", "#dropdown-experiment");
				}*/
				icon.onclick = function() {
					
					/* Get icon id */
					var id = this.id;
					
					/* Get View name */
					var ViewName = id.substring(0, id.length - 4);
					
					/* Get View */
					var view = null;
					if (Eplant.Views[ViewName].hierarchy == "ePlant") {
						view = Eplant.views[ViewName];
					}
					else if (Eplant.Views[ViewName].hierarchy == "species") {
						view = Eplant.activeSpecies.views[ViewName];
					}
					else if (Eplant.Views[ViewName].hierarchy == "genetic element") {
						view = Eplant.activeSpecies.activeGeneticElement.views[ViewName];
					}
					
					/* Set View to activeView */
					if (view && view.isLoadedData) {
						if(ViewName=="ExperimentView")
						{
							Eplant.searchForActiveView("TissueSpecificEmbryoDevelopmentView");
							//view =Eplant.activeSpecies.activeGeneticElement.views.TissueSpecificEmbryoDevelopmentView;
						}
						else if(ViewName=="LinkoutView")
						{
							view.show();
						}
						else
						{
							Eplant.changeActiveView(view);
						}
					}
				};
				var img = document.createElement("img");
				img.src = View.unavailableIconImageURL;
				$(icon).append(img);
				$("#navigationContainer").append(icon);
				Eplant.iconList.push("#" + icon.id);
			}
		}
		/* Get ViewSpecificUIButtons container */
		Eplant.viewSpecificUIButtonsContainer = document.getElementById("viewSpecificUI");
		
		// Initialize history tracker
		this.history = new Eplant.History();
		
		/* Load Views */
		Eplant.loadViews();
		
		
		
		/* Bind Events */
		Eplant.bindUIEvents();
		Eplant.bindEvents();
		
		/* Find and set the entry View
			for (var ViewName in Eplant.views) {
			var view = Eplant.views[ViewName];
			if (view.isEntryView) {		// Found
			//Set active view
			ZUI.changeActiveView(view);
			
			//End search
			break;
			}
			}
		*/
		/* Change to HomeView */
		Eplant.experimentSelectList = new Eplant.ExperimentSelectList();
		if(Eplant.views["HomeView"]){
			Eplant.activeView = Eplant.views["HomeView"];
			Eplant.changeActiveView(Eplant.views["HomeView"],'tabs-1');
		}
		$(".hiddenInSpeciesView").css("visibility", "visible");
		$(".hiddenInSpeciesView").css("opacity", "1");
		
		Eplant.resizeIconDock();
		Eplant.updateIconDock();
		Eplant.resize();
		Eplant.loadUrlData();
		TabManager.initialize();
		
		
		
		/* Load species data */
		Eplant.loadSpecies();
		Eplant.loadCitations();
	};
	
	Eplant.loadSharedResources = function(){
		if(!Eplant.BaseViews.EFPView.GeneDistributionChart.svgDom){
			$.get("app/data/experiment/GeneDistributionChart.svg", function(data) {
				Eplant.BaseViews.EFPView.GeneDistributionChart.svgDom = $(data).find('svg');
			});
		}
		$.getJSON( "app/data/expressionAngler/viewsMap.json", function( data ) {
			Eplant.expressionAnglerDbMap= data;
		});
		$.getJSON( "app/data/expressionAngler/viewNameMap.json", function( data ) {
			Eplant.expressionAnglerViewNameMap= data;
		});
	};
	
	
	
	Eplant.getUrlParameter = function(name) {
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	};
	Eplant.urlForCurrentState = function() {
		var hasQueryString = false;
		var geneIdentifiers;
		var activeSpeciesName = Eplant.activeSpecies.scientificName;
		var url = [location.protocol, '//', location.host, location.pathname].join('');
		if(Eplant.activeSpecies)
		{
			url += hasQueryString ? '&' : '?';
			url += 'ActiveSpecies=' + Eplant.activeSpecies.scientificName.replace(/ /g,"%20");
			hasQueryString=true;
			
			geneIdentifiers = $.map(Eplant.activeSpecies.displayGeneticElements,function(value, index) {
				return value.identifier;
			}).join(',');
		}
		if(geneIdentifiers && geneIdentifiers !== '')
		{
			url += hasQueryString ? '&' : '?';
			url+= 'Genes='  + geneIdentifiers;
			hasQueryString=true;
		}
		if(Eplant.activeSpecies.activeGeneticElement)
		{
			url += hasQueryString ? '&' : '?';
			url+= 'ActiveGene='  + Eplant.activeSpecies.activeGeneticElement.identifier;
			hasQueryString=true;
		}
		if(Eplant.activeView)
		{
			
			url += hasQueryString ? '&' : '?';
			url+= 'ActiveView='  + Eplant.getViewName(Eplant.activeView);
			hasQueryString=true;
		}
		return url;
	};
	
	Eplant.loadUrlData = function() {
		var ActiveSpeciesToLoaded = Eplant.getUrlParameter('ActiveSpecies');
		var GeneListString = Eplant.getUrlParameter('Genes'), GeneListToLoaded;
		if(GeneListString)
		{
			var GeneListToLoaded = GeneListString.split(',');
		}
		if(ActiveSpeciesToLoaded)
		{
			
			ZUI.removeEventListener(new ZUI.EventListener("load-species"));
			var eventListener = new ZUI.EventListener("load-species", null, function(event, eventData, listenerData) {
				Eplant.setActiveSpecies(Eplant.getSpeciesByScientificName(ActiveSpeciesToLoaded));
				Eplant.queryIdentifier(GeneListToLoaded);
				ZUI.removeEventListener(new ZUI.EventListener("load-species"));
				var eventListener = new ZUI.EventListener("load-species", null, function(event, eventData, listenerData) {
					Eplant.setActiveSpecies(Eplant.species[0]);
				}, {});
				ZUI.addEventListener(eventListener);
			}, {});
			ZUI.addEventListener(eventListener);
		}
		var ActiveGene = Eplant.getUrlParameter('ActiveGene');
		var ActiveView = Eplant.getUrlParameter('ActiveView');
		if(ActiveGene)
		{
			Eplant.isFirstLoad = true;
			ZUI.removeEventListener(new ZUI.EventListener("genes-all-loaded"));
			eventListener = new ZUI.EventListener("genes-all-loaded", null, function(event, eventData, listenerData) {
				if(Eplant.isFirstLoad){
					Eplant.isFirstLoad = false;
					var geneticElement = Eplant.activeSpecies.getGeneticElementByIdentifier(ActiveGene);
					if(geneticElement)
					{
						Eplant.activeSpecies.setActiveGeneticElement(geneticElement);
					}
					if(ActiveView)
					{
						Eplant.searchForActiveView(ActiveView);
					}
				}
				ZUI.removeEventListener(new ZUI.EventListener("genes-all-loaded"));
				eventListener = new ZUI.EventListener("genes-all-loaded", null, function(event, eventData, listenerData) {
					Eplant.activeSpecies.updateGlobalMax();
				}, {});
				ZUI.addEventListener(eventListener);
			}, {});
			ZUI.addEventListener(eventListener);
		}
		
		
		
		
	}
	
	
	/**
		* Searches the active View of ePlant.
		*
		* @param {Eplant.View} activeView The new activeView.
	*/
	Eplant.searchForActiveView = function(viewName) {
		if(Eplant.viewLoadTick >= 50)
		{
			DialogManager.artDialogDynamic('Active view is not loaded after 25 seconds, going back to welcome screen...',{width:'600px'});
			Eplant.changeActiveView(Eplant.views["HomeView"],'tabs-1');
			Eplant.viewLoadTick = 0;
			clearTimeout(Eplant.viewLoadTimeout);
		}
		else
		{
			var view = null;
			
			var View = Eplant.Views[viewName];
			/* Get the active view instance */
			
			if (View.hierarchy == "ePlant")
			{
				view = Eplant.views[viewName];
			}
			else if (View.hierarchy == "species")
			{
				if (Eplant.activeSpecies) {
					view = Eplant.activeSpecies.views[viewName];
				}
			}
			else if (View.hierarchy == "genetic element")
			{
				if (Eplant.activeSpecies && Eplant.activeSpecies.activeGeneticElement)
				{
					view = Eplant.activeSpecies.activeGeneticElement.views[viewName];
				}
			}
			
			if(view)
			{
				if(view.isLoadedData)
				{
					Eplant.changeActiveView(view);
					clearTimeout(Eplant.viewLoadTimeout);
				}
				else {
					if(!Eplant.viewLoadTimeout){
						Eplant.viewLoadTimeout = setTimeout(function()
						{
							clearTimeout(Eplant.viewLoadTimeout);
							Eplant.viewLoadTimeout=null;
							Eplant.viewLoadTick += 1;
							Eplant.searchForActiveView(viewName);
						}, 500);
					}
				}
				}else {
				if(!Eplant.viewLoadTimeout){
					Eplant.viewLoadTimeout = setTimeout(function()
					{
						clearTimeout(Eplant.viewLoadTimeout);
						Eplant.viewLoadTimeout=null;
						Eplant.viewLoadTick += 1;
						Eplant.searchForActiveView(viewName);
						
					}, 500);
				}
			}
		}
	};
	Eplant.loadCitations = function() {
		Eplant.citations={};
		$.ajax({
			type: "GET",
			url: "app/data/citations.json",
			dataType: "json"
		}).done(Eplant.loadCitationsCallback);
		
	};
	
	Eplant.loadCitationsCallback = function(response) {
		if(Eplant.species&&Eplant.species.length>1){
			Eplant.citations={};
			for(var j =0;j<Eplant.species.length;j++){
				var species = Eplant.species[j];
				Eplant.citations[species.scientificName] = {};
				for(var i =0;i<response.length;i++){
					
					var citation = response[i];
					var content = '';
					
					if(citation.source) content+="<br><br>" + citation.source;
					if(citation.notes) content+="<br><br>" + citation.notes;
					if(citation.URL) content+="<br><br>" + citation.URL;
					if(content.length>0) content = content.substring(8);
					content='<h2>Citation and Experiment Information for this View</h2><br>'+content;
					/*if(Eplant.activeView.infoHtml){
						//content +="<br><br><h2>Experiment information for this view</h2><br>"+Eplant.activeView.infoHtml;
						content +="<br><br>"+Eplant.activeView.infoHtml;
					}*/
					content+="{INFOHTML}";
					//content += "<br><br>If you find this tool useful, please cite: ePlant <i>" + species.scientificName + "</i> " + citation.view + "  at bar.utoronto.ca by "+Eplant.Authours+" "+Eplant.Year+".";
					content += "<br><br>This image was generated with the " + citation.view + " at bar.utoronto.ca/eplant by "+Eplant.AuthoursW+" "+Eplant.Year+".";
					Eplant.citations[species.scientificName][citation.view] = content;
				}
				
				
			}
		}
		else{
			setTimeout(function(){ Eplant.loadCitationsCallback(response) }, 3000);
		}
		
	};
	
	
	/* Show citation via popup */
	Eplant.showCitation = function() {
		var containerElement = document.createElement("div");
		$(containerElement).enableSelection();
		containerElement.style.textAlign = "left";
		containerElement.innerHTML = "Loading citation...";
		var dialog = art.dialog({
			content: containerElement,
			//title: "Citation",
			width: 600,
			minHeight: 0,
			resizable: false,
			draggable: false,
			lock: true,
			position: [document.width / 2, 150],
			buttons: [{
				text: "Close",
				click: $.proxy(function(event, ui) {
					$(this).dialog("close");
				}, containerElement)
			}],
			close: $.proxy(function() {
				$(this).remove();
			}, containerElement)
			
		})
		
		var obj = {
			dialog: dialog,
		};
		/*$.ajax({
			type: "GET",
			url: "cgi-bin/citation.cgi?view=" + Eplant.activeView.name,
			dataType: "json"
			}).done($.proxy(function(response) {
			var content = '';
			
			if(response.source) content+="<br><br>" + response.source;
			if(response.notes) content+="<br><br>" + response.notes;
			if(response.URL) content+="<br><br>" + response.URL;
			if(content.length>0) content = content.substring(8);
			content='<p style="font-size:24px">Citation information for this view</p><br>'+content;
			if(Eplant.activeView.infoHtml){
			content +="<br><br><p style='font-size:24px'>Experiment information for this view</p><br>"+Eplant.activeView.infoHtml;
			}
			content += "<br><br>If you find this tool useful, please cite: ePlant <i>" + Eplant.activeSpecies.scientificName + "</i> " + response.view + "  at bar.utoronto.ca by "+Eplant.Authours+" "+Eplant.Year+".";
			obj.dialog.content(content);
			}, obj)).fail($.proxy(function(response) {
			obj.dialog.content('No citation information available for this view.');
		}, obj));*/
		var content = "";
		if(Eplant.activeView.citation){
			
			if(Eplant.activeView.infoHtml){
				content = Eplant.activeView.citation.replace("{INFOHTML}","<br><br>"+Eplant.activeView.infoHtml);
			}else{
				content = Eplant.activeView.citation.replace("{INFOHTML}","");
			}
			
		}else{
			var content = "";
			if(Eplant.activeView.infoHtml){
				content = Eplant.citations[Eplant.activeSpecies.scientificName][Eplant.activeView.name].replace("{INFOHTML}","<br><br>"+Eplant.activeView.infoHtml);
			}else{
				content = Eplant.citations[Eplant.activeSpecies.scientificName][Eplant.activeView.name].replace("{INFOHTML}","");
			}
				
		}
		dialog.content(content);
	};
	Eplant.expressionAnglerClick = function() {
		DialogManager.artDialogUrl('app/ExpressionAngler/index.html?data=' + Agave.token.accessToken, {
			close: function () {
				var expressionAnglerUrl = art.dialog.data('expressionAnglerUrl');
				var expressionAnglerMainIdentifier = art.dialog.data('expressionAnglerMain');
				var expressionAnglerCount = art.dialog.data('expressionAnglerCount');
				if (expressionAnglerUrl !== undefined) Eplant.ExpressionAngler(expressionAnglerUrl,expressionAnglerMainIdentifier,expressionAnglerCount);
				art.dialog.removeData('expressionAnglerUrl');
				art.dialog.removeData('expressionAnglerMain');
				art.dialog.removeData('expressionAnglerCount');
			},
			width:"95%"
		});
	};
	
	Eplant.phenotypeClick = function() {
		DialogManager.artDialogUrl('app/MutantPhenotypeSelector/index.html',{
			close: function () {
				var mutantPhenotypeSelectorGenes = art.dialog.data('mutantPhenotypeSelectorGenes');
				if (mutantPhenotypeSelectorGenes !== undefined) Eplant.queryIdentifier(mutantPhenotypeSelectorGenes.split(','));
				art.dialog.removeData('mutantPhenotypeSelectorGenes');
				
			},
			width:"95%"
		});
	};
	/**
		* Bind events for ePlant DOM UI elements.
	*/
	Eplant.bindUIEvents = function() {
		$( /*"#genePanel_container" */document.body).keydown(function( event ) {
			if ( event.which == 38 ) {
				if (Eplant.activeSpecies.displayGeneticElements.length>1) {
					var index = $(".eplant-geneticElementPanel-item-focus").index();
					if (index-1>=0) {
						var geneticElement = Eplant.activeSpecies.displayGeneticElements[index - 1];
						geneticElement.species.setActiveGeneticElement(geneticElement);
						
					}
					else {
						var geneticElement = Eplant.activeSpecies.displayGeneticElements[Eplant.activeSpecies.displayGeneticElements.length-1];
						geneticElement.species.setActiveGeneticElement(geneticElement);
						
					}
				}
			}
			else if ( event.which == 40 ) {
				if (Eplant.activeSpecies.displayGeneticElements.length>1) {
					var index = $(".eplant-geneticElementPanel-item-focus").index();
					if (Eplant.activeSpecies.displayGeneticElements.length > index+1) {
						var geneticElement = Eplant.activeSpecies.displayGeneticElements[index + 1];
						geneticElement.species.setActiveGeneticElement(geneticElement);
						
					}
					else {
						var geneticElement = Eplant.activeSpecies.displayGeneticElements[0];
						geneticElement.species.setActiveGeneticElement(geneticElement);
						
					}
				}
			}
			
		});
		$("#genePanel_holder").mCustomScrollbar({
			theme:"inset"/*,
				callbacks:{
				onOverflowY: function(){
				$('#bottom_fade').show();},
				onOverflowYNone: function(){
				$('#top_fade').hide();
				$('#bottom_fade').hide();},
				onScrollStart: function(){
				$('#top_fade').show();
				$('#bottom_fade').show();},
				onTotalScrollBack: function(){$('#top_fade').hide();},
				onTotalScroll: function(){$('#bottom_fade').hide();}
			}*/
			
		});
		/* Genetic element identifier auto-complete */
		$("#enterIdentifier").autocomplete({
			source: function(request, response) {
				var last = request.term.split(/,\s*/).pop();
				$.ajax({
					beforeSend: function(request) {
						request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
					},

					type: "GET",
					url: Eplant.ServiceUrl +  "idautocomplete.cgi?species=" + Eplant.activeSpecies.scientificName.split(" ").join("_") + "&term=" + last,
					dataType: "json"
					}).done(function(data) {
					response(data);
				});
			},
			minLength: 0,
			focus: function(event, ui) {
				// prevent value inserted on focus
				$("li.ui-state-focus",event.currentTarget).removeClass("ui-state-focus");
				$("li.ui-state-hover",event.currentTarget).removeClass("ui-state-hover");
				var selected = $("li",event.currentTarget).filter(function(index) { return $("a", this).text() === ui.item.label; });
				$(selected).addClass("ui-state-focus");
				return false;
			},
			select: function(event, ui) {
				var terms = this.value.split(/,\s*/);
				// remove the current input
				terms.pop();
				// add the selected item
				terms.push(ui.item.value);
				// add placeholder to get the comma-and-space at the end
				terms.push("");
				this.value = terms.join(", ");
				return false;
			}
		})
		.on('input', function() {
			if (this.value.slice(-1) == ',') {
				$("#enterIdentifier").autocomplete("close");
			}
		});;
		
		/* Query genetic element identifier */
		$("#queryIdentifier").click(function() {
			
			Eplant.queryIdentifier();
		});
		$("#enterIdentifier").keyup(function(event) {
			if (event.keyCode == "13") {
				Eplant.queryIdentifier();
			}
		});
		$("#enterIdentifier").clearSearch();
		
		/* Example genetic element identifier query */
		$("#getExample").click(function() {
			$("#enterIdentifier").val(Eplant.activeSpecies.exampleQuery);
			Eplant.queryIdentifier();
		});
		$(".loadABI3").click(function() {
			$("#enterIdentifier").val("AT3G24650");
			Eplant.queryIdentifier();
		});
		$(".loadAT5G60200").click(function() {
			$("#enterIdentifier").val("AT5G60200");
			Eplant.queryIdentifier();
		});
		/* Save session button */
		$("#saveSession").click(function() {
			// TODO
		});
		
		/* Load session button */
		$("#loadSession").click(function() {
			// TODO
		});
		
		/* Zoom in button */
		
		$("#zoomIn").click(function() {
			
			if (Eplant.activeView.zoomIn) {
				Eplant.activeView.zoomIn();
				
			}
		});
		
		$("#zoomIn").mousedown(function() {
			
			Eplant.zoomTimeout = setInterval(function() {
				if (Eplant.activeView.zoomIn) {
					Eplant.activeView.zoomIn();
					
				}
			}, 100);
			
			return false;
		});
		
		
		$("#zoomIn").mouseup(function() {
			clearInterval(Eplant.zoomTimeout);
			return false;
		});
		
		$('#zoomIn').mouseout(function() {
			clearInterval(Eplant.zoomTimeout);
			return false;
		});
		
		
		/* Zoom out button */
		$("#zoomOut").click(function() {
			
			if (Eplant.activeView.zoomOut) {
				Eplant.activeView.zoomOut();
				
			}
		});
		
		
		$("#zoomOut").mousedown(function(event) {
			Eplant.zoomTimeout = setInterval(function() {
				if (Eplant.activeView.zoomOut) {
					Eplant.activeView.zoomOut();
					
				}
			}, 100);
			
			return false;
		});
		
		
		
		$("#zoomOut").mouseup(function(event) {
			clearInterval(Eplant.zoomTimeout);
			return false;
		});
		$('#zoomOut').mouseout(function() {
			clearInterval(Eplant.zoomTimeout);
			return false;
		});
		
		
		// History dialog button
		$("#historyIcon").click(function() {
			var historyDialog = new Eplant.HistoryDialog();
		});
		
		// History back button
		$("#historyBackIcon").click(function() {
			// Go back if possible
			if (Eplant.history.isBackPossible()) {
				Eplant.history.goBack();
			}
		});
		
		// History forward button
		$("#historyForwardIcon").click(function() {
			// Go forward if possible
			if (Eplant.history.isForwardPossible()) {
				Eplant.history.goForward();
			}
		});
		
		// show url link with current eplant state
		$("#showUrl").click(function() {
			var url = Eplant.urlForCurrentState();
			DialogManager.artDialogDynamic('<div>Use this URL to automatically reload this session.</div><textarea style="margin:15px 0;width: 580px;">'+url+'</textarea><button id="CopyToClipboard" class="greenButton" style="margin:0" data-clipboard-text="'+url+'" title="Click to copy me.">Copy to Clipboard</button>',{
				init:function(){
					var client = new ZeroClipboard( document.getElementById("CopyToClipboard") );
					
					client.on( "ready", function( readyEvent ) {
						// alert( "ZeroClipboard SWF is ready!" );
						
						client.on( "aftercopy", function( event ) {
							// `this` === `client`
							// `event.target` === the element that was clicked
							alert("Copied text to clipboard: " + event.data["text/plain"] );
						} );
					} );
				},
				width:'600px',
				title:"Save Current Settings"
			})
		});
		
		/* Toggle view change animation button */
		$("#viewChangeAnimationIcon").click(function() {
			Eplant.isAnimateActiveViewChange = !Eplant.isAnimateActiveViewChange;
			if (Eplant.isAnimateActiveViewChange) {
				$("#viewChangeAnimationIcon img").attr("src", "app/img/on/zoom.png");
				$("#viewChangeAnimationIcon span").html("Zoom transitions on");
				} else {
				$("#viewChangeAnimationIcon img").attr("src", "app/img/off/zoom.png");
				$("#viewChangeAnimationIcon span").html("Zoom transitions off");
			}
		});
		
		$("#viewIntructionIcon").click(function() {
			Eplant.showViewIntruction = !Eplant.showViewIntruction;
			if (Eplant.showViewIntruction) {
				$("#viewIntructionIcon img").attr("src", "app/img/on/fyi.png");
				$("#viewIntructionIcon span").html("New user popups on");
				} else {
				$("#viewIntructionIcon img").attr("src", "app/img/off/fyi.png");
				$("#viewIntructionIcon span").html("New user popups off");
			}
		});
		
		
		
		/* Toggle tooltip button */
		$("#tooltipIcon").click(function() {
			Eplant.isTooltipOn = !Eplant.isTooltipOn;
			var domElements = document.getElementsByClassName("hint--rounded");
			if (Eplant.isTooltipOn) {
				for (var n = 0; n < domElements.length; n++) {
					var domElement = domElements[n];
					$(domElement).attr("data-enabled", "true");
				}
				$("#tooltipIcon img").attr("src", "app/img/on/tooltip.png");
				$("#tooltipIcon span").html("Tooltips on");
				$( '.hint--right' ).tooltip( "option", "disabled", false );
				$( '.hint--left' ).tooltip( "option", "disabled", false );
				$( '.hint--bottom' ).tooltip( "option", "disabled", false );
				$( '.hint--top' ).tooltip( "option", "disabled", false );
			}
			else {
				for (var n = 0; n < domElements.length; n++) {
					var domElement = domElements[n];
					$(domElement).attr("data-enabled", "false");
				}
				$("#tooltipIcon img").attr("src", "app/img/off/tooltip.png");
				$("#tooltipIcon span").html("Tooltips off");
				$( '.hint--right' ).tooltip( "option", "disabled", true );
				$( '.hint--left' ).tooltip( "option", "disabled", true );
				$( '.hint--bottom' ).tooltip( "option", "disabled", true );
				$( '.hint--top' ).tooltip( "option", "disabled", true );
			}
		});
		
		/* Get image button */
		$("#getImageIcon").click(function() {
			//var dataURL = ZUI.activeView.getViewScreen();
			Eplant.screenShotForCurrent();
		});
		
		$("#palleteIcon").click(function() {
			var paletteDialog = new Eplant.PaletteDialog();
		});
		
		$("#colorModeIcon").click(function() {
			var globalColorModeDialog = new Eplant.GlobalColorModeDialog();
		});
		
		/* Get Citation button */
		$("#citationIcon").click(function() {
			if(Eplant.activeView.showCitation){
				Eplant.activeView.showCitation()
				}else{
				Eplant.showCitation();
			}
			
		});
		
		$("#downloadIcon").click(function() {
			
			if(Eplant.activeView&&Eplant.activeView.downloadRawData){
				Eplant.activeView.downloadRawData()
			}
			else{
				alert("No loaded information available.")
			}
		});
		
		
		/* Remove dialogs button
			$("#removeDialogsIcon").click(function() {
			for (var n = 0; n < Eplant.species.length; n++) {
			var species = Eplant.species[n];
			for (var m = 0; m < species.geneticElements.length; m++) {
			var geneticElement = species.geneticElements[m];
			if (geneticElement.geneticElementDialog) {
			geneticElement.geneticElementDialog.remove();
			geneticElement.geneticElementDialog = null;
			}
			}
			}
		});*/
		//resize icondock when up or down arrow is clicked
		$("#iconTopArrow").click(function() {
			Eplant.iconIndex--;
			Eplant.resizeIconDock($('#left').height());
		});
		$("#iconBottomArrow").click(function() {
			Eplant.iconIndex++;
			Eplant.resizeIconDock($('#left').height());
		});
		$("#iconBottomArrow").click(function() {
			Eplant.iconIndex++;
			Eplant.resizeIconDock($('#left').height());
		});
		$("#dropdown-rsvp li").click(function() {
			var radio = $('input[type="radio"]',this);
			
			$(this).closest('#dropdown-rsvp').find('input[type="radio"]').removeProp('checked');
			radio.prop('checked','checked');
			if (Eplant.RSVPOn) {
				if(Eplant.RSVPOnMode===1){
					$( "body" ).undelegate( '.eplant-geneticElementPanel-item', "mouseover");
				}
				else{
					clearTimeout(Eplant.RSVPTimeout);
				}
			}
			Eplant.RSVPOnMode = parseInt(radio.val());
			if (Eplant.RSVPOn) {
				if(Eplant.RSVPOnMode===2){
					Eplant.RSVPSpeed = 100;
				}
				else if(Eplant.RSVPOnMode===3){
					Eplant.RSVPSpeed = 200;
				}
				else if(Eplant.RSVPOnMode===4){
					Eplant.RSVPSpeed = 300;
				}
				if(Eplant.RSVPOnMode===1){
					$( "body" ).delegate( '.eplant-geneticElementPanel-item', "mouseover",$.proxy(function(e){
						var geneticElement = Eplant.activeSpecies.displayGeneticElements[$(e.currentTarget).index()];
						geneticElement.species.setActiveGeneticElement(geneticElement);
					},this));
				}
				else {
					Eplant.RSVPMode(0);
				}
			}
			if (!Eplant.RSVPOn) {
				$("#RSVPIcon").click();
			}
		});
		/*$("#dropdown-color-mode li").click(function() {
			var radio = $('input[type="radio"]',this);
			
			$(this).closest('#dropdown-color-mode').find('input[type="radio"]').removeProp('checked');
			radio.prop('checked','checked');
			
			var mode = radio.val()
			Eplant.globalColorMode = mode;
			if(Eplant.globalColorMode ==="customAbsolute"){
			if (Eplant.viewColorMode === "absolute") {
			Eplant.customGlobalMax = $("#adjustColorMode .btn .customAbsoluteValue").val();
			}
			else if (Eplant.viewColorMode === "relative") {
			Eplant.customGlobalExtremum = $("#adjustColorMode .btn .customAbsoluteValue").val();
			}
			}
			var event = new ZUI.Event("update-colors", Eplant, null);
			ZUI.fireEvent(event);
			});
			
			$("#dropdown-color-mode .customAbsoluteValue").click(function(e) {
			e.stopPropagation();
		});*/
		
		$("#viewColorMode").on('click', function() {
			var img = $("img", this);
			if (Eplant.viewColorMode === "absolute") {
				$(this).attr("data-hint", "Toggle data mode: relative.");
				Eplant.viewColorMode = "relative";
				img.attr("src","app/img/efpmode-relative.png");
				$("#dropdown-color-mode .customAbsoluteValue").val(Eplant.customGlobalExtremum);
			}
			else if (Eplant.viewColorMode === "relative") {
				$(this).attr("data-hint", "Toggle data mode: absolute.");
				Eplant.viewColorMode = "absolute";
				img.attr("src","app/img/efpmode-absolute.png");
				$("#dropdown-color-mode .customAbsoluteValue").val(Eplant.customGlobalMax);
			}
			
			var event = new ZUI.Event("update-colors", Eplant, null);
			ZUI.fireEvent(event);
		});
		
		
		$("#RSVPIcon").click(function() {
			if (Eplant.RSVPOn) {
				$("#RSVPIcon").css("color", "#989898");
				Eplant.RSVPOn = false;
				//$("#RSVPSpeed").slider( "disable" );
				
				
				$('#viewPort').css({'pointer-events' : 'auto'});
				
				if(Eplant.RSVPOnMode===1){
					$( "body" ).undelegate( '.eplant-geneticElementPanel-item', "mouseover");
				}
				else{
					clearTimeout(Eplant.RSVPTimeout);
				}
			}
			else {
				$("#RSVPIcon").css("color", "#000");
				Eplant.RSVPOn = true;
				//$("#RSVPSpeed").slider( "enable" );
				
				
				$('#viewPort').css({'pointer-events' : 'none'});
				
				if(Eplant.RSVPOnMode===2){
					Eplant.RSVPSpeed = 100;
				}
				else if(Eplant.RSVPOnMode===3){
					Eplant.RSVPSpeed = 200;
				}
				else if(Eplant.RSVPOnMode===4){
					Eplant.RSVPSpeed = 300;
				}
				if(Eplant.RSVPOnMode===1){
					$( "body" ).delegate( '.eplant-geneticElementPanel-item', "mouseover",$.proxy(function(e){
						var geneticElement = Eplant.activeSpecies.displayGeneticElements[$(e.currentTarget).index()];
						geneticElement.species.setActiveGeneticElement(geneticElement);
					},this));
				}
				else {
					Eplant.RSVPMode(0);
				}
				
			}
		});
		/*
			$("#RSVPSpeed").slider({
			orientation: "horizontal",
			range: "min",
			//disabled: true,
			min: 100,
			max: 1000,
			value: Eplant.RSVPSpeed,
			slide: $.proxy(function(event, ui) {
			Eplant.RSVPSpeed = ui.value;
			$("#RSVPSpeed").attr('data-hint', "RSVP Mode Transition Time, Current: "+Eplant.RSVPSpeed+"ms")
			},this)
		});*/
		$("#lowhighIcon").click(function() {
			Eplant.activeSpecies.displayGeneticElements.sort(function(a, b){return a.max-b.max});
			Eplant.updateGeneticElementPanel();
			Eplant.activeSpecies.views['HeatMapView'].refreshHeatMap();
		});
		$("#highlowIcon").click(function() {
			Eplant.activeSpecies.displayGeneticElements.sort(function(a, b){return b.max-a.max});
			Eplant.updateGeneticElementPanel();
			Eplant.activeSpecies.views['HeatMapView'].refreshHeatMap();
		});
		$("#heatmapModeIcon").click(function() {
			
			Eplant.geneticElementPanelMapOn = !Eplant.geneticElementPanelMapOn;
			if(Eplant.geneticElementPanelMapOn){
				$("#heatmapModeIcon img").attr("src", "app/img/on/heatMapMode.png");
				}else{
				$("#heatmapModeIcon img").attr("src", "app/img/off/heatMapMode.png");
			}
			Eplant.updateGeneticElementPanel();
		});
		$("#wordCloudIcon").click(function() {
			if(Eplant.wordCloudButtonOn){
				new Eplant.WordCloudDialog();
			}
		});
		$("#smallMultipleIcon").click(function() {
			Eplant.smallMultipleOn=!Eplant.smallMultipleOn;
			Eplant.CreateSmallMultiples();
			
		});
		/* about page dialog click */
		$("#getAbout").on('click', function () {
			DialogManager.artDialogUrl('app/pages/about.html');
		});
		/* help page dialog click */
		$("#getHelp").on('click', function () {
			DialogManager.artDialogUrl('app/pages/help.html');
		});
		/* contact page dialog click */
		$("#getComments").on('click', function () {
			DialogManager.artDialogUrl('app/pages/comments.html');
		});
		$("#expressionAnglerButton").on('click', function () {
			Eplant.expressionAnglerClick();
		});
		$("#phenotypeButton").on('click', function () {
			Eplant.phenotypeClick();
		});
		
		$('#genePanel_list').sortable({
			start: function (event, ui) {
				ui.item.data('originIndex', ui.item.index());
			},
			
			//update Eplant.activeSpecies.geneticElements
			update: function (event, ui) {
				var children = $('#genePanel_list').children();
				var originIndex = ui.item.data('originIndex');
				ui.item.removeData('originIndex');
				var currentIndex = ui.item.index();
				
				if (currentIndex != originIndex) {
					
					tempGene = Eplant.activeSpecies.displayGeneticElements[originIndex];
					Eplant.activeSpecies.displayGeneticElements.splice(originIndex, 1);
					
					Eplant.activeSpecies.displayGeneticElements.splice(currentIndex, 0, tempGene);
				}
				Eplant.activeSpecies.views['HeatMapView'].refreshHeatMap();
			}
		});
		$( '.hint--right' ).tooltip({
			position: {
				my: 'left center', at: 'right+5 center'
			},
			tooltipClass:'right'
		});
		$( '.hint--left' ).tooltip({
			position: {
				my: 'left center', at: 'right+5 center'
			},
			tooltipClass:'left'
		});
		
		$( '.hint--bottom' ).tooltip({
			position: {
				my: 'left center', at: 'right+5 center'
			},
			tooltipClass:'bottom'
		});
		$( '.hint--top' ).tooltip({
			position: {
				my: 'left center', at: 'right+5 center'
			},
			tooltipClass:'top'
		});
		$('.leftToggle').click(function() {
			if (Eplant.sidebarOpen == false) {
				Eplant.viewPortLeftOffset =312;
				var left = Eplant.viewPortLeftOffset+"px";
				$('.left').animate({
					marginLeft: "0px"
				}, 500);
				
				$('.leftColumn').animate({
					width: left
				}, 500);
				$('#topLeft',window.parent.document).animate({
					left: "0px"
				}, 500);
				$('.pLeft',window.parent.document).animate({
					paddingLeft: left
				}, 500);
				$('#settings_container').animate({
					marginLeft: left,
					width: $(window).width() - 312 + "px"
				}, 500);
				
				
				$(".toggleArrow").attr('src',"app/img/arrow-left-clear-bg.png");
				
				Eplant.sidebarOpen = true;
				$(":animated").promise().done(function() {
					var evt = document.createEvent('UIEvents');
					evt.initUIEvent('resize', true, false,window,0);
					window.dispatchEvent(evt);
					respondCanvas();
				});
				
			}
			else {
				Eplant.viewPortLeftOffset =68;
				var left = Eplant.viewPortLeftOffset+"px";
				$('.left').animate({
					marginLeft: "-245px"
				}, 500);
				$('.leftColumn').animate({
					width: left
				}, 500);
				$('#topLeft',window.parent.document).animate({
					left: "-245px"
				}, 500);
				$('.pLeft',window.parent.document).animate({
					paddingLeft: left
				}, 500);
				$('#settings_container').animate({
					marginLeft: left,
					width: $(window).width()- 68 + "px"
				}, 500);
				$(".toggleArrow").attr('src',"app/img/arrow-right-clear-bg.png");
				Eplant.sidebarOpen = false;
				
				$(":animated").promise().done(function() {
					var evt = document.createEvent('UIEvents');
					evt.initUIEvent('resize', true, false,window,0);
					window.dispatchEvent(evt);
					respondCanvas();
				});
				
			}
		});
		/*$(document).mousemove(function(e){
			cursorX = e.clientX;
			cursorY = e.clientY-15;
		});*/
		document.onmousemove = function handleMouseMove(event) {
			var dot, eventDoc, doc, body, pageX, pageY;
			
			event = event || window.event; // IE-ism
			
			// If pageX/Y aren't available and clientX/Y are,
			// calculate pageX/Y - logic taken from jQuery.
			// (This is to support old IE)
			if (event.pageX == null && event.clientX != null) {
				eventDoc = (event.target && event.target.ownerDocument) || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;
				
				event.pageX = event.clientX +
				(doc && doc.scrollLeft || body && body.scrollLeft || 0) -
				(doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = event.clientY +
				(doc && doc.scrollTop  || body && body.scrollTop  || 0) -
				(doc && doc.clientTop  || body && body.clientTop  || 0 );
			}
			cursorX =  event.pageX;
			cursorY = event.pageY-15;
			// Use event.pageX / event.pageY here
		}
	};
	
	/**
	*/
	Eplant.RSVPMode = function(index) {
		if (Eplant.RSVPOn&&Eplant.activeSpecies.displayGeneticElements.length>1) {
			if (Eplant.activeSpecies.displayGeneticElements.length > index) {
				var geneticElement = Eplant.activeSpecies.displayGeneticElements[index];
				geneticElement.species.setActiveGeneticElement(geneticElement);
				Eplant.RSVPTimeout = setTimeout(function() {
					Eplant.RSVPMode(index + 1);
				}, Eplant.RSVPSpeed);
			}
			else {
				var geneticElement = Eplant.activeSpecies.displayGeneticElements[0];
				geneticElement.species.setActiveGeneticElement(geneticElement);
				Eplant.RSVPTimeout = setTimeout(function() {
					Eplant.RSVPMode(1);
				}, Eplant.RSVPSpeed);
			}
		}
	};
	
	Eplant.CreateSmallMultiples = function() {
		
		if (Eplant.smallMultipleOn) {
			if(Eplant.activeView.isEFPView){
				if (Eplant.RSVPOn){
					$("#RSVPIcon").click();
				}
				$("#smallMultipleIcon img").attr("src", "app/img/on/smallMultiples.png");
				$("#SmallMultipleContainer").show();
				//Eplant.smallMultipleOriginalHolder=Eplant.ViewModes[Eplant.activeView.viewMode];
				$("#SmallMultipleHolder").empty();
				var viewName = Eplant.activeView.viewName;
				var genes = Eplant.activeSpecies.displayGeneticElements;
				for (var i= 0; i <genes.length; i++){
					
					var isActive = genes[i].identifier === Eplant.activeSpecies.activeGeneticElement.identifier;
					var view = genes[i].views[viewName];
					var top = Math.floor(i/3)*30+3+"%";
					var left = i%3*30+3+"%";
					
					var domHolder = document.createElement("div");
					$(domHolder).css({
						width:"27%",
						height:"27%",
						position:"absolute",
						top:top,
						left:left
					});
					$(domHolder).attr("data-identifier",genes[i].identifier);
					
					var domImgHolder = document.createElement("div");
					$(domImgHolder).addClass("smallMultiplesSvgImage");
					$(domImgHolder).css({
						"height":"80%",
						'position': 'relative'
					});
					
					var img =$(view.svgImage).clone();
					$(img).attr("data-identifier",genes[i].identifier);
					$(img).css({"top":"auto","cursor":"pointer",'height':'100%'});
					$(img).click(function(){
						Eplant.smallMultipleOn=false;
						Eplant.CreateSmallMultiples();
						var selectedGene = Eplant.activeSpecies.getGeneticElementByIdentifier($(this).attr("data-identifier"));
						Eplant.activeSpecies.setActiveGeneticElement(selectedGene);
						Eplant.changeActiveView(selectedGene.views[Eplant.activeView.viewName]);
					});
					$(domImgHolder).append(img);
					
					
					var geneTitle = document.createElement("div");
					$(geneTitle).addClass("smallMultiplesGeneTitle");
					$(geneTitle).css({
						"text-align":"center"
						
					});
					$(geneTitle).text(genes[i].identifier);
					
					if(isActive){
						$(domImgHolder).css({"border":"1px solid #99cc00"});
						$(geneTitle).css({"color":"#99cc00"});
					}
					else{
						$(domImgHolder).css({"border":"1px solid #aaaaaa"});
						$(geneTitle).css({"color":"#aaaaaa"});
					}
					$(domHolder).append(geneTitle);
					$(domHolder).append(domImgHolder);
					$("#SmallMultipleHolder").append(domHolder);
				}
				
				
			}
			else{
				Eplant.smallMultipleOn = false;
				$("#smallMultipleIcon img").attr("src", "app/img/off/smallMultiples.png");
				$("#SmallMultipleContainer").hide();
				
				var errorInfo='This feature is only available for eFP viewers.';
				var dialog = window.top.art.dialog({
					content: errorInfo,
					width: 600,
					minHeight: 0,
					resizable: false,
					draggable: false,
					lock: true
				});
			}
			
		}
		else {
			$("#smallMultipleIcon img").attr("src", "app/img/off/smallMultiples.png");
			$("#SmallMultipleContainer").hide();
			/*var children = $("#SmallMultipleHolder").children();
				if(children.length>0&&Eplant.smallMultipleOriginalHolder){
				for (var i= 0; i <children.length; i++){
				var cc =  children[i].children;
				$(Eplant.smallMultipleOriginalHolder).append(cc);
				}
				$("#SmallMultipleHolder").empty();
				}
			Eplant.smallMultipleOriginalHolder=null; */
			$("#SmallMultipleHolder").empty();
			
		}
		Eplant.changeActiveViewTab();
	};
	Eplant.UpdateSmallMultiplesActiveGene = function() {
		
		if (Eplant.smallMultipleOn&&Eplant.activeView.isEFPView){
			$("#smallMultipleIcon img").attr("src", "app/img/on/smallMultiples.png");
			$("#SmallMultipleContainer").show();
			var viewName = Eplant.activeView.viewName;
			var genes = Eplant.activeSpecies.displayGeneticElements;
			var children = $("#SmallMultipleHolder").children();
			for (var i= 0; i <children.length; i++){
				var child = children[i];
				var isActive = $(child).attr("data-identifier") === Eplant.activeSpecies.activeGeneticElement.identifier;
				var geneTitle = $(".smallMultiplesGeneTitle",child);
				var img = $(".smallMultiplesSvgImage",child);
				
				if(isActive){
					$(img).css({"border":"1px solid #99cc00"});
					$(geneTitle).css({"color":"#99cc00"});
				}
				else{
					$(img).css({"border":"1px solid #aaaaaa"});
					$(geneTitle).css({"color":"#aaaaaa"});
				}
				
			}
			
			
			
			
		}
		
		
	};
	
	/**
		* Bind events for ePlant.
	*/
	Eplant.bindEvents = function() {
		$(window).resize(Eplant.resize);
		
		/* Update*/
		var eventListener = new ZUI.EventListener("update-colors", Eplant, function(event, eventData, listenerData) {
			Eplant.queue.clearWithId("ColorUpdate");
			Eplant.updatingColors = true;
			
			Eplant.activeSpecies.updateGlobalMax();
			for (i= 0; i <Eplant.activeSpecies.displayGeneticElements.length; i++){
				Eplant.queue.add(function(){
					this.updateEFPViews();
					this.refreshHeatmap();
					
					
				},Eplant.activeSpecies.displayGeneticElements[i],null,"ColorUpdate");
				
			}
			Eplant.queue.add(function(){
				Eplant.activeSpecies.views['HeatMapView'].refreshHeatMap();
				Eplant.updatingColors = false;
				
			},Eplant.activeSpecies.views['HeatMapView'],null,"ColorUpdate");
			
			if(Eplant.activeView.magnification ===35){
				Eplant.experimentSelectList.getSidebar().done($.proxy(function(domSideBar){
					$('#efp_experiement_list').css('width','150px');
					$('#efp_container').css('margin-left','150px');
					Eplant.experimentSelectList.updateActive(this.viewName);
				},Eplant.activeView));
				
			}
			Eplant.queue.add(Eplant.updateGeneticElementPanel,this);
			Eplant.queue.add(Eplant.CreateSmallMultiples,this);
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update speciesLabel when the activeSpecies changes */
		var eventListener = new ZUI.EventListener("update-activeSpecies", Eplant, function(event, eventData, listenerData) {
			$("#speciesLabel").html(Eplant.activeSpecies.scientificName);
			$("#left").removeClass("hideleft");
			$("#leftToggle").removeClass("hideleft");
			
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update View icon when the View finishes loading */
		var eventListener = new ZUI.EventListener("view-loaded", null, function(event, eventData, listenerData) {
			/* Get View */
			
			var view = event.target;
			
			if(view.geneticElement){
				//Eplant.queue.add(view.geneticElement.getDom, view.geneticElement);
				view.geneticElement.getDom();
				if(view.geneticElement.isLoadedViewsData){
					Eplant.updateGeneticElementPanel();
					
				}
			}
			
			/* Determine whether the View is represented in the icon dock */
			var isInIconDock = false;
			if (view.hierarchy == "ePlant") {
				isInIconDock = true;
				} else if (view.hierarchy == "species") {
				if (view.species == Eplant.activeSpecies) {
					isInIconDock = true;
				}
				} else if (view.hierarchy == "genetic element") {
				if (view.geneticElement.species == Eplant.activeSpecies && view.geneticElement == Eplant.activeSpecies.activeGeneticElement) {
					isInIconDock = true;
				}
			}
			
			/* Update icon if applicable */
			if (isInIconDock) {
				Eplant.updateIconDock();
			}
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update View icon dock when activeSpecies changes */
		var eventListener = new ZUI.EventListener("update-activeSpecies", Eplant, function(event, eventData, listenerData) {
			Eplant.updateIconDock();
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update View icon dock when the activeView changes */
		var eventListener = new ZUI.EventListener("update-activeView", Eplant, function(event, eventData, listenerData) {
			Eplant.updateIconDock();
			Eplant.updateHistoryIcons();
			Eplant.CreateSmallMultiples();
		}, {});
		ZUI.addEventListener(eventListener);
		
		// Update history icons when the activeItem of the history changes
		var eventListener = new ZUI.EventListener("update-history-activeItem", Eplant.history, function(event, eventData, listenerData) {
			if (Eplant.history.isBackPossible()) {
				$("#historyBackIcon img").attr("src", "app/img/available/history-back.png");
				} else {
				$("#historyBackIcon img").attr("src", "app/img/unavailable/history-back.png");
			}
			if (Eplant.history.isForwardPossible()) {
				$("#historyForwardIcon img").attr("src", "app/img/available/history-forward.png");
				} else {
				$("#historyForwardIcon img").attr("src", "app/img/unavailable/history-forward.png");
			}
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when the activeSpecies changes */
		var eventListener = new ZUI.EventListener("update-activeSpecies", Eplant, function(event, eventData, listenerData) {
			Eplant.updateGeneticElementPanel();
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when the activeGeneticElement of activeSpecies changes */
		var eventListener = new ZUI.EventListener("update-activeGeneticElement", null, function(event, eventData, listenerData) {
			/* Get Species */
			var geneticElement = event.target;
			if(geneticElement){
				var species = event.target.species;
				
				if (species == Eplant.activeSpecies) {
					Eplant.updateIconDock();
				}
				
				/* Check if Species is the activeSpecies */
				if (species == Eplant.activeSpecies) {
					Eplant.updateGeneticElementPanel();
					if(Eplant.activeView.name === "Heat Map Viewer"){
						Eplant.activeSpecies.views['HeatMapView'].changeActiveGeneRow(geneticElement.identifier);
					}
				}
				Eplant.UpdateSmallMultiplesActiveGene();
				
			}
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when the activeGeneticElement of activeSpecies changes */
		var eventListener = new ZUI.EventListener("remove-geneticElement", null, function(event, eventData, listenerData) {
			/* Get Species */
			var species = event.target.species;
			var geneticElement = event.target;
			if(species.displayGeneticElements.length > 4){
				$("#wordCloudIcon img").attr('data-hint',"Create a word cloud based on semantic terms from gene descriptions");
				Eplant.wordCloudButtonOn = true;
				$("#wordCloudIcon img").attr("src", "app/img/on/wordCloud.png");
			}
			else if(species.displayGeneticElements.length > 1){
				species.setActiveGeneticElement(species.displayGeneticElements[species.displayGeneticElements.length-1]);
				$("#wordCloudIcon img").attr('data-hint',"Word Cloud. A minimum of 5 genes must be loaded to use this tool.");
				Eplant.wordCloudButtonOn = false;
				
				$("#wordCloudIcon img").attr("src", "app/img/off/wordCloud.png");
			}
			else{
				Eplant.changeActiveView(Eplant.views['HomeView']);
				species.activeGeneticElement = null;
				
				Eplant.wordCloudButtonOn = false;
				
				$("#wordCloudIcon img").attr("src", "app/img/off/wordCloud.png");
				$("#wordCloudIcon img").attr('data-hint',"Word Cloud. A minimum of 5 genes must be loaded to use this tool.");
			}
			/* Check if Species is the activeSpecies */
			if (species == Eplant.activeSpecies) {
				Eplant.updateGeneticElementPanel();
				Eplant.updateIconDock();
			}
			Eplant.activeSpecies.views['HeatMapView'].removeRow(geneticElement.identifier);
			
			Eplant.CreateSmallMultiples();
			TabManager.removeIdentifier(event.target.identifier);
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when the activeGeneticElement of activeSpecies changes */
		var eventListener = new ZUI.EventListener("add-geneticElement", null, function(event, eventData, listenerData) {
			
			/* Get Species */
			var species = event.target.species;
			var geneticElement = event.target;
			
			
			
			Eplant.activeSpecies.views['HeatMapView'].addNewRow(geneticElement);
			
			if(species.displayGeneticElements.length > 4){
				$("#wordCloudIcon img").attr('data-hint',"Create a word cloud based on semantic terms from gene descriptions");
				Eplant.wordCloudButtonOn = true;
				$("#wordCloudIcon img").attr("src", "app/img/on/wordCloud.png");
			}
			else{
				$("#wordCloudIcon img").attr('data-hint',"Word Cloud. A minimum of 5 genes must be loaded to use this tool.");
				Eplant.wordCloudButtonOn = false;
				$("#wordCloudIcon img").attr("src", "app/img/off/wordCloud.png");
			}
			Eplant.CreateSmallMultiples();
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when views of a GeneticElement of the activeSpecies are loaded */
		var eventListener = new ZUI.EventListener("load-views", null, function(event, eventData, listenerData) {
			/* Get Species */
			$("#citationIcon").show();
			
			var species = event.target.species;
			
			species.setActiveGeneticElement(event.target);
			
			
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when views of a GeneticElement of the activeSpecies are loaded */
		var eventListener = new ZUI.EventListener("load-efp-views", null, function(event, eventData, listenerData) {
			/* Get Species */
			var species = event.target.species;
			
			//species.views['HeatMapView'].loadFinish();
			
			
			
			
			Eplant.queue.add(function(){
				event.target.updateMax();
				//event.target.updateEFPViews();
				var needUpdate = false;
				if(!species.max){
					needUpdate = true;
				}
				species.updateGlobalMax();
				if(needUpdate){
					for (var n = 0; n < species.geneticElements.length; n++) {
						var geneticElement = species.geneticElements[n];
						geneticElement.updateEFPViews();
					}
				}		
			},Eplant,null,event.target.identifier+"_Loading");
			
			Eplant.queue.add(function(){
				for (var ViewName in species.views) {
					/* Get View constructor */
					var view = species.views[ViewName];
					if(!view.isLoadedData){
						view.loadFinish();
					}
				}
			},Eplant,null,event.target.identifier+"_Loading");
			
			
			Eplant.queue.add(function(){
				if(Eplant.activeView.name === "Welcome Screen"){
					Eplant.searchForActiveView('HeatMapView');
				}
				else if(Eplant.activeView.name === "Heat Map Viewer"){
					
				}
				Eplant.activeSpecies.views['HeatMapView'].addNewRow(event.target)
			},Eplant,null,event.target.identifier+"_Loading");
			
			/* Check if Species is the activeSpecies */
			if (species == Eplant.activeSpecies) {
				//Eplant.updateGeneticElementPanel();
			}
			event.target.species.setActiveGeneticElement(event.target);
			
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when the GeneticElementDialog of a GeneticElement of the activeSpecies is updated */
		var eventListener = new ZUI.EventListener("update-geneticElementDialog", null, function(event, eventData, listenerData) {
			/* Get Species */
			var species = event.target.species;
			
			/* Check if Species is the activeSpecies */
			if (species == Eplant.activeSpecies) {
				Eplant.updateGeneticElementPanel();
			}
		}, {});
		ZUI.addEventListener(eventListener);
		
		/* Update GeneticElement panel when tags change */
		var eventListener = new ZUI.EventListener("update-annotationTags", null, function(event, eventData, listenerData) {
			/* Get GeneticElement */
			var geneticElement = event.target;
			
			/* Update if Species is the activeSpecies */
			if (geneticElement.species == Eplant.activeSpecies) {
				Eplant.updateGeneticElementPanel();
			}
		}, {});
		ZUI.addEventListener(eventListener);
		var eventListener = new ZUI.EventListener("load-species", null, function(event, eventData, listenerData) {
			Eplant.setActiveSpecies(Eplant.species[0]);
		}, {});
		ZUI.addEventListener(eventListener);
		
		var eventListener = new ZUI.EventListener("genes-all-loaded", null, function(event, eventData, listenerData) {
		
			Eplant.activeSpecies.updateGlobalMax();

		}, {});
		ZUI.addEventListener(eventListener);
	};
	
	/**
		* Queries the identifier in the input box.
	*/
	Eplant.queryIdentifier = function(array) {
		$("#enterIdentifier").autocomplete("close");
		var terms
		var truncTerms = [];
		if (array) {
			terms = array;
			
		}
		else {
			if ($("#enterIdentifier").val() == '' || $("#enterIdentifier").val() == $("#enterIdentifier")[0].defaultValue) {
				DialogManager.artDialogDynamic('Please enter a gene name or ID.');
				return;
			}
			else{
				var separators = ['\n', ',','	'];
				terms = $("#enterIdentifier").val().split(new RegExp(separators.join('|'), 'g')).filter(function(el) {return el.length != 0});
				truncTerms = terms.filter(function(el) {return el.indexOf('.') != -1});
				
			}
			
		}
		
		if(truncTerms.length>0){
			truncTerms = $.map(truncTerms,function(value, index) {
				return value.split('.')[0];
			});
			terms= $.map(terms,function(value, index) {
				return value.split('.')[0];
			});
			DialogManager.artDialogDynamic('Returning representative gene model for '+truncTerms.join(','));
		}
		var loadingGenes = terms.join();
		Eplant.updateDownloadingMessage(true);
		Eplant.genesAllLoaded = false;
		terms= terms.filter(function(str) {
			return /\S/.test(str);
		});
		for (var n = 0; n < terms.length; n++) {
			var term = terms[n].trim();
			Eplant.activeSpecies.loadGeneticElementByIdentifier(term);
			
			
		}
		$("#enterIdentifier").val('');
		//Eplant.updateGeneticElementPanel();
		
	};
	
	/**
		* Load Views at the hierarchy level of ePlant.
	*/
	Eplant.loadViews = function() {
		/* Set up Object wrapper */
		Eplant.views = {};
		
		/* Loop through Eplant.Views namespace */
		for (var ViewName in Eplant.Views) {
			/* Get View constructor */
			var View = Eplant.Views[ViewName];
			
			/* Skip if View hierarchy is not at the level of genetic element */
			if (View.hierarchy != "ePlant") continue;
			
			/* Create View */
			Eplant.views[ViewName] = new View(this);
		}
		
		/* Set flag for view loading */
		this.isLoadedViews = true;
	};
	
	/**
		* Loads all Species for ePlant
	*/
	Eplant.loadSpecies = function() {
		if (!this.isLoadedSpecies) {

			$.ajax({
				beforeSend: function(request) {
					request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
				},
				type: "GET",
				dataType: "json",
				url: Eplant.ServiceUrl + 'speciesinfo.cgi',
				success: $.proxy(function(response) {

					/* Loop through species */
					for (var n = 0; n < response.length; n++) {
						/* Get data for this species */
						var speciesData = response[n];
						
						/* Create Species */
						var species = new Eplant.Species({
							scientificName: speciesData.scientificName,
							commonName: speciesData.commonName,
							exampleQuery: speciesData.exampleQuery
						});
						species.loadViews();
						
						/* Add Species to ePlant */
						Eplant.addSpecies(species);
					}
					
					/* Set Species load status */
					Eplant.isLoadedSpecies = true;
					
					/* Fire event for loading chromosomes */
					var event = new ZUI.Event("load-species", Eplant, null);
					ZUI.fireEvent(event);
				}, this)
			});
		}
	};
	
	/**
		* Adds a Species to ePlant
		*
		* @param {Eplant.Species} species The Species to be added.
	*/
	Eplant.addSpecies = function(species) {
		/* Add Species to array */
		Eplant.species.push(species);
		
		/* Fire event for updating the Species array */
		var event = new ZUI.Event("update-species", Eplant, null);
		ZUI.fireEvent(event);
	};
	
	/**
		* Removes a Species from ePlant
		*
		* @param {Eplant.Species} species The Species to be removed.
	*/
	Eplant.removeSpecies = function(species) {
		/* Clean up Species */
		species.remove();
		
		/* Remove Species from array */
		var index = Eplant.species.indexOf(species);
		if (index > -1) Eplant.species.splice(index, 1);
		
		/* Fire event for updating the Species array */
		var event = new ZUI.Event("update-species", Eplant, null);
		ZUI.fireEvent(event);
	};
	
	/**
		* Gets the Species with the specified scientific name.
		*
		* @param {String} scientificName Scientific name of the Species.
		* @return {Eplant.Species} Matching Species.
	*/
	Eplant.getSpeciesByScientificName = function(scientificName) {
		/* Loop through Species objects to find the Species with a matching scientificName */
		for (var n = 0; n < Eplant.species.length; n++) {
			var species = Eplant.species[n];
			if (species.scientificName.toUpperCase() == scientificName.toUpperCase()) {
				return species;
			}
		}
		
		/* Not found */
		return null;
	};
	
	/**
		* Sets ePlant's activeSpecies.
		*
		* @param {Eplant.Species} species The new activeSpecies.
	*/
	Eplant.setActiveSpecies = function(species) {
		/* Unselect GeneticElementDialog of previous activeSpecies' activeGeneticElement */
		if (Eplant.activeSpecies && Eplant.activeSpecies.activeGeneticElement && Eplant.activeSpecies.activeGeneticElement.geneticElementDialog) {
			Eplant.activeSpecies.activeGeneticElement.geneticElementDialog.unselect();
		}
		
		/* Set activeSpecies */
		Eplant.activeSpecies = species;
		
		/* Fire event for updating activeSpecies */
		var event = new ZUI.Event("update-activeSpecies", Eplant, null);
		ZUI.fireEvent(event);
		
		/* Select GeneticElementDialog of new active Species' activeGeneticElement */
		if (Eplant.activeSpecies.activeGeneticElement && Eplant.activeSpecies.activeGeneticElement.geneticElementDialog) {
			Eplant.activeSpecies.activeGeneticElement.geneticElementDialog.select();
		}
	};
	
	
	
	
	/**
		* gets the active View of a tab.
		*
		* @param {Eplant.View} activeView .
		* @param {string} tab id.
	*/
	Eplant.getTabActiveView = function(tabId) {
		return Eplant.activeViews[tabId];
	}
	
	/**
		* gets the active View of a tab.
		*
		* @param {Eplant.View} activeView .
		* @param {string} tab id.
	*/
	Eplant.setTabActiveView = function(activeView, tabId) {
		if (!tabId) {
			tabId = Eplant.activeTabId;
		}
		Eplant.activeViews[tabId] = activeView;
		
	}
	
	/**
		* deletes the active View of a tab.
		*
		* @param {string} tab id.
	*/
	Eplant.deleteTabActiveView = function(tabId) {
		
		if (Eplant.activeViews.hasOwnProperty(tabId)) {
			delete Eplant.activeViews[tabId];
		}
		
		
	}
	
	/**
		* Changes the active View of ePlant.
		*
		* @param {Eplant.View} activeView The new activeView.
	*/
	Eplant.changeActiveView = function(activeView, tabId) {
		if(activeView.isLoadedData)
		{
			var sameTab = Eplant.activeTabId == tabId;
			if (tabId) {
				Eplant.setTabActiveView(activeView, tabId);
				Eplant.activeTabId = tabId;
			}
			else {
				Eplant.setTabActiveView(activeView, Eplant.activeTabId);
				tabId = Eplant.activeTabId;
				var sameTab = true;
			}
			/* Check whether activeView change should be animated */
			if (Eplant.isAnimateActiveViewChange && sameTab) { // Yes
				/* Determine direction of animation */
				var direction = null;
				var integerMagnification1 = Math.floor(ZUI.activeView.magnification);
				var integerMagnification2 = Math.floor(activeView.magnification);
				if(ZUI.activeView.name!==activeView.name){
					if (integerMagnification1 < integerMagnification2) {
						direction = "In";
					}
					else if (integerMagnification1 > integerMagnification2) {
						direction = "Out";
					}
					else if (integerMagnification1 === integerMagnification2) {
						if(Eplant.activeView.max&&activeView.max&&activeView.max>Eplant.activeView.max){
							direction = "Down";
						}
						else{
							direction = "Up";
						}
					}
				}
				
				/* Get animation configuration */
				var exitAnimationConfig, enterAnimationConfig;
				if (direction) {
					exitAnimationConfig = ZUI.activeView["getExit" + direction + "AnimationConfig"]();
					enterAnimationConfig = activeView["getEnter" + direction + "AnimationConfig"]();
					} else {
					exitAnimationConfig = {};
					enterAnimationConfig = {};
				}
				
				/* Modify animation configurations to set up view change between the animations and create Animation objects */
				enterAnimationConfig.end = $.proxy(function() {
					if(ZUI.activeView.beforeInactive){
						ZUI.activeView.afterActive();
					}
				},this);
				var enterAnimation = new ZUI.Animation(enterAnimationConfig);
				
				var wrapper = {
					activeView: activeView,
					enterAnimation: enterAnimation
				};
				exitAnimationConfig.end = $.proxy(function() {
					/* Call inactive for the old activeView */
					ZUI.activeView.inactive();
					
					/* Change activeView */
					ZUI.activeView = this.activeView;
					
					/* Fire event for updating activeView */
					var event = new ZUI.Event("update-activeView", Eplant, null);
					ZUI.fireEvent(event);
					
					/* Synchronize activeView with activeSpecies and activeGeneticElement */
					
					if (ZUI.activeView.geneticElement) {
						if (Eplant.activeSpecies != ZUI.activeView.geneticElement.species) {
							Eplant.setActiveSpecies(ZUI.activeView.geneticElement.species);
						}
						if (Eplant.activeSpecies.activeGeneticElement != ZUI.activeView.geneticElement) {
							Eplant.activeSpecies.setActiveGeneticElement(ZUI.activeView.geneticElement);
						}
						
						} else if (ZUI.activeView.species) {
						if (Eplant.activeSpecies != ZUI.activeView.species) {
							Eplant.setActiveSpecies(ZUI.activeView.species);
						}
					}
					
					/* Call active for the new activeView */
					ZUI.activeView.active();
					
					/* Start the enter animation */
					wrapper.activeView.animate(this.enterAnimation);
				}, wrapper);
				var exitAnimation = new ZUI.Animation(exitAnimationConfig);
				if(ZUI.activeView.beforeInactive){
					ZUI.activeView.beforeInactive();
				}
				
				/* Start the exit animation */
				ZUI.activeView.animate(exitAnimation)
			}
			else { // No
				/* Call inactive for the old activeView */
				if(ZUI.activeView.beforeInactive){
					ZUI.activeView.beforeInactive();
				}
				ZUI.activeView.inactive();
				
				if(ZUI.activeView.afterActive){
					activeView.afterActive();
				}
				/* Change activeView */
				ZUI.activeView = activeView;
				
				/* Fire event for updating activeView */
				var event = new ZUI.Event("update-activeView", Eplant, null);
				ZUI.fireEvent(event);
				
				/* Synchronize activeView with activeSpecies and activeGeneticElement */
				
				if (ZUI.activeView.geneticElement) {
					if (Eplant.activeSpecies != ZUI.activeView.geneticElement.species) {
						Eplant.setActiveSpecies(ZUI.activeView.geneticElement.species);
					}
					if (Eplant.activeSpecies.activeGeneticElement != ZUI.activeView.geneticElement) {
						Eplant.activeSpecies.setActiveGeneticElement(ZUI.activeView.geneticElement);
					}
					
					} else if (ZUI.activeView.species) {
					if (Eplant.activeSpecies != ZUI.activeView.species) {
						Eplant.setActiveSpecies(ZUI.activeView.species);
					}
				}
				
				
				
				/* Call active for the new activeView */
				ZUI.activeView.active();
			}
			
			if(tabId){
				Eplant.changeActiveViewTab(tabId);
			}
			
			Eplant.activeView = activeView;
			/* Fire event for updating activeView */
			var event = new ZUI.Event("update-activeView", Eplant, null);
			ZUI.fireEvent(event);
		}
	};
	
	Eplant.changeActiveViewTab = function(tabId) {
		if(!tabId){
			tabId = Eplant.activeTabId;
		}
		var tabName = "";
		if(Eplant.smallMultipleOn){
			tabName +="Small Multiple";
		}
		else{
			tabName += Eplant.activeView.name;
			if (Eplant.activeView.geneticElement) {
				tabName += ": "+Eplant.activeView.geneticElement.identifier;
			}
		}
		
		if (tabId) {
			var $active = $("#tabs  #tabUl").find("[aria-controls='" + tabId + "']");
			$(".fullTab", $active).text(tabName);
			$(".displayTab", $active).text(tabName);
			TabManager.resizeTabs();
		}
	}
	/**
		* Updates the View icon dock.
	*/
	Eplant.updateIconDock = function() {
		
		for (var ViewName in Eplant.Views) {
			/* Get constructor */
			var View = Eplant.Views[ViewName];
			$("#"+ViewName+"Icon").removeClass("selected");
			$("#"+ViewName+"Icon").removeClass("disabled");
			
			/* Get the active view instance */
			var view = null;
			if (View.hierarchy == "ePlant") {
				view = Eplant.views[ViewName];
				if (Eplant.activeView == view) {
					$("#" + ViewName + "Icon").addClass("selected");
					$("#" + ViewName + "Icon").children("img").attr("src", View.activeIconImageURL);
				}
				else {
					$("#" + ViewName + "Icon").children("img").attr("src", View.availableIconImageURL);
				}
			}
			else if (View.hierarchy == "species") {
				if (Eplant.activeSpecies) {
					view = Eplant.activeSpecies.views[ViewName];
				}
			}
			else if (View.hierarchy == "genetic element") {
				if (Eplant.activeSpecies && Eplant.activeSpecies.activeGeneticElement) {
					view = Eplant.activeSpecies.activeGeneticElement.views[ViewName];
				}
			}
			
			
			if(ViewName === "ExperimentView"){
				if (Eplant.activeView.magnification === 35) {
					$("#" + ViewName + "Icon").addClass("selected");
					$("#ExperimentViewIcon").children("img").attr("src", "app/img/active/experiment.png");
				}
				else if(Eplant.activeSpecies && Eplant.activeSpecies.displayGeneticElements.length>0){
					$("#ExperimentViewIcon").children("img").attr("src", "app/img/available/experiment.png");
				}
				else{
					$("#ExperimentViewIcon").children("img").attr("src", View.unavailableIconImageURL);
					$("#ExperimentViewIcon").addClass("disabled");
				}
			}
			else{
				/* Set icon image */
				if (view) {
					if (Eplant.activeView == view) {
						if(view.magnification === 35){
							$("#ExperimentViewIcon").addClass("selected");
							$("#ExperimentViewIcon").children("img").attr("src", "app/img/active/experiment.png");
						}
						else{
							$("#" + ViewName + "Icon").addClass("selected");
							$("#" + ViewName + "Icon").children("img").attr("src", View.activeIconImageURL);
						}
						
					}
					else if (view.isLoadedData) {
						if(view.hierarchy == "species" && Eplant.activeSpecies)
						{
							$("#" + ViewName + "Icon").children("img").attr("src", View.availableIconImageURL);
						}
						else if(view.hierarchy !== "species"){
							$("#" + ViewName + "Icon").children("img").attr("src", View.availableIconImageURL);
						}
						else{
							$("#" + ViewName + "Icon").children("img").attr("src", View.unavailableIconImageURL);
							$("#"+ViewName+"Icon").addClass("disabled");
						}
					}
					else {
						$("#" + ViewName + "Icon").children("img").attr("src", View.unavailableIconImageURL);
						$("#"+ViewName+"Icon").addClass("disabled");
					}
				}
				else {
					$("#" + ViewName + "Icon").children("img").attr("src", View.unavailableIconImageURL);
					$("#"+ViewName+"Icon").addClass("disabled");
				}
			}
			
			
			
			
		}
	};
	
	Eplant.updateDownloadingMessage = function(isLoading) {
		if(isLoading){
			$("#enterIdentifier").attr('placeholder', 'Downloading...');// '+loadingGenesString+'...');
			if(!Eplant.geneLoadingTimeout){
				Eplant.geneLoadingTimeout=setTimeout(function(){
					Eplant.updateDownloadingMessage(false);
				}, 3000);
			}
			
		}
		else {
			if ($("#enterIdentifier").attr('placeholder').indexOf('Downloading')>-1) {
				$("#enterIdentifier").attr('placeholder', 'Enter a gene name');
			}
			clearTimeout(Eplant.geneLoadingTimeout);
			Eplant.geneLoadingTimeout=null;
		}
	};
	/**
		* Updates the GeneticElement panel
	*/
	Eplant.updateGeneticElementPanel = function() {
		/* Return if activeSpecies does not exist */
		if (!Eplant.activeSpecies) {
			return;
		}
		
		
		/* Get panel DOM container */
		var domPanel = document.getElementById("genePanel_list");
		
		/* Clear old panel content */
		//$(domPanel).empty();
		
		/* Clear old identifier query */
		Eplant.identifierQuery = [];
		
		/* Populate panel */
		
		var allLoaded = true;
		var loaded = 0;
		var notLoaded = 0;
		var loadingGenesString = "";
		for (var n = 0; n < Eplant.activeSpecies.displayGeneticElements.length; n++) {
			/* Get GeneticElement */
			var geneticElement = Eplant.activeSpecies.displayGeneticElements[n];
			
			var domItem = geneticElement.getDom();
			
			//$(domPanel).append(domItem);
			
			/* Pass if views not loaded */
			if (!geneticElement.isLoadedViewsData) {
				allLoaded = false;
				notLoaded++;
				loadingGenesString+=geneticElement.identifier+", ";
			}
			else{
				loaded++;
			}
			
			/* add loaded genetic elements */
			//Eplant.identifierQuery.push(geneticElement.identifier);
			
			
			
			/* Append item to panel */
			$(domPanel).append(domItem);
			
		}
		var loadingGenesString = loadingGenesString.replace(/(^,)|(,$)/g, "")
		if(loaded ===0 ){
			$('#genePanel_label').html('No genes / gene products currently loaded');
		}
		else if (loaded ===1 ){
			$('#genePanel_label').html(loaded+' gene / gene product currently loaded');
		}
		else{
			$('#genePanel_label').html(loaded+' genes / gene products currently loaded');
		}
		if (!allLoaded) {
			
			if (notLoaded ===1 ){
				$('#genePanel_loading_label').html(notLoaded+' gene / gene product currently loading');
			}
			else{
				$('#genePanel_loading_label').html(notLoaded+' genes / gene products currently loading');
			}
			
		}
		else {
			$('#genePanel_loading_label').html('');
			if(!Eplant.genesAllLoaded){
				var event = new ZUI.Event("genes-all-loaded", this, null);
				ZUI.fireEvent(event);
				Eplant.updateDownloadingMessage(false);
				Eplant.genesAllLoaded=true;
			}
		}
		
		
	};
	
	/**
		* Updates history icons.
	*/
	Eplant.updateHistoryIcons = function() {
		if (Eplant.history.isBackPossible()) {
			$("#historyBackIcon img").attr("src", "app/img/available/history-back.png");
			} else {
			$("#historyBackIcon img").attr("src", "app/img/unavailable/history-back.png");
		}
		if (Eplant.history.isForwardPossible()) {
			$("#historyForwardIcon img").attr("src", "app/img/available/history-forward.png");
			} else {
			$("#historyForwardIcon img").attr("src", "app/img/unavailable/history-forward.png");
		}
	};
	
	/**
		* Gets the constructor name of a View.
		*
		* @param {Eplant.View} view A View.
		* @return {String} Constructor name of the View.
	*/
	Eplant.getViewName = function(view) {
		for (var ViewName in Eplant.Views) {
			var View = Eplant.Views[ViewName];
			if (view instanceof View) {
				return ViewName;
			}
		}
		return null;
	};
	
	/**
		* Resize icons in the Icon Dock
		*
		* @param {int} height of the icon dock.
	*/
	Eplant.resizeIconDock = function(height) {
		if (!height) {
			var height = $(window).height() - 75;
		}
		var iconNum = Math.floor((height - 120) / 68), i;
		if (Eplant.iconIndex == 0) iconNum++;
		if (iconNum < Eplant.iconList.length) {
			/*for (i = 0; i < Eplant.iconIndex; i++) {
				$(Eplant.iconList[i]).hide();
				}
				for (i = Eplant.iconIndex; i < iconNum + Eplant.iconIndex; i++) {
				$(Eplant.iconList[i]).show();
				}
				for (i = iconNum + Eplant.iconIndex; i < Eplant.iconList.length; i++) {
				$(Eplant.iconList[i]).hide();
			}*/
			/*$('#navigationContainer').animate({
				top:-(Eplant.iconIndex*68)
				}, 200, function() {
				// Animation complete.
				});
				if (Eplant.iconIndex != 0) {
				$('#navigationContainer').css("margin-top", "60px");
				$('#iconTopArrow').show();
				} else {
				$('#navigationContainer').css("margin-top", "0px");
				$('#iconTopArrow').hide();
				}
				if (iconNum + Eplant.iconIndex < Eplant.iconList.length) {
				$('#navigationContainer').css("margin-bottom", "60px");
				$('#iconBottomArrow').show();
				
				} else {
				$('#navigationContainer').css("margin-bottom", "0px");
				$('#iconBottomArrow').hide();
				
				}
				Eplant.visibleIcons = iconNum;
			*/
			var newWidth = (height - (20 * Eplant.iconList.length)-10)/Eplant.iconList.length;
			var newMargin = (50 - newWidth)/2;
			if(newMargin<5){
				newWidth = 40;
				newMargin = 5;
			}
			for (i = 0; i < Eplant.iconList.length; i++) {
				
				$(Eplant.iconList[i]).css({
					'width': newWidth,
					'height': newWidth,
					'margin':'5px '+newMargin+'px'
				});
				$('img', Eplant.iconList[i]).css({
					'width': newWidth,
					'height': newWidth
				});
			}
			
		}
		else {
			/*for (i = 0; i < Eplant.iconList.length; i++) {
				
				$(Eplant.iconList[i]).show();
			}*/
			/*$('#navigationContainer').css({
				top:0
				});
				$('#iconTopArrow').hide();
				$('#iconBottomArrow').hide();
				Eplant.visibleIcons = Eplant.iconList.length;
				$('#navigationContainer').css("margin-top", 0);
			$('#navigationContainer').css("margin-bottom", 0);*/
			for (i = 0; i < Eplant.iconList.length; i++) {
				
				$(Eplant.iconList[i]).css({
					'width': '',
					'height':'',
					'margin':''
				});
				$('img', Eplant.iconList[i]).css({
					'width': '',
					'height': ''
				});
			}
		}
	};
	Eplant.resize = function() {
		
		var $left = $('#left');
		var leftMargin =$left.width()+$left.outerWidth(true)-$left.innerWidth();
		var height = $(window).height() - 75;
		var width = $(window).width()-leftMargin ;
		$('div#left').height(height);
		$('div.tab').height(height-7);
		var c = $('#ZUI_canvas');
		container = $(c).parent();
		c.attr('width', $(container).width() ); //max width
		c.attr('height', height-7 ); //max height
		if(height>600)
		{
			$('div#sequence-theme').height(height);
			$('div#sequence').height(height);
		}
		var loadingLabelHeight = $("#genePanel_loading_label").text()===""?0:20;
		$('div#genePanel_container').height(height-230);
		if($('div#genePanel_content').height()<(height-260)){
			$('div#genePanel_content').height(height-260);
		}
		else{
			$('div#genePanel_content').height('');
		}
		
		$('div.tab').width(width);
		$('div#ZUI_container').width(width);
		//$('div.tab').css('margin-left',leftMargin ); // Araport
		$('div.tab').css('left',leftMargin );
		var settings = $('div#settings_container');
		settings.width( $(window).width()- parseInt(settings.css('marginLeft'),10) );
		$('div#tabUl').width( $(window).width()- parseInt(settings.css('marginLeft'),10) );
		Eplant.resizeIconDock(height);
		if(Eplant.activeView&&Eplant.activeView.resize){
			Eplant.activeView.resize();
		}
		var list = art.dialog.list;
		for (var i in list) {
			list[i].DOM.content.css({'max-height':document.body.clientHeight*0.8-20});
			//list[i].DOM.content.css({'max-width':window.width*0.8});
			list[i]._reset();
		};
	}
	
	Eplant.wordWrap = function(str, maxWidth) {
		function testWhite(x) {
			var white = new RegExp(/^\s$/);
			return white.test(x.charAt(0));
		};
		var newLineStr = "\n"; done = false; res = [];
		do {
			found = false;
			// Inserts new line at first whitespace of the line
			for (i = maxWidth - 1; i >= 0; i--) {
				if (testWhite(str.charAt(i))) {
					res.push([str.slice(0, i), newLineStr].join(''));
					str = str.slice(i + 1);
					found = true;
					break;
				}
			}
			// Inserts new line at maxWidth position, the word is too long to wrap
			if (!found) {
				res.push([str.slice(0, maxWidth), newLineStr].join(''));
				str = str.slice(maxWidth);
			}
			
			if (str.length < maxWidth)
			done = true;
		} while (!done);
		res.push(str);
		return res;
		
		
	}
	Eplant.showLoading = function(str) {
		var domContainer = document.createElement("div");
		
		$(domContainer).append(/*'<img src="app/img/loading.gif"/><br/>'+*/str);
		var options = {};
		options.content = domContainer;
		options.lock = true;
		options.background = '#000'; 
		options.opacity = 0.6;
		options.width = 320;
		options.window = 'top'; 
		options.fixed= true; 
		options.drag= false;
		options.resize= false;
		options.init= function() {
			this.DOM.content.css({"overflow":"visible"})
		};
		
		/*options.cancel = $.proxy(function(event, ui) {
			this.close();
		}, this);*/
		Eplant.loadingDialog  = window.top.art.dialog(options);
		
	}	
	Eplant.hideLoading = function() {
		if(Eplant.loadingDialog ){
			Eplant.loadingDialog.close();
			Eplant.loadingDialog =null;
		}
	}
	
})();
