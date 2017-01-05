(function() {

	/**
		* Eplant.Views.GeneInfoView class
		*
		* @constructor
		* @param {Eplant.GeneticElement} The GeneticElement associated with this view.
	*/
	Eplant.Views.GeneInfoView = function(geneticElement) {
		// Get constructor
		var constructor = Eplant.Views.GeneInfoView;

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

		// Attributes
		this.geneticElement = geneticElement;
		this.viewMode ="geneinfo";

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
		}


		this.domContainer = document.createElement("div");

		$(this.domContainer).attr('id','app/geneInfo'+this.geneticElement.identifier);
		$(this.domContainer).css({
			position: 'relative',
			width: '100%',
			height: '100%',
			'z-index': '-1',
		});
		this.tableContainer=null;

		this.loadData();
	};
	ZUI.Util.inheritClass(Eplant.View, Eplant.Views.GeneInfoView);	// Inherit parent prototype
	Eplant.Views.GeneInfoView.viewName = "GeneInfoView";
	Eplant.Views.GeneInfoView.displayName = "Gene Info Viewer";
	Eplant.Views.GeneInfoView.hierarchy = "genetic element";
	Eplant.Views.GeneInfoView.magnification = 1;
	Eplant.Views.GeneInfoView.description = "Gene Info Viewer";
	Eplant.Views.GeneInfoView.citation = "";
	Eplant.Views.GeneInfoView.activeIconImageURL = "app/img/active/info.png";
	Eplant.Views.GeneInfoView.availableIconImageURL = "app/img/available/info.png";
	Eplant.Views.GeneInfoView.unavailableIconImageURL = "app/img/unavailable/info.png";
	Eplant.Views.GeneInfoView.viewType = "geneinfo";
	/* Constants */
	Eplant.Views.GeneInfoView.domContainer = null;		// DOM container for JSmol
	Eplant.Views.GeneInfoView.applet = null;			// JSmol applet object
	Eplant.Views.GeneInfoView.container = null;		// JSmol container (inside the main domContainer)
	Eplant.Views.GeneInfoView.canvas = null;			// JSmol canvas

	/* Static methods */
	/**
		* Initializes JSmol
	*/
	Eplant.Views.GeneInfoView.initialize = function() {
		// Get JSmol DOM container
		Eplant.Views.GeneInfoView.domContainer = document.getElementById("GeneInfo_container");
		// Define JSmol initialization info

		Eplant.Views.GeneInfoView.Params = {
			htmlPage: '',
			page_fragment: "app/pages/geneInfo.html"
		}

		Eplant.Views.GeneInfoView.Params.htmlPage = $.get(Eplant.Views.GeneInfoView.Params.page_fragment, function(data) {
			Eplant.Views.GeneInfoView.Params.htmlPage = data;
		});



	};
	Eplant.Views.GeneInfoView.prototype.loadData = function() {
		$.when(Eplant.Views.GeneInfoView.Params.htmlPage).then($.proxy(function( res ) {
			var clone = $(res).clone();
			$(this.domContainer).append(clone);
			this.tableContainer = $(this.domContainer).find('.geneInfoTableHolder')[0];

			// browser window scroll (in pixels) after which the "back to top" link is shown
			var offset = 100,
			//browser window scroll (in pixels) after which the "back to top" link opacity is reduced
			offset_opacity = 1200,
			//duration of the top scrolling animation (in ms)
			scroll_top_duration = 700,
			//grab the "back to top" link
			$back_to_top = $('.cd-top',this.domContainer);

			//hide or show the "back to top" link
			$(this.tableContainer).scroll(function(){
				( $(this).scrollTop() > offset ) ? $back_to_top.addClass('cd-is-visible') : $back_to_top.removeClass('cd-is-visible cd-fade-out');
				if( $(this).scrollTop() > offset_opacity ) {
					$back_to_top.addClass('cd-fade-out');
				}
			});

			//smooth scroll to top
			$back_to_top.on('click', $.proxy(function(event){
				event.preventDefault();
				$(this.tableContainer).animate({
					scrollTop: 0 ,
				}, scroll_top_duration
				);

				// close all the accoridan boxes
				$('.content-visible',this.tableContainer).removeClass('content-visible');
				$('.cd-faq-content',this.tableContainer).css('display', 'none');

			},this));

			$(clone).find('#info_locus').attr('id', "info_locus" + this.geneticElement.identifier);
			$(clone).find('#info_aliases').attr('id', "info_aliases" + this.geneticElement.identifier);
			$(clone).find('#info_fullName').attr('id', "info_fullName" + this.geneticElement.identifier);
			$(clone).find('#info_briefDescription').attr('id', "info_briefDescription" + this.geneticElement.identifier);
			$(clone).find('#info_computationalDescription').attr('id', "info_computationalDescription" + this.geneticElement.identifier);
			$(clone).find('#info_curatorSummary').attr('id', "info_curatorSummary" + this.geneticElement.identifier);
			$(clone).find('#info_location').attr('id', "info_location" + this.geneticElement.identifier);
			$(clone).find('#info_holder').attr('id', "info_holder" + this.geneticElement.identifier);
			$(clone).find('#info_chromosome_start').attr('id', "info_chromosome_start" + this.geneticElement.identifier);
			$(clone).find("#info_chromosome_end").attr('id', "info_chromosome_end" + this.geneticElement.identifier);
			$(clone).find('#info_strand').attr('id', "info_strand" + this.geneticElement.identifier);
			$(clone).find('#publicationsTable').attr('id', "publicationsTable" + this.geneticElement.identifier);
			$(clone).find('#geneRIFsTable').attr('id', "geneRIFsTable" + this.geneticElement.identifier);
			$(clone).find('#geneModel').attr('id', "geneModel" + this.geneticElement.identifier);
			$(clone).find('#info_DNAsequence').attr('id', "info_DNAsequence" + this.geneticElement.identifier);
			$(clone).find('#info_proteinSequence').attr('id', "info_proteinSequence" + this.geneticElement.identifier);


			var config = {
				IDs: {
					divLocusId: 'info_locus' + this.geneticElement.identifier,
					divAliasesId: 'info_aliases' + this.geneticElement.identifier,
					divFullNameId: 'info_fullName' + this.geneticElement.identifier,
					divBriefDescriptionId: 'info_briefDescription' + this.geneticElement.identifier,
					divComputationalDescriptionId: 'info_computationalDescription' + this.geneticElement.identifier,
					divCuratorSummaryId:'info_curatorSummary'+ this.geneticElement.identifier,
					divInfoHolderId:'info_holder'+ this.geneticElement.identifier,
					divLocationId:'info_location'+ this.geneticElement.identifier,
					divChromosomeStartId:"info_chromosome_start" + this.geneticElement.identifier,
					divChromosomeEndId:'info_chromosome_end' + this.geneticElement.identifier,
					divStrandId:'info_strand' + this.geneticElement.identifier,
					divPublicationsTableId:'publicationsTable'+ this.geneticElement.identifier,
					divGeneRIFsTableId:"geneRIFsTable" + this.geneticElement.identifier,
					divGeneModelId:'geneModel' + this.geneticElement.identifier,
					divDNAsequenceId:'info_DNAsequence' + this.geneticElement.identifier,
					divProteinSequenceId:'info_proteinSequence' + this.geneticElement.identifier
				}

			}

			// Gene Summary information from Araport:
			$.ajax({
				beforeSend: function(request) {
					request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
				},
				type: 'GET',
				url: 'https://api.araport.org/community/v0.3/araport/gene_summary_by_locus_v0.2/search?locus=' + this.geneticElement.identifier,
				dataType: 'json',
				success: $.proxy(function(data) {
					this.geneSummaryRawData = JSON.stringify(data);
					if(data.result){
						$("#"+config.IDs.divLocusId,this.domContainer).text(data.result[0].locus);
						$("#"+config.IDs.divAliasesId,this.domContainer).text(data.result[0].synonyms);
						$("#"+config.IDs.divFullNameId,this.domContainer).text(data.result[0].name);
						$("#"+config.IDs.divBriefDescriptionId,this.domContainer).text(data.result[0].brief_description);
						$("#"+config.IDs.divComputationalDescriptionId,this.domContainer).text(data.result[0].computational_description);
						$("#"+config.IDs.divCuratorSummaryId,this.domContainer).text(data.result[0].curator_summary);
						$("#"+config.IDs.divLocationId,this.domContainer).text(data.result[0].location);
						$("#"+config.IDs.divChromosomeStartId,this.domContainer).text(data.result[0].chromosome_start);
						$("#"+config.IDs.divChromosomeEndId,this.domContainer).text(data.result[0].chromosome_end);
						$("#"+config.IDs.divStrandId,this.domContainer).text(data.result[0].strand);


						this.chromosome_start =data.result[0].chromosome_start;
						this.chromosome_end = data.result[0].chromosome_end;
					}
					else{

						$("#"+config.IDs.divLocusId,this.domContainer).text("The service is not responding, please try again later.");
						$("#"+config.IDs.divAliasesId,this.domContainer).text("The service is not responding, please try again later.");
						$("#"+config.IDs.divFullNameId,this.domContainer).text("The service is not responding, please try again later.");
						$("#"+config.IDs.divBriefDescriptionId,this.domContainer).text("The service is not responding, please try again later.");
						$("#"+config.IDs.divComputationalDescriptionId,this.domContainer).text("The service is not responding, please try again later.");
						$("#"+config.IDs.divCuratorSummaryId,this.domContainer).text("The service is not responding, please try again later.");
						$("#"+config.IDs.divInfoHolderId,this.domContainer).text("The service is not responding, please try again later.");
						/*$("#"+config.IDs.divLocationId,this.domContainer).text();
						$("#"+config.IDs.divChromosomeStartId,this.domContainer).text();
						$("#"+config.IDs.divChromosomeEndId,this.domContainer).text();
						$("#"+config.IDs.divStrandId,this.domContainer).text();*/
						this.loadFail();

						this.chromosome_start =this.geneticElement.start;
						this.chromosome_end = this.geneticElement.end;

					}


					// Get Data For Gene Model
					$.ajax({
						beforeSend: function(request) {
							request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
						},
						type: "GET",
						dataType: "json",
						url: 'https://api.araport.org/community/v0.3/araport/araport11_gene_structure_by_locus_v1.1/search?locus='+this.geneticElement.identifier,
						success: $.proxy(function(data) {

							this.geneModelRawData = JSON.stringify(data);
							// size settings
							var margin = 25;
							var width = 550;
							var height = 60;
							var table = document.createElement("table");
							$(table).css({
								'border-collapse': 'separate',
								'border-spacing': '10px 5px',
								'font-size': '15px'
							});

							var geneModelFeatures = undefined;
							for (var i=0;i<data.features.length;i++){
							  if (data.features[i].uniqueID === this.geneticElement.identifier) {
							    geneModelFeatures = data.features[i].subfeatures;
							  }
							}

							for(var i =0;i<geneModelFeatures.length;i++){
								var start = geneModelFeatures[i].start;
								var end = geneModelFeatures[i].end;
								var length = Math.abs(end-start);
								var subfeatures = geneModelFeatures[i].subfeatures;
								var strand = geneModelFeatures[i].strand;
								var uniqueID = geneModelFeatures[i].uniqueID;
								/* Identifier */
								var tr = document.createElement("tr");
								/* Label */
								var td = document.createElement("td");
								$(td).css({
									"vertical-align": "middle",
									'padding-top': '13px',
									'color': '#000000'
								});
								$(td).text(uniqueID);
								$(tr).append(td);

								/* Content */
								var container = document.createElement('div');
								$(container).css({
									'height':'50px'
								});
								td = document.createElement("td");
								$(td).append(container);
								$(tr).append(td);
								$(table).append(tr);


								$("#"+config.IDs.divGeneModelId,this.domContainer).append(table);
								$(container).svg({onLoad: drawGeneModel});

								function drawGeneModel(svg) {
									$(svg._svg).width(600);
									$(svg._svg).height(50);
									$(svg._svg).css({"position":"absolute"});
									// base line
									svg.rect(5, (height/2)-1, width+(margin*2)-10, 2, {fill: '#000000', stroke: 'none'});

									// directional arrows
									if (strand === "+" ||strand === 1 ) {
										// arrow right
										svg.polyline([ [width+(margin*2),height/2], [width+(margin*2)-10,25], [width+(margin*2)-10, 35] ], {fill:'#000000', stroke: 'none'});
									}
									else {
										// arrow left
										svg.polyline([ [0,height/2], [10,25], [10, 35] ], {fill:'#000000', stroke: 'none'});
									}

									// sort the subfeatures by type so CDS doesn't get overdrawn by exons/UTRs
									subfeatures.sort( function(a,b) {
										return -1 * (a.type > b.type) - (b.type > a.type);
									});

									// draw each GFF
									for (var i = 0; i < subfeatures.length; i++) {

										// get x position
										var x = (subfeatures[i].start - start) / length * width;

										// get width
										var w =( (Math.abs(subfeatures[i].end - subfeatures[i].start)) / length ) * width;

										var rec;
										if (subfeatures[i].type === "five_prime_UTR"||subfeatures[i].type === "three_prime_UTR") {
											rec = svg.rect(margin + x, (height/2)-10, w, 20, {fill: '#cccccc', stroke: 'none', cursor: 'pointer'});
										}
										else if (subfeatures[i].type === "CDS") {
											rec = svg.rect(margin + x, (height/2)-10, w, 20, {fill: '#999999', stroke: 'none', cursor: 'pointer'});
										}
										else if (subfeatures[i].type === "exon") {
											rec = svg.rect(margin + x, (height/2)-10, w, 20, {fill: '#cccccc', stroke: 'none', cursor: 'pointer'});
										}
										else if (subfeatures[i].type != "mRNA") {
											rec = svg.rect(margin + x, (height/2)-2, w, 4, {fill: '#999999', stroke: 'none'});
										}

										if(rec){
											var text = 'Type: '+subfeatures[i].type+"<br>"+
											'Start: '+subfeatures[i].start+"<br>"+
											'End: '+subfeatures[i].end+"<br>"+
											//'Score: '+subfeatures[i].score+"<br>"+
											'Strand: '+subfeatures[i].strand+"";
											$(rec).qtip({
												content: {
													text: text
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
													my:"bottom center",
													at:"top center",
													target: 'mouse', // Track the mouse as the positioning target
													adjust: {
														method: 'none shift',
														x: +5

													} // Offset it slightly from under the mouse
												}

											});

										}
									}
								}
							}
						},this)
					});

				},this)
			});





			// Get DNA sequence
			$.ajax({
				beforeSend: function(request) {
					request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
				},
				type: "GET",
				dataType: "json",
				url: 'https://api.araport.org/community/v0.3/aip/get_sequence_by_identifier_v0.3/search?identifier=' + this.geneticElement.identifier,
				success: $.proxy(function(data) {

					this.DNARawData = JSON.stringify(data);

					if(data.result&&data.result.length>0){

						$("#"+config.IDs.divDNAsequenceId,this.domContainer).html(">"+this.geneticElement.identifier+" "+this.geneticElement.chromosome.identifier+':'+this.chromosome_start+'-'+this.chromosome_end+"<br/>"+data.result[0].sequence);
					}
					else{
						$("#"+config.IDs.divDNAsequenceId,this.domContainer).text("The service is not responding, please try again later.");
						this.loadFail();
					}
				},this)
			});

			$.ajax({
				beforeSend: function(request) {
					request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
				},
				type: "GET",
				dataType: "json",
				url: 'https://api.araport.org/community/v0.3/aip/get_protein_sequence_by_identifier_v0.2/search?identifier='+this.geneticElement.identifier+'.1',
				error: $.proxy(function() {
					$("#"+config.IDs.divProteinSequenceId,this.domContainer).text("The service is not responding, please try again later.");
					this.loadFail();
				},this),
				success: $.proxy(function(summary) {
					if(summary.result&&summary.result.length>0){
						this.modelRawData = JSON.stringify(summary);
						$("#"+config.IDs.divProteinSequenceId,this.domContainer).html(">"+this.geneticElement.identifier+".1"+"<br/>"+summary.result[0].sequence);
					}
					else{
						$("#"+config.IDs.divProteinSequenceId,this.domContainer).text("The service is not responding, please try again later.");
						this.loadFail();
					}

				},this)
			});

			this.loadFinish();
		},this));
	};
	Eplant.Views.GeneInfoView.prototype.loadFinish = function() {
		/* Set load status */
		this.isLoadedData = true;


	};



	/**
		* Active callback method.
		*
		* @override
	*/
	Eplant.Views.GeneInfoView.prototype.active = function() {
		// Call parent method
		Eplant.View.prototype.active.call(this);

		//this.resize();
		$(this.domContainer).appendTo(Eplant.Views.GeneInfoView.domContainer);
		// Make JSmol visible
		$(Eplant.Views.GeneInfoView.domContainer).css({"visibility": "visible"});
		// Get JSmol canvas


	};

	Eplant.Views.GeneInfoView.prototype.afterActive = function() {
		Eplant.View.prototype.afterActive.call(this);
		$(this.domContainer).css({
			top: "0%"
		});

	};

	Eplant.Views.GeneInfoView.prototype.remove = function () {
		// Call parent method
		Eplant.View.prototype.remove.call(this);

	};


	/**
		* Inactive callback method.
		*
		* @override
	*/
	Eplant.Views.GeneInfoView.prototype.inactive = function() {
		// Call parent method
		Eplant.View.prototype.inactive.call(this);

		$(this.domContainer).detach();
		// Hide JSmol
		$(Eplant.Views.GeneInfoView.domContainer).css({"visibility": "hidden"});

	};

	Eplant.Views.GeneInfoView.prototype.downloadRawData = function() {

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
		if(this.geneSummaryRawData){
			downloadString+="\n\nGene Summary Raw Data:\n";
			downloadString+=this.geneSummaryRawData;
		}

		if(this.modelRawData){
			downloadString+="\n\nFull Sequence Raw Data:\n";
			downloadString+=this.modelRawData;
		}

		if(this.DNARawData){
			downloadString+="\n\nDNA Squence Raw Data:\n";
			downloadString+=this.DNARawData;
		}

		if(this.geneModelRawData){
			downloadString+="\n\nGene Model Raw Data:\n";
			downloadString+=this.geneModelRawData;
		}

		var blob = new Blob([downloadString], {type: "text/plain;charset=utf-8"});
		saveAs(blob, this.name+"-"+this.geneticElement.identifier+".txt");

	};

	/**
		* Returns The exit-out animation configuration.
		*
		* @override
		* @return {Object} The exit-out animation configuration.
	*/
	Eplant.Views.GeneInfoView.prototype.getExitOutAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitOutAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.domContainer).stop().animate({
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
	Eplant.Views.GeneInfoView.prototype.getEnterOutAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterOutAnimationConfig.call(this);
		config.begin = $.proxy(function() {

			$(this.domContainer).css({
				top: "-250%"
			});
			$(this.domContainer).stop().animate({
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
	Eplant.Views.GeneInfoView.prototype.getExitInAnimationConfig = function() {
		var config = Eplant.View.prototype.getExitInAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.domContainer).stop().animate({
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
	Eplant.Views.GeneInfoView.prototype.getEnterInAnimationConfig = function() {
		var config = Eplant.View.prototype.getEnterInAnimationConfig.call(this);
		config.begin = $.proxy(function() {
			$(this.domContainer).css({
				top: "250%"
			});
			$(this.domContainer).stop().animate({
				top: "0%"
			}, 1000);
		}, this);
		return config;
	};





})();
