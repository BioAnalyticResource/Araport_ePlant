(function() {
	
	/**
		* Eplant.Views.ExperimentView class
		* Coded by Hans Yu
		* UI designed by Jamie Waese
		*
		* ePlant View for browsing and choosing eFP Experiment Views
		*
		* @constructor
		* @augments Eplant.View
	*/
	Eplant.Views.HomeView = function() {
		// Get constructor
		var constructor = Eplant.Views.HomeView ;
		
		// Call parent constructor
		Eplant.View.call(this,
		constructor.displayName,			// Name of the View visible to the user
		constructor.viewName,
		constructor.hierarchy,			// Hierarchy of the View
		constructor.magnification,			// Magnification level of the View
		constructor.description,			// Description of the View visible to the user
		constructor.citation,			// Citation template of the View
		constructor.activeIconImageURL,		// URL for the active icon image
		constructor.availableIconImageURL,		// URL for the available icon image
		constructor.unavailableIconImageURL	// URL for the unavailable icon image
		);
		
		/* Attributes */
		this.isEntryView = true;		// Identifies this View as the entry View for ePlant
		this.isAnimating = true;		// Whether an animation is taking place
		this.viewMode='home';
		this.dom=$('#sequence');
		/* Create SelectList */
		this.isLoadedData = true;
		this.svgURL = 'app/data/BiologicalLevelsInteractive.svg';
		this.labelDom = document.createElement("div");  //remove label
		this.viewInstruction='<p>Select a gene with the box on the left, or use the Expression Angler to describe an expression pattern and find genes that match it.</p>';
		this.loadData();
		
		
		
	};
	ZUI.Util.inheritClass(Eplant.View, Eplant.Views.HomeView);		// Inherit parent prototype
	
	Eplant.Views.HomeView.viewName = "HomeView";
	Eplant.Views.HomeView.displayName = "Welcome Screen";
	Eplant.Views.HomeView.hierarchy = "ePlant";
	Eplant.Views.HomeView.magnification = 0;
	Eplant.Views.HomeView.description = "Welcome Screen";
	Eplant.Views.HomeView.citation = "";
	Eplant.Views.HomeView.activeIconImageURL = "app/img/active/home.png";
	Eplant.Views.HomeView.availableIconImageURL = "app/img/available/home.png";
	Eplant.Views.HomeView.unavailableIconImageURL = "app/img/unavailable/home.png";
	Eplant.Views.HomeView.viewType = "home";
	
	Eplant.Views.HomeView.prototype.loadData = function() {
		
		this.Xhrs.loadsvgXhr = $.ajax({
			type: "GET",
			url: this.svgURL,
			success:$.proxy(function(data) {
				var map = {
					"#World_eFP_button":"The World eFP Viewer displays natural variation of gene expression levels from ecotypes collected from around the world.",
					"#Plant_eFP_button":"The Plant eFP Viewer displays the currently selected gene's expression levels in various tissues.",
					"#Experiment_eFP_button":"The Tissue & Experiment eFP Viewer displays the results of numerous gene expression profiling experiments. Select a view by clicking on a thumbnail.",
					"#Cell_eFP_button":"The Cell eFP Viewer depicts subcellular localization of a gene product.",
					"#Chromosome_Viewer_button":"The Chromosome Viewer shows where genes are situated on chromosomes.",
					"#Interaction_Viewer_button":"The Interactions Viewer displays protein interactors from our database of 70,944 predicted and 36,306 confirmed interacting proteins for the currently selected gene product, and 1784 protein-DNA interactions.",
					"#Molecule_Viewer_button":"This view displays the 3D molecular structure of the protein associated with the selected gene.",
					"#Sequence_Browser_button":"This is an implementation of JBrowse, a genome browser that lets you explore sequence data from a broad overview all the way down to individual nucleotides."
					
				};
				this.Xhrs.loadsvgXhr =null;
				// Get the SVG tag, ignore the rest
				var $svg = $(data).find('svg');
				// Add replaced image's classes to the new SVG
				$svg.attr('class', 'efp-view-svg');
				// Remove any invalid XML tags as per http://validator.w3.org
				$svg.removeAttr('xmlns:a');
				for (var ViewName in map) {
					$(ViewName, $svg).on('mouseover',$.proxy(function(e){
						var dom = document.createElement('div');
						$(dom).css({"max-width":"300px"});
						
						$(dom).append(this.content);
						var current = $(e.currentTarget);
						var tooltip = new Eplant.Tooltip({
							content: dom,
							x:$(current).offset().left+3,
							y:$(current).offset().top-8,
							classes: 'arrow-bottom',
							ele:current
						});
						this.view.tooltip = tooltip;
						
					},{view:this,content:map[ViewName]}));
					$(ViewName, $svg).on('mouseleave',$.proxy(function(e){
						
						if (this.tooltip) {
							this.tooltip.close();
							this.tooltip = null;
						}
					},this));
					
				}
				
				
				// Replace image with new SVG
				//$img.replaceWith($svg);
				
				//$svg.insertBefore( "#BioInteractiveHolder" );
				$("#BioInteractiveHolder").empty();
				$("#BioInteractiveHolder").append($svg);
				this.addScript();
			}, this)
		});
		
	};
	
	
	/**
		* Active callback method.
		*
		* @override
	*/
	Eplant.Views.HomeView.prototype.active = function() {
		/* Call parent method */
		Eplant.View.prototype.active.call(this);
		$('#getImageIcon').hide();
		$("#ZUI_container").hide();
		$("#sequence").show();
		Eplant.tutorialOn = true;
		Eplant.updateIconDock();
		
	};
	Eplant.Views.HomeView.prototype.addScript = function() {
		var script = document.createElement("script");
		script.type = "text/javascript";
		// Add script content
		
		script.innerHTML = 'var navButtons = document.getElementsByClassName("navButton");\
		var allArrows = document.getElementById("allArrows");\
		var phenotype = document.getElementById("phenotype");\
		var localization = document.getElementById("localization");\
		var subcellular_localization = document.getElementById("subcellular_localization");\
		var secondary_metabolism = document.getElementById("secondary_metabolism");\
		var primary_metabolism = document.getElementById("primary_metabolism");\
		var metabolism = document.getElementById("metabolism");\
		var protein_networks = document.getElementById("protein_networks");\
		var structure = document.getElementById("structure");\
		var protein_sequence = document.getElementById("protein_sequence");\
		var RNA_sequence = document.getElementById("RNA_sequence");\
		var signaling = document.getElementById("signaling");\
		var methylation = document.getElementById("methylation");\
		var ncRNA = document.getElementById("ncRNA");\
		var DNA_sequence = document.getElementById("DNA_sequence");\
		var natural_variation = document.getElementById("natural_variation");\
		var environment = document.getElementById("environment");\
		var World_eFP_button = document.getElementById("World_eFP_button");\
		var Plant_eFP_button = document.getElementById("Plant_eFP_button");\
		var Experiment_eFP_button = document.getElementById("Experiment_eFP_button");\
		var Cell_eFP_button = document.getElementById("Cell_eFP_button");\
		var Chromosome_Viewer_button = document.getElementById("Chromosome_Viewer_button");\
		var Interaction_Viewer_button = document.getElementById("Interaction_Viewer_button");\
		var Molecule_Viewer_button = document.getElementById("Molecule_Viewer_button");\
		var Sequence_Browser_button = document.getElementById("Sequence_Browser_button");\
		function fadeOutAllLevels() {\
		allArrows.style.opacity = "0.05";\
		phenotype.style.opacity = "0.05";\
		localization.style.opacity = "0.05";\
		subcellular_localization.style.opacity = "0.05";\
		secondary_metabolism.style.opacity = "0.05";\
		primary_metabolism.style.opacity = "0.05";\
		metabolism.style.opacity = "0.05";\
		protein_networks.style.opacity = "0.05";\
		structure.style.opacity = "0.05";\
		protein_sequence.style.opacity = "0.05";\
		RNA_sequence.style.opacity = "0.05";\
		signaling.style.opacity = "0.05";\
		methylation.style.opacity = "0.05";\
		ncRNA.style.opacity = "0.05";\
		DNA_sequence.style.opacity = "0.05";\
		natural_variation.style.opacity = "0.05";\
		environment.style.opacity = "0.05";\
		}\
		function fadeInAllLevels() {\
		allArrows.style.opacity = "1";\
		phenotype.style.opacity = "1";\
		localization.style.opacity = "1";\
		subcellular_localization.style.opacity = "1";\
		secondary_metabolism.style.opacity = "1";\
		primary_metabolism.style.opacity = "1";\
		metabolism.style.opacity = "1";\
		protein_networks.style.opacity = "1";\
		structure.style.opacity = "1";\
		protein_sequence.style.opacity = "1";\
		RNA_sequence.style.opacity = "1";\
		signaling.style.opacity = "1";\
		methylation.style.opacity = "1";\
		ncRNA.style.opacity = "1";\
		DNA_sequence.style.opacity = "1";\
		natural_variation.style.opacity = "1";\
		environment.style.opacity = "1";\
		allArrows.style.transform = "scale(1,1)";\
		phenotype.style.transform = "scale(1,1)";\
		localization.style.transform = "scale(1,1)";\
		subcellular_localization.style.transform = "scale(1,1)";\
		secondary_metabolism.style.transform = "scale(1,1)";\
		primary_metabolism.style.transform = "scale(1,1)";\
		metabolism.style.transform = "scale(1,1)";\
		protein_networks.style.transform = "scale(1,1)";\
		structure.style.transform = "scale(1,1)";\
		protein_sequence.style.transform = "scale(1,1)";\
		RNA_sequence.style.transform = "scale(1,1)";\
		signaling.style.transform = "scale(1,1)";\
		methylation.style.transform = "scale(1,1)";\
		ncRNA.style.transform = "scale(1,1)";\
		DNA_sequence.style.transform = "scale(1,1)";\
		natural_variation.style.transform = "scale(1,1)";\
		environment.style.transform = "scale(1,1)";\
		World_eFP_button.style.stroke = "#e6e6e6";\
		Plant_eFP_button.style.stroke = "#e6e6e6";\
		Experiment_eFP_button.style.stroke = "#e6e6e6";\
		Cell_eFP_button.style.stroke = "#e6e6e6";\
		Chromosome_Viewer_button.style.stroke = "#e6e6e6";\
		Interaction_Viewer_button.style.stroke = "#e6e6e6";\
		Molecule_Viewer_button.style.stroke = "#e6e6e6";\
		Sequence_Browser_button.style.stroke = "#e6e6e6";\
		}\
		function world_eFP() {\
		World_eFP_button.style.stroke = "#99CC00";\
		natural_variation.style.opacity = "1";\
		natural_variation.style.transform = "scale(1.15,1.15)";\
		DNA_sequence.style.opacity = "1";\
		DNA_sequence.style.transform = "scale(1.15,1.15)";\
		RNA_sequence.style.opacity = "1";\
		RNA_sequence.style.transform = "scale(1.15,1.15)";\
		environment.style.opacity = "1";\
	    environment.style.transform = "scale(1.15,1.15)";\
		}\
		function plant_eFP() {\
		Plant_eFP_button.style.stroke = "#99CC00";\
		localization.style.opacity = "1";\
		localization.style.transform = "scale(1.15,1.15)";\
		RNA_sequence.style.opacity = "1";\
		RNA_sequence.style.transform = "scale(1.15,1.15)";\
		phenotype.style.opacity = "1";\
		phenotype.style.transform = "scale(1.15,1.15)";\
		}\
		function experiment_eFP() {\
		Experiment_eFP_button.style.stroke = "#99CC00";\
		RNA_sequence.style.opacity = "1";\
		RNA_sequence.style.transform = "scale(1.15,1.15)";\
		localization.style.opacity = "1";\
		localization.style.transform = "scale(1.15,1.15)";\
		phenotype.style.opacity = "1";\
		phenotype.style.transform = "scale(1.15,1.15)";\
		}\
		function cell_eFP() {\
		Cell_eFP_button.style.stroke = "#99CC00";\
		subcellular_localization.style.opacity = "1";\
		subcellular_localization.style.transform = "scale(1.15,1.15)";\
		}\
		function chromosome_viewer() {\
		Chromosome_Viewer_button.style.stroke = "#99CC00";\
		DNA_sequence.style.opacity = "1";\
		DNA_sequence.style.transform = "scale(1.15,1.15)";\
		}\
		function interaction_viewer() {\
		Interaction_Viewer_button.style.stroke = "#99CC00";\
		protein_networks.style.opacity = "1";\
		protein_networks.style.transform = "scale(1.15,1.15)";\
		subcellular_localization.style.opacity = "1";\
		subcellular_localization.style.transform = "scale(1.15,1.15)";\
		DNA_sequence.style.opacity = "1";\
		DNA_sequence.style.transform = "scale(1.15,1.15)";\
		}\
		function molecule_viewer() {\
		Molecule_Viewer_button.style.stroke = "#99CC00";\
		natural_variation.style.opacity = "1";\
		natural_variation.style.transform = "scale(1.15,1.15)";\
		structure.style.opacity = "1";\
		structure.style.transform = "scale(1.15,1.15)";\
		protein_sequence.style.opacity = "1";\
		protein_sequence.style.transform = "scale(1.15,1.15)";\
		}\
		function sequence_browser() {\
		Sequence_Browser_button.style.stroke = "#99CC00";\
		protein_sequence.style.opacity = "1";\
		protein_sequence.style.transform = "scale(1.15,1.15)";\
		DNA_sequence.style.opacity = "1";\
		DNA_sequence.style.transform = "scale(1.15,1.15)";\
		RNA_sequence.style.opacity = "1";\
		RNA_sequence.style.transform = "scale(1.15,1.15)";\
		methylation.style.opacity = "1";\
		methylation.style.transform = "scale(1.15,1.15)";\
		ncRNA.style.opacity = "1";\
		ncRNA.style.transform = "scale(1.15,1.15)";\
		}\
		';
		
		
		
		document.body.appendChild(script);
	}
	
	/**
		* Inactive callback method.
		*
		* @override
	*/
	Eplant.Views.HomeView.prototype.inactive = function() {
		/* Call parent method */
		Eplant.View.prototype.inactive.call(this);
		$('#getImageIcon').show();
		$("#ZUI_container").show();
		$("#sequence").hide();
		Eplant.tutorialOn = false;
		Eplant.updateIconDock();
	};
	
	Eplant.Views.HomeView.prototype.afterActive = function() {
		Eplant.View.prototype.afterActive.call(this);
		$(this.dom).css({
			top: "0%"
		});
		
	};
	
	/**
		* Draws the View's frame.
		*
		* @Override
	*/
	Eplant.Views.HomeView.prototype.draw = function() {
		
	};
	
	/**
		* Cleans up the View for disposal
		*
		* @override
	*/
	Eplant.Views.HomeView.prototype.remove = function() {
		
	};
	
	/**
		* Returns The exit-out animation configuration.
		*
		* @override
		* @return {Object} The exit-out animation configuration.
	*/
	Eplant.Views.HomeView.prototype.getExitOutAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitOutAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.dom).stop().animate({
				top: "250%"
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
	Eplant.Views.HomeView.prototype.getEnterOutAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterOutAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.dom).css({
				top: "-250%"
			});
			$(this.dom).stop().animate({
				top: "0%"
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
	Eplant.Views.HomeView.prototype.getExitInAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitInAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.dom).stop().animate({
				top: "-250%"
			}, 1000);
			
		}, this);
		
		return config;
	};
	
	/**
		* Returns The enter-in animation configuration.
		*
		* @override
		* @return {Object} The enter-in animation configuration.
	*/
	Eplant.Views.HomeView.prototype.getEnterInAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterInAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.dom).css({
				top: "250%"
			});
			$(this.dom).stop().animate({
				top: "0%"
			}, 1000);
			/*var cover = $('<div>').css({
				position:'absolute',
				width: "100%",
				height: "100%",
				left: "0%",
				top: "0%",
				zIndex:'1000',
				background: '#ffffff'
				})
				.appendTo('#home_container');
				Eplant.getScreenShot($('#home_container')).then(function(screenShot){
				cover.remove();
				$(screenShot).css({
				position:'absolute',
				width: "0%",
				height: "0%",
				left: "50%",
				top: "50%",
				zIndex:'1000'
				})
				.appendTo('#home_container');
				$(screenShot).animate({
				width: "100%",
				height: "100%",
				left: "0%",
				top: "0%"
				}, 1000, function() {
				$(this).remove();
				});
			});*/
		}, this);
		
		return config;
	};
	
	
	
	
})();
