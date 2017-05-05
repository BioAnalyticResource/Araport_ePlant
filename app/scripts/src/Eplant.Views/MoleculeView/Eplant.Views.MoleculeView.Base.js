(function() {
	Eplant.Views.MoleculeView.Base = function(customConfig, customInfo, viewer) {
		var constructor = Eplant.Views.MoleculeView.Base;
		this.viewer = viewer;
		/**
			* http://www.w3.org/wiki/JavaScript_best_practices
			* configuration options
		*/
		this.canvasHoverBound = false;
		this.config = {
			CSS : {
				IDs : {
					parentDivId : '',
					jmolcontent : 'divJmolcontent',
					btnReset : 'btnReset',
					viewOptions : 'viewOptions',
					PfamDomains : 'PfamDomains',
					CDDdomains : 'CDDdomains',
					PCBindingSites:"PCBindingSites",
					protSeq : 'protSeq',
					divSeqContainer : 'divSeqContainer',
					btnCDDtryAgain : 'btnCDDtryAgain',
					btnPfamTryAgain : 'btnPfamTryAgain',
					btnPCBSTryAgain : 'btnPCBSTryAgain',
					divMenu : 'divMenu',
					divMain : 'divMain',
					divBottomWrapper: 'divBottomWrapper',
					divSeqContainer: 'divSeqContainer',
					seqSlider:"SeqSlider",
					jsMolViewer : 'oMolViewer',
					btnDefaultColor:'btnDefaultColor'
				},
				names : {
					rdFeature : 'feature',
					color : 'color',
					pSpeed : 'pSpeed',
					quality : 'quality',
					spin : 'spin',
					slab : 'slab'
				}
			},
			/*
				* Application settings
			*/
			application : {
				//the name to use to create the jmol object
				jMolObject : 'myJmol',
				//custom pfam webservice url if not using dev or eplant
				pfamUrl : null,
				//custom cdd webservice url if not using dev or eplant
				cddUrl : null,
				//
				pfamUrlBar : Eplant.ServiceUrl + 'PfamAnnot.cgi',
				//
				//pfamUrlDev : 'ProxyServlet',
				//
				cddUrlBar : Eplant.ServiceUrl + 'CDDannot.cgi',
				//
				//cddUrlDev : 'ProxyServlet',
				/*
					* background HOVER - background color for the hover label when letting mouse over atom
					* color HOVER - text color for the hover label when letting mouse over atom
					* set hoverDelay - time to show the hover label when letting mouse over atom
				* */
				defaultLoadScript :	"isDssp = false;set defaultVDW babel;"+
				"select protein or nucleic;cartoons Only;color \"#C9C9C9\";frank OFF;set disablePopupMenu false;"+
				"select *;zoom 70;translate x 5;translate y -5;display !water;"+
				"set platformSpeed 8; set cartoonFancy OFF; set highResolution OFF; set antialiasDisplay OFF;spin OFF;"+
				"select none; background HOVER \"#FFFFFF\"; color HOVER \"#000000\";set hoverDelay 0.1;HOVER off",
				//
				resetColorsScript : 'select not (protein or nucleic); color cpk; select protein or nucleic; color \'#C9C9C9\';',
				//'load "//bar.utoronto.ca/eplant_legacy/java/Phyre2-Models/Phyre2_AT1G01200.1.pdb"'
				load: 'load =2MP2' //2HHB 1crn 1cbs 4UA1 2N44 4QLP 4RKX 2N19 4N1M 2I04 1KRL 2MP2
			},
			balloons:[],
			overviewMarkers:[]
			
		}
		
		/**
			* initial JSmol setup
		*/
		this.info = {
			height : '100%',
			width : '100%',
			use : "HTML5",
			j2sPath: "app/scripts/lib/JSmol/j2s",
			//to use the php from my server http://104.197.50.15/myphptest/php/jsmol.php
			serverURL : "https://bar.utoronto.ca/eplant/cgi-bin/jsmol.php",
			src : null,
			LoadStructCallback : this.config.CSS.IDs.jsMolViewer+".setControls",
			script: "set defaultLoadScript '" + this.config.application.defaultLoadScript + "';",
			debug : false,
			disableJ2SLoadMonitor : true,
			disableInitialConsole : true,//If set true, avoids the display of messages ('console') in the Jmol panel while the Jmol object is being built initially.
			addSelectionOptions : false	//if you want to display, below the Jmol object, a menu with options for loading structures from public databases
		}
		
		// Merge object2 into object1, recursively
		if(customConfig)
		$.extend(true, this.config, customConfig);
		if(customInfo)
		$.extend(true, this.info, customInfo);
		
		this.surfaceOn =false;
		this.pDiv;
		this.myJmolOb;
		this.mySequence = {}; //holds info from each residue
		this.updown = -5;//check the default script for the starting point
		this.leftright = 5;//check the default script for the starting point
		
		window[this.config.CSS.IDs.jsMolViewer] =this;
		window[this.config.CSS.IDs.jsMolViewer].setControls=$.proxy(window[this.config.CSS.IDs.jsMolViewer].setControls,window[this.config.CSS.IDs.jsMolViewer]);
		window[this.config.CSS.IDs.jsMolViewer].hoverCallback=$.proxy(window[this.config.CSS.IDs.jsMolViewer].hoverCallback,window[this.config.CSS.IDs.jsMolViewer]);
		window[this.config.CSS.IDs.jsMolViewer].pickCallback=$.proxy(window[this.config.CSS.IDs.jsMolViewer].pickCallback,window[this.config.CSS.IDs.jsMolViewer]);
		
	};
	
	Eplant.Views.MoleculeView.Base.prototype.remove = function () {
		/*delete this.moleculeOverview;
			delete this.fullSquenceOverview;
		delete this.modelSequence;*/
		$(this.pDiv).remove();
		Jmol._destroy(window[this.config.CSS.IDs.jsMolViewer].myJmolOb);
		/*delete window[this.config.CSS.IDs.jsMolViewer].myJmolOb._applet.viewer;
			delete window[this.config.CSS.IDs.jsMolViewer].myJmolOb._applet.appletObject;
			delete window[this.config.CSS.IDs.jsMolViewer].myJmolOb._applet;
			delete window[this.config.CSS.IDs.jsMolViewer].myJmolOb;
		delete window[this.config.CSS.IDs.jsMolViewer];*/
		delete window[this.config.CSS.IDs.jMolObject];
		window[this.config.CSS.IDs.jsMolViewer] =null;
	};
	/**
		* Load jsmol viewer with supplied params
	*/
	Eplant.Views.MoleculeView.Base.prototype.init = function () {
		
		//console.log('initializing MolViewer');
		
		this.pDiv = this.jq(this.config.CSS.IDs.parentDivId)+" "; //just to make the var name shorter
		
		//------- check if load model from pdb or from url or use the default model
		var load = '';
		//example: http://localhost:8080/testjsmol/index29.html?loadpdb=4QCD
		var loadpdb = this.getQueryStringByName('loadpdb');
		//example to load model from a file (online) like eplant (bar):
		//http://localhost:8080/testjsmol/index29.html?loadfile=//bar.utoronto.ca/eplant_legacy/java/Phyre2-Models/Phyre2_AT1G01200.1.pdb
		var loadfile = this.getQueryStringByName('loadfile');
		
		if(loadpdb)
		load = "load ="+loadpdb;
		else if(loadfile)
		load = "load \""+loadfile+"\"";
		else
		load = this.config.application.load;
		//-------end
		
		//try to get the agi (gene id) from its file name, will happen when running at eplant (bar.utoronto.ca)
		//var agi = load.substring( load.lastIndexOf('_')+1, load.lastIndexOf('.'));//format Phyre2_AT1G01200.1.pdb
		var agi = this.info.identifier;//format Phyre2_AT1G01200.1.pdb
		if(agi)
		this.mySequence.agi = agi;
		
		
		//create and put the jsmol on screen
		//http://wiki.jmol.org/index.php/Jmol_JavaScript_Object/Functions
		Jmol.setDocument(0);
		Jmol.getApplet(this.config.application.jMolObject, this.info);// creates the object but does not insert it
		this.myJmolOb = window[this.config.application.jMolObject];//used to have a reference to jMol object created above
		//load model
		Jmol.script(this.myJmolOb, load);
		//insert the jsmol object in the page
		$(this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).html(Jmol.getAppletHtml(this.myJmolOb));
		if(!this.canvasHoverBound&&$(this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).find("canvas").length>0){
			$("canvas",this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).mousemove(Eplant.Views.MoleculeView.Base.updateCursor);
			this.canvasHoverBound=true;
		}
		
		//set the zoom slider
		$(this.pDiv+"#zoom-slider").slider({
			
			orientation: "vertical",
			range: "min",
			min: 5,
			max: 200,
			value: 70,
			slide: $.proxy(function(event, ui) {
				$(this.pDiv+"#zoomvalue").html(ui.value);
				$(this.pDiv+"#zoom-slider .ui-slider-handle.ui-state-default.ui-corner-all");
				//.html( ui.value ).css('color','#f6931f').css('vertical-align','middle').css('text-align','center');
				
				Jmol.script(this.myJmolOb, 'zoom '+ui.value);
			},this)
		});
		/*for the zoom slider*/
		$(this.pDiv+'#zoom-slider').css('background','lightgray');
		$(this.pDiv+'#zoom-slider .ui-widget-header').css('border','0px solid #aaaaaa').css('background','lightgray');
		$(this.pDiv+"#zoomvalue").html($("#zoom-slider").slider("value"));
		var timeoutId;
		$('.zoomButton').on("mousedown",$.proxy(function(e){
			var i = $(e.currentTarget).attr("data-zoom");
			//move and then keep moving while mousedown
			
			var current = $(this.pDiv+"#zoom-slider").slider('value');
			var to = current;
			if(i==="zoomin"){
				to = current+5;
				}else{
				to = current-5;
			}
			$(this.pDiv+"#zoom-slider").slider('value', to);
			Jmol.script(this.myJmolOb, 'zoom '+to);
			
			
			
			timeoutId = setInterval($.proxy(function() {
				var current = $(this.pDiv+"#zoom-slider").slider('value');
				var to = current;
				if(i==="zoomin"){
					to = current+5;
				}
				else{
					to = current-5;
				}
				
				$(this.pDiv+"#zoom-slider").slider('value', to);
				Jmol.script(this.myJmolOb, 'zoom '+to);
				
			},this), 100);
			},this)).bind('mouseup mouseleave', function() {
			clearInterval(timeoutId);
		});
		
		//add controls for Options
		$(this.pDiv+"input:radio[name="+this.config.CSS.names.rdFeature+"]").change($.proxy(function(e) {
			
			this.resetJsmolColors();
			var val = $("#"+this.config.CSS.IDs.divMoleculeSetting + " input[name="+this.config.CSS.names.color+"]:checked").val();
			
			switch($(e.currentTarget).val()) {
				case 'hydro':
				Jmol.script(this.myJmolOb, 'select hydrophobic; color mediumblue; '+
				'select polar; color red;wireframe 0.0; spacefill 0.0; select charged; color "#FFFF00"; select protein or nucleic; color '+val+'; select none;');
				break;
				case 'temp':
				Jmol.script(this.myJmolOb, 'select all; color relativeTemperature; select protein or nucleic; color '+val+'; select none;');
				break;
				case 'cchain':
				Jmol.script(this.myJmolOb, 'select protein or nucleic; color '+val+' chain; select none;');
				break;
				case 'cstruc':
				Jmol.script(this.myJmolOb, 'select protein or nucleic; color '+val+' structure; select none;');
				break;
				case 'cgroup':
				Jmol.script(this.myJmolOb, 'select protein or nucleic; color '+val+' group; select none;');
				break;
				default:
				break;
			}
		},this));
		
		$(this.pDiv+"#"+this.config.CSS.IDs.btnDefaultColor).on("click", $.proxy(function(){
			this.resetJsmolColors();//remove color from previous selected cdd or pfam
			this.recolorSelected();
		},this));
		
		$(this.pDiv+"#"+this.config.CSS.IDs.btnSurface).parent().on("click", $.proxy(function(e){
			this.surfaceOn =!this.surfaceOn;
			if(this.surfaceOn){
				Eplant.showLoading("JSmol is generating the molecular surface in the background, it might cause the browser to freeze for a few seconds.");
				setTimeout($.proxy(function(){
					Jmol.script(this.myJmolOb, 'isosurface ID "isosurface1" select ({0:992})  resolution 0.0 molecular 1.4;isosurface ID "isosurface1" fill noMesh noDots notFrontOnly frontlit;color isosurface translucent 0.5 [xcccccc];');
					Eplant.hideLoading();
				},this),200);
				$(this.pDiv+"#"+this.config.CSS.IDs.btnSurface).text('Hide molecular surface');
			}
			else{
				Jmol.script(this.myJmolOb, 'isosurface off');
				$(this.pDiv+"#"+this.config.CSS.IDs.btnSurface).text('Show molecular surface');
			}
			$(this.pDiv+"#"+this.config.CSS.IDs.chkSurface).attr('checked',this.surfaceOn);
		},this));
		
		//add controls for platform speed
		$(this.pDiv+"input:radio[name="+this.config.CSS.names.pSpeed+"]").change($.proxy(function(e) {
			var speed = $(e.currentTarget).val()
			Jmol.script(this.myJmolOb, 'set platformSpeed '+speed+";");
		},this));
		
		//add controls for model quality
		$(this.pDiv+"input:radio[name="+this.config.CSS.names.quality+"]").change($.proxy(function(e) {
			
			var quality = $(e.currentTarget).val()
			switch(quality) {
				case 'medium':
				Jmol.script(this.myJmolOb, "set cartoonFancy OFF; set highResolution OFF; set antialiasDisplay OFF;");
				break;
				case 'high':
				Jmol.script(this.myJmolOb, "set cartoonFancy ON; set highResolution ON; set antialiasDisplay ON;");
				break;
				default:
				break;
			}
		},this));
		
		//add controls for slab
		$(this.pDiv+"input:radio[name="+this.config.CSS.names.slab+"]").change($.proxy(function(e) {
			
			switch($(e.currentTarget).val()) {
				case 'std':
				Jmol.script(this.myJmolOb, "slab RESET;");
				break;
				case 'bhalf':
				Jmol.script(this.myJmolOb, "slab 50; depth 0;slab ON;");
				break;
				case 'fhalf':
				Jmol.script(this.myJmolOb, "slab 100;depth 50; slab ON;");
				break;
				case 'middle50':
				Jmol.script(this.myJmolOb, "slab 75; depth 25;slab ON;");
				break;
				case 'middle20':
				Jmol.script(this.myJmolOb, "slab 60; depth 40;slab ON;");
				break;
				default:
				break;
			}
		},this));
		
		//add controls for spin
		$(this.pDiv+"input:radio[name="+this.config.CSS.names.spin+"]").change($.proxy(function(e) {
			
			var spin = $(e.currentTarget).val()
			Jmol.script(this.myJmolOb, "spin "+spin+";");
		},this));
		
		//add controls for color
		$(this.pDiv+"input:radio[name='"+this.config.CSS.names.color+"']").change($.proxy(function(e) {
			
			var color = $(e.currentTarget).val()
			Jmol.script(this.myJmolOb, "select protein or nucleic; color "+color+"; select none;");
		},this));
		
		//add control reload button
		$(this.pDiv+this.jq(this.config.CSS.IDs.btnReset)).click($.proxy(function(e) {
			this.reloadModel();
		},this));
		
		//add autocomplete to select residue input field
		var availableTags = [];
		$(this.pDiv+this.jq('selResidues')).autocomplete({source: availableTags, autoFocus: false});
		
		/*examples:
			chain=a
			*:a
			lys
			gly, lys
			1:a -> for proteins from bar where you dont have chain, use just 1:
			1:a, 3:a, 1:b
			1-10:a, 3-5:b
		*:a and not gly */
		$(this.pDiv+this.jq('btnSelect')).click($.proxy(function(e) {
			if ($(this.pDiv+'#selResidues').val()) {
				//var txt = $(this.pDiv+'#selResidues').val().replace(';','');
				var items =$(this.pDiv+'#selResidues').val().split(',');
				for (var i=0, len=items.length; i<len; i++) {
					var mapped = Eplant.Views.MoleculeView.Params.acidLetterMap[items[i].trim().toUpperCase()];
					if(mapped) items[i]=mapped;
				}
				var txt = items.join();
				//var txt = $(this.pDiv+'#selResidues').val().replace(';','');
				$(this.pDiv+'#selResidues').val('');
				if($.inArray(txt, availableTags)<0)
				availableTags.push(txt);
				var selected = Jmol.evaluateVar( this.myJmolOb, "script('select "+txt+"; show residues')" );//remember to use quote marks inside script
				selected = selected.split("\n");
				for (var i=0, len=selected.length; i<len; i++) {
					if(selected[i].trim().length>0)
					this.setResidue(selected[i]);
				}
			}
		},this));
		
		//add control select residue input field
		$(this.pDiv+this.jq('selResidues')).keypress($.proxy(function (event) {
			if (event.which == 13) {
				$(this.pDiv+this.jq('btnSelect')).click();
			}
		},this));
		
		this.setSeqSlider();
		
		//set PickCallback function to run when user clicks on the model
		Jmol.script(this.myJmolOb, "set PickCallback '"+this.config.CSS.IDs.jsMolViewer+".pickCallback';");
		
		//set HoverCallback  function to run when user clicks on the model
		Jmol.script(this.myJmolOb, "set HoverCallback  '"+this.config.CSS.IDs.jsMolViewer+".hoverCallback';");
		
		//add controls for move
		var timeoutId;
		$(this.pDiv+' .viewArrow').on('mousedown',$.proxy(function(e) {
			var i = $(e.currentTarget).attr("data-direction");
			//move and then keep moving while mousedown
			this.moveModel(i);
			timeoutId = setInterval($.proxy(function() { this.moveModel(i); },this), 100);
		},this))
		.bind('mouseup mouseleave', function() {
			clearInterval(timeoutId);
		});
		
		/*
			* Will fire events for spans descendents of #protSeq.
			* This adds the events mouseenter, mouseleave and click to the aminoacid sequence
			* at the bottom. This uses delegate events so the events will be called even for the
			* elements (this case span) added after this method (that's the case, at this point the sequence still
			* doesn't exist). The sequence will be added to screen later by setControls function.
		*/
		$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).on({
			mouseenter: $.proxy(function (e) {
				//console.log('entering '+ $(this).text() +' '+ $(this).attr('id'));
				if(this.mySequence[$(e.currentTarget).attr('id')] ||this.mySequence[$(e.currentTarget).attr('data-target')] ){
					var elementId = this.mySequence[$(e.currentTarget).attr('id')]?$(e.currentTarget).attr('id'):$(e.currentTarget).attr('data-target');
					Jmol.script(this.myJmolOb, 'select '+ elementId+' ; halo 0.3;color halo "#99cc00";halo on;');
					$(this.jq(elementId)).addClass('hoveron');
				}//else
				//console.log('not a residue ');
				
			},this),
			mouseleave: $.proxy(function (e) {
				//console.log('leaving ' + $(this).text() );
				if(this.mySequence[$(e.currentTarget).attr('id')]||this.mySequence[$(e.currentTarget).attr('data-target')] ){
					var elementId = this.mySequence[$(e.currentTarget).attr('id')]?$(e.currentTarget).attr('id'):$(e.currentTarget).attr('data-target');
					Jmol.script(this.myJmolOb, 'select '+ elementId +' ; halo off;');
					$(this.jq(elementId)).removeClass('hoveron');
				}//else
				//console.log('not a residue ');
			},this),
			click: $.proxy(function (e) {
				e.stopPropagation();
				if(this.mySequence[$(e.currentTarget).attr('id')]||this.mySequence[$(e.currentTarget).attr('data-target')] ){
					var elementId = this.mySequence[$(e.currentTarget).attr('id')]?$(e.currentTarget).attr('id'):$(e.currentTarget).attr('data-target');
					this.setResidue(elementId);
				}//else
				//console.log('not a residue ');
			},this)
		}, "span, svg");
		$(document).on('resize',$.proxy(function(){
			this.setMenuMaxHeight();
			this.setSliderHandleWidth();
			$("canvas",this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).off("mousemove",Eplant.Views.MoleculeView.Base.updateCursor);
			this.canvasHoverBound = false;
		},this));
		window.onresize = $.proxy(function() {
			this.setMenuMaxHeight();
			this.setSliderHandleWidth();
			$("canvas",this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).off("mousemove",Eplant.Views.MoleculeView.Base.updateCursor);
			this.canvasHoverBound = false;
		},this);
		$(this.pDiv).find( '.hint--left' ).qtip({
			position: {
				my: 'right center', at: 'left+5 center'
			},
			content: function() {
				return $(this).attr('title');
			},
			style: {
				classes: 'a_qtip-green qtip-shadow'
			}
		});
		return this.myJmolOb;
	}
	
	Eplant.Views.MoleculeView.Base.updateCursor= function(event){
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
	};
	/**
		* move protein on screen
	*/
	Eplant.Views.MoleculeView.Base.prototype.moveModel= function(i){
		switch(i) {
			case 'up':
			this.updown -= 2;
			break;
			case 'down':
			this.updown += 2;
			break;
			case 'left':
			this.leftright -= 2;
			break;
			case 'right':
			this.leftright += 2;
			break;
			default:
			break;
		}
		Jmol.script(this.myJmolOb, "translate "+ (  (i==='up' || i==='down')?("y "+this.updown):("x "+this.leftright) )+";");
	}
	
	/**
		* callback method - set all controls related with jsmol protein structure
	*/
	Eplant.Views.MoleculeView.Base.prototype.setControls= function(a,b,c,d,e,f,g,h){
		//console.log('a: '+a+'\n'+'b: '+b+'\n'+'c: '+c+'\n'+'d: '+d+'\n'+'e: '+e+'\n'+'f: '+f+'\n'+'g: '+g+'\n'+'h: '+h);
		
		if(c != 'zapped'){//avoid call twice, happens when load a new file using the input field
			
			var codeArray = {'ALA':'A','ARG':'R','ASN':'N','ASP':'D','CYS':'C','GLU':'E','GLN':'Q','GLY':'G','HIS':'H','ILE':'I',
			'LEU':'L','LYS':'K','MET':'M','PHE':'F','PRO':'P','SER':'S','THR':'T','TRP':'W','TYR':'Y','VAL':'V'};
			
			var reverseCodeArray = {'A':'ALA','R':'ARG','N':'ASN','D':'ASP','C':'CYS','E':'GLU','Q':'GLN','G':'GLY','H':'HIS','I':'ILE',
			'L':'LEU','K':'LYS','M':'MET','F':'PHE','P':'PRO','S':'SER','T':'THR','W':'TRP','Y':'TYR','V':'VAL'};
			
			var theSeq = Jmol.evaluateVar( this.myJmolOb, "show('residues')" );
			var res = theSeq.split("\n").filter(function(n){return n; });
			this.res = res;
			//console.log('res: '+res);
			var $spanSeq = $();
			this.mySequence.sequenceArr = res;
			this.mySequence.seq1letterArr = [];		//one letter
			this.mySequence.seq3letterArr = [];		//three letter
			this.mySequence.fullseq3letterArr = [];	//three letter with index and chain letter
			this.mySequence.model3letterArr = [];	//three letter with index and chain letter
			this.mySequence.chains = {};				//by chain letter
			
			/*
				* extract residues and hold
			* */
			var modelStart = Number(res[0].split("]")[1].split(":")[0])-1;
			
			
			
			Eplant.queue.add(function(){
				$spanSeq = $spanSeq.add($( "<span/>", {
					"class" : "alignment",
					"id" : "",
					text : "["
				}));
			},this,null,this.info.identifier+"_Loading");
			
			var lastMatchNumber;
			for (var i=0, len=res.length; i<len; i+=2) {
				Eplant.queue.add(function(){
					for (var i=this.i, innerlen=i+2; i<innerlen&&i<res.length; i++) {
						
						var matches = res[i].match(/\[(.*?)\]/);
						var matchNumber = Number(res[i].match(/\](.*?)\:/)[1]);
						if(lastMatchNumber&&matchNumber!=lastMatchNumber+1){
							$spanSeq = $spanSeq.add($( "<span/>", {
								"class" : "alignment",
								"id" : "",
								text : "]"
							}));
							for (var j=lastMatchNumber, jlen=matchNumber-1; j<jlen; j++) {
								var index= j+1;
								var letter ;
								var tletters;
								if(this.viewer.config.sequenceArr){
									var letter = this.viewer.config.sequenceArr[j];
									var tletters = reverseCodeArray[letter];
									
								}
								else{
									var tletters = res[i];
									var letter = codeArray[tletters];
									
								}
								
								var full = "["+tletters+"]"+index+": ";
								
								this.viewer.mySequence.seq1letterArr.push(letter);
								this.viewer.mySequence.seq3letterArr.push(tletters);
								this.viewer.mySequence.fullseq3letterArr.push(full);
								this.viewer.mySequence.model3letterArr.push(full);
								this.viewer.mySequence[full]={oneLetterCode:letter,threeLetterCode:tletters,selected:false};
								var displayText = index+": ["+tletters+"]";
								var span = document.createElement("span");
								span.innerHTML=letter;
								span.className += 'sequence deselected hintWhite--top hintWhite--success hintWhite-rounded';
								span.setAttribute("data-hintWhite", displayText);
								span.setAttribute("id", full);
								$spanSeq = $spanSeq.add(span);
								
							}
							$spanSeq = $spanSeq.add($( "<span/>", {
								"class" : "alignment",
								"id" : "",
								text : "["
							}));
						}
						//keep only aminoacids dropping everything else, like HOH
						if (matches && codeArray[matches[1]]) {
							this.viewer.mySequence.seq1letterArr.push(codeArray[matches[1]]);
							this.viewer.mySequence.seq3letterArr.push(matches[1]);
							this.viewer.mySequence.fullseq3letterArr.push(res[i]);
							this.viewer.mySequence.model3letterArr.push(res[i]);
							this.viewer.mySequence[res[i]]={oneLetterCode:codeArray[matches[1]],threeLetterCode:matches[1],selected:false};
							
							var matches2 = res[i].match(/\:(.?)/); //get chain letter
							if (matches2){
								var chainLetter = matches2[1];
								if(this.viewer.mySequence.chains[chainLetter]){
									this.viewer.mySequence.chains[chainLetter].push(res[i]);
									}else{
									this.viewer.mySequence.chains[chainLetter] = [res[i]];
								}
							}
							var displayText = res[i].replace(matches[0],"")+matches[0];
							
							$spanSeq = $spanSeq.add($( "<span/>", {
								"class" : "sequenceModel deselected hintWhite--top hintWhite--success hintWhite-rounded",
								"id" : res[i],
								"data-hintWhite" : displayText,
								text : codeArray[matches[1]]
							}));
							if(this.viewer.config&&this.viewer.config.gaps&&this.viewer.config.gaps.indexOf(res[i])>-1){
								$spanSeq = $spanSeq.add($( "<span/>", {
									"class" : "alignment",
									"id" : "",
									text : "] ["
								}));
							}
						}
						lastMatchNumber=matchNumber;
					}
				},{viewer:this, i:i},null,this.info.identifier+"_Loading");
			}
			Eplant.queue.add(function(){
				$spanSeq = $spanSeq.add($( "<span/>", {
					"class" : "alignment",
					"id" : "",
					text : "]"
				}));
			},this,null,this.info.identifier+"_Loading");
			
			Eplant.queue.add(function(){
				this.moleculeOverview = $(this.pDiv+" .sequenceOverview");
				this.fullSquenceOverview = this.moleculeOverview.clone();
				
				var inc ;
				var currentInc;
				inc = Math.round(res.length/20);
				currentInc = modelStart;
				
				var currentLeft;
				for(var i =0;i<this.config.moleculeSequenceStringArr.length;i++){
					var seqStr = this.config.moleculeSequenceStringArr[i];
					if(seqStr.indexOf('-')>-1){
						if(!currentLeft) currentLeft=1;
						
						currentLeft += Math.round(seqStr.length/this.config.moleculeSequenceLen*10000)/100;
						
					}
					else{
						
						
						var moleculeIndicator = document.createElement("div");
						var moleculeIndicatorLength;
						var moleculeIndicatorLeft;
						
						moleculeIndicatorLength= Math.round(seqStr.length/this.config.moleculeSequenceLen*10000)/100;
						moleculeIndicatorLeft="1%";
						if(currentLeft){
							moleculeIndicatorLeft = currentLeft;
						}
						else{
							moleculeIndicatorLeft = 1;
							currentLeft=1+moleculeIndicatorLength;
						}
						
						
						$(moleculeIndicator).addClass("moleculeIndicator").css({
							width:moleculeIndicatorLength+"%",
							left:moleculeIndicatorLeft+"%"
						});
						this.moleculeOverview.append(moleculeIndicator);
					}
				}
				for (var i=0; i<20; i++) {
					var $labelNumber = $("<div style=''>"+currentInc+"</div>").addClass("labelnumber").css({"left":i*5+"%"});
					this.moleculeOverview.append($labelNumber);
					
					currentInc+=inc;
				}
				
				if(this.config.sequenceArr&&this.config.sequenceArr.length>0){
					var divider=this.config.sequenceArr.length;
					var inc ;
					var currentInc;
					
					inc = Math.round(this.config.sequenceArr.length/20);
					currentInc = 0;
					
					var currentLeft=0;
					for(var i =0;i<this.config.moleculeSequenceStringArr.length;i++){
						var seqStr = this.config.moleculeSequenceStringArr[i];
						if(seqStr.indexOf('-')>-1){
							if(!currentLeft) currentLeft=1;
							currentLeft+=Math.round(seqStr.length/divider*10000)/100;
							
						}
						else{
							
							
							var moleculeIndicator = document.createElement("div");
							var moleculeIndicatorLength;
							var moleculeIndicatorLeft;
							
							moleculeIndicatorLength= Math.round(seqStr.length/divider*10000)/100;
							if(currentLeft){
								moleculeIndicatorLeft = currentLeft;
							}
							else{
								moleculeIndicatorLeft = Math.round(modelStart/divider*10000)/100;
								currentLeft=moleculeIndicatorLeft+moleculeIndicatorLength;
							}
							
							
							$(moleculeIndicator).addClass("moleculeIndicator").css({
								width:moleculeIndicatorLength+"%",
								left:moleculeIndicatorLeft+"%"
							});
							this.fullSquenceOverview.append(moleculeIndicator);
						}
					}
					for (var i=0; i<20; i++) {
						var $labelNumber = $("<div style=''>"+currentInc+"</div>").addClass("labelnumber").css({"left":i*5+"%"});
						this.fullSquenceOverview.append($labelNumber);
						
						currentInc+=inc;
					}
				}
				
				
				
				
			},this,null,this.info.identifier+"_Loading");
			
			
			Eplant.queue.add(function(){
				
				//ajax call get Pfam domains
				this.ajaxGetPfamDomains(this.mySequence.seq1letterArr.join(''));
				//ajax call get CDD domains
				this.ajaxGetCDDfeatures(this.mySequence.seq1letterArr.join(''));
				
				this.ajaxGetPCBindingSites();
				
				this.modelSequence = $spanSeq;
				
				//add space on both sides to show both sequence ends
				var fadeWidth = $('#fadeLeft, #fadeRight').width();
				var $spanExtraSpace = $("<span class='alignment' style='width: 300px;text-align:right' >&#x25cf;</span>");
				var $spanExtraSpacecopy = $("<span class='alignment' style='width: 300px;text-align:left' >&#x25cf;</span>");
				$spanSeq = $spanExtraSpace.add(this.modelSequence).add($spanExtraSpacecopy);//jquery bug, cant use $spanExtraSpace at beginning and ending
				
				$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).empty().append($spanSeq);
				
			},this);
			Eplant.queue.add(function(){
				//adds chain letter and labels with numbers over the sequence
				var currentChainLetter;
				for (var i = 0, len = this.mySequence.fullseq3letterArr.length; i < len; i++) {
					
					var resIndex;
					//get chars between "]" and ":". It's the index position
					var matches = this.mySequence.fullseq3letterArr[i].match(/\](.*?)\:/);
					if (matches)
					resIndex = matches[1];
					
					var chainLetter;
					//get first char after ":". It's the chain letter
					var matches = this.mySequence.fullseq3letterArr[i].match(/\:(.?)/);
					if (matches)
					chainLetter = matches[1];
					
					/*
						* A chain can start with any index even negative so I keep track of the
						* letter and when it changes I know I'm starting a new chain.
						* PS: Chains not always follow alphabetic order
					* */
					if(!currentChainLetter || currentChainLetter != chainLetter){
						
						var $labelChain = $("<div class='proteinSequence' style='/*z-index:3;*/'> Protein Sequence "+chainLetter+"</div>");//z-index makes the chain keeps over the snp balloon
						this.proteinSequenceDom = $labelChain;
						$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).append($labelChain).addClass("labelnumber");
						$labelChain.position({
							my: "center bottom-20",
							at: "center top",
							of: $(this.pDiv+this.jq(this.mySequence.fullseq3letterArr[i])),
							collision: "none"
						});
						}else if(Number(resIndex) % 10 == 0 ){//add label each 10 residues
						
						var $labelNumber = $("<div style='/*z-index:3;*/'>"+resIndex+"</div>");//z-index makes the number keeps over the snp balloon
						$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).append($labelNumber).addClass("labelnumber");
						$labelNumber.position({
							my: "center bottom",
							at: "center top",
							of: $(this.pDiv+this.jq(this.mySequence.fullseq3letterArr[i])),
							collision: "none"
						});
					}
					currentChainLetter = chainLetter;
				}
				
				//load SNPs if arabidopsis
				if(this.mySequence.agi){
					this.ajaxGetSNPfeatures(this.mySequence.agi);
				}
				
				//avoid left menu overlaps the bottom div
				this.setMenuMaxHeight();
				this.setSliderHandleWidth();
				if(this.config.moleculeView&&this.config.moleculeView.loadFinish){
					this.config.moleculeView.loadFinish();
				}
				
			},this,null,this.info.identifier+"_Loading");
			Eplant.queue.add(this.getFullSequence,this,null,this.info.identifier+"_Loading");
		}
		else{//load a new structure takes time so remove all options from the older structure to avoid use old controls to interact with the new loaded structure
			$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).empty();
			$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).empty();
			$(this.pDiv+this.jq(this.config.CSS.IDs.viewOptions)).empty();
			$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).empty();
		}
		if(this.config&&this.config.callback){
			Eplant.Views.MoleculeView.loadedFunctions[this.config.callback]();
		}
		
	}
	
	/**
		* pickCallback method
	*/
	Eplant.Views.MoleculeView.Base.prototype.pickCallback= function(a,b,c,d){
		
		var clicked = b.split('.')[0];//get everything until first "."
		
		if(this.mySequence[clicked]){
			this.moveToResidue(clicked, this.setResidue);
			}else if($.inArray(clicked+": ", this.mySequence.model3letterArr) > -1){//hack - some models from eplant don't have chain letter
			this.moveToResidue(clicked+": ", this.setResidue);
			}else{
			//console.log('Warn: molViewer didnt find the clicked element: '+ clicked);
		}
	}
	
	/**
		* hoverCallback method
		*
		* This callback from jsmol works differently. Usually you have hover on and hover out functions as callbacks but not in jsmol.
		* Jsmol has only the hovercallback and while the mouse is over the element this functions keeps being called. The speed of call
		* is based on hoverDelay param. If you set hoverDelay=0.1 the function will be calleed hundreds of times per second. This can make
		* the screen unresponsive. Also the only way to simulate the hover out function is to use setTimeout, then when you move the mouse out
		* the hovercallback will stop to be called and your setTimeout will be fired.
	*/
	
	Eplant.Views.MoleculeView.Base.prototype.hoverCallback= function(a,b,c,d){
		if(!this.canvasHoverBound&&$(this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).find("canvas").length>0){
			$("canvas",this.pDiv+this.jq(this.config.CSS.IDs.jmolcontent)).mousemove(Eplant.Views.MoleculeView.Base.updateCursor);
			this.canvasHoverBound=true;
		}
		var split =b.split(' ');
		//var display = split[0]+" "+split[1];
		var res = b.split('.')[0];//get everything until first "."
		var match = res.match(/\[(.*?)\]/);
		var display = res.replace(match[0],"") +": "+ match[0];
		if(!Eplant.MoleculeViewTooltip){
			
			Eplant.MoleculeViewTooltip = new Eplant.Tooltip({content:display,x:cursorX,y:cursorY});
			}else{
			Eplant.MoleculeViewTooltip.changeTooltipPosition({clientX:cursorX,clientY:cursorY});
		}
		//hack - some models from eplant don't have chain letter
		if(!this.mySequence[res] && $.inArray(res+": ", this.mySequence.fullseq3letterArr) > -1)
		res = res+": ";
		
		if(this.mySequence[res]){
			//this.moveToResidue(res,function(){});
			if(this.checkHover && this.lastHoverResidue === res){
				clearTimeout(this.checkHover);
			}
			else{
				this.moveToResidue(res,function(){});
			}
			
			
			this.lastHoverResidue = res;
			Jmol.script(this.myJmolOb, 'select '+ res +' ; halo 0.3;color halo "#99cc00";halo on;');
			$(this.jq(res)).addClass('hoveron');
			//console.log('hovering '+res);
			this.checkHover = setTimeout($.proxy(function() {//what to do when hover out the element
				Jmol.script(this.myJmolOb, 'select '+ res +' ; halo off;');
				$(this.jq(res)).removeClass('hoveron');
				if(Eplant.MoleculeViewTooltip){
					Eplant.MoleculeViewTooltip.remove();
					Eplant.MoleculeViewTooltip=null;
				}
				//console.log('stopping '+res);
			},this), 300);
		}
	}
	
	/**
		* Move scroll to selected residue and call function
	*/
	Eplant.Views.MoleculeView.Base.prototype.moveToResidue= function(residue, func) {
		var seqContainer = $(this.jq(this.config.CSS.IDs.divSeqContainer));
		var movedelay = 1000;
		var funcdelay = 100;
		var divWidth = $(/*this.jq(this.config.CSS.IDs.divBottomWrapper)*/window).width();
		var scrollPosition = seqContainer.scrollLeft();
		var left = $(this.jq(residue)).offset().left;
		var movement = scrollPosition+left -(divWidth/2)-100;
		var handleMovement = (scrollPosition+left)/seqContainer[0].scrollWidth*100+"%"
		
		if(Math.abs(movement-scrollPosition) < 100){//if elements are VERY near each other, use VERY small delay
			movedelay = 300;
			funcdelay = 50;
			}else if(Math.abs(movement-scrollPosition) < divWidth){//if elements are near each other, use small delay
			movedelay = 500;
		}
		$(this.pDiv+this.jq(this.config.CSS.IDs.divSeqContainer)).animate({
			scrollLeft: movement,
			//there is a bug and 'complete' is being called when animation starts, then I need to do use setTimeout with movedelay
			//to start at the end of animation. To wait a bit more I use movedelay+funcdelay
			complete : setTimeout($.proxy(function(){
				func.call(this,residue);
			},this),movedelay+funcdelay)
		}, movedelay);
		$("#"+this.config.CSS.IDs.seqSlider+' .ui-slider-handle').animate({
			left: handleMovement,
			//there is a bug and 'complete' is being called when animation starts, then I need to do use setTimeout with movedelay
			//to start at the end of animation. To wait a bit more I use movedelay+funcdelay
			complete : setTimeout($.proxy(function(){
				func.call(this,residue);
			},this),movedelay+funcdelay)
		}, movedelay);
	}
	
	/**
		* Get param from browser url
	*/
	Eplant.Views.MoleculeView.Base.prototype.getQueryStringByName= function(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	
	/**
		* update max-height property from left and right options menu to avoid overlap the
		* fixed div (divBottomWrapper) at the bottom
	*/
	Eplant.Views.MoleculeView.Base.prototype.setMenuMaxHeight= function() {
		var outerHeight = $(this.pDiv+this.jq(this.config.CSS.IDs.divBottomWrapper)).outerHeight(true);
		var docHeight = $(this.pDiv+ this.jq("divMainJsmol")).height();//TODO fix
		$(this.pDiv+ this.jq(this.config.CSS.IDs.divMenu)).css('max-height',docHeight - outerHeight+75 );
		$(this.pDiv+ this.jq(this.config.CSS.IDs.divMenuRight)).css('max-height',docHeight - outerHeight +90 );
	}
	
	Eplant.Views.MoleculeView.Base.prototype.setSliderHandleWidth= function() {
		var seqContainer = $(this.pDiv+ this.jq(this.config.CSS.IDs.divSeqContainer));
		var handleWidth = seqContainer.width()/seqContainer[0].scrollWidth*seqContainer.width();
		var halfHandleWidth = handleWidth/2;
		$("#"+this.config.CSS.IDs.seqSlider+' .ui-slider-handle').css({
			width:handleWidth+"px",
			"margin-left":-halfHandleWidth+"px"
		});
		$("#"+this.config.CSS.IDs.seqSlider).css({
			"margin-left":halfHandleWidth+10+"px",
			"margin-right":halfHandleWidth+10+"px",
		});
	}
	
	Eplant.Views.MoleculeView.Base.prototype.setSeqSlider= function() {
		$(this.pDiv+this.jq(this.config.CSS.IDs.seqSlider)).slider({
			range: "min",
			min: 0,
			max: 100,
			value: 0,
			slide: $.proxy(function( event, ui ) {
				var container = document.getElementById(this.config.CSS.IDs.divSeqContainer);
				var scrollPercentage =  (container.scrollWidth-container.clientWidth)/100;
				$( container ).scrollLeft( ui.value* scrollPercentage);
			},this)
		});
		$("#"+this.config.CSS.IDs.seqSlider).css('background','lightgray');
		$("#"+this.config.CSS.IDs.seqSlider+' .ui-widget-header').css('border','0px solid #aaaaaa').css('background','lightgray');
		
	}
	
	
	
	Eplant.Views.MoleculeView.Base.prototype.getFullSequence= function(){
		
		if(this.config&&this.config.sequenceArr){
			var codeArray = {'ALA':'A','ARG':'R','ASN':'N','ASP':'D','CYS':'C','GLU':'E','GLN':'Q','GLY':'G','HIS':'H','ILE':'I',
			'LEU':'L','LYS':'K','MET':'M','PHE':'F','PRO':'P','SER':'S','THR':'T','TRP':'W','TYR':'Y','VAL':'V'};
			
			var reverseCodeArray = {'A':'ALA','R':'ARG','N':'ASN','D':'ASP','C':'CYS','E':'GLU','Q':'GLN','G':'GLY','H':'HIS','I':'ILE',
			'L':'LEU','K':'LYS','M':'MET','F':'PHE','P':'PRO','S':'SER','T':'THR','W':'TRP','Y':'TYR','V':'VAL'};
			
			var res = this.res;
			//console.log('res: '+res);
			var $spanSeq = $();
			this.mySequence.sequenceArr = res;
			this.mySequence.seq1letterArr = [];		//one letter
			this.mySequence.seq3letterArr = [];		//three letter
			this.mySequence.fullseq3letterArr = [];	//three letter with index and chain letter
			this.mySequence.chains = {};				//by chain letter
			
			/*
				* extract residues and hold
			* */
			var modelStart = Number(res[0].split("]")[1].split(":")[0])-1;
			
			this.fullSequenceLoadingNumber = 0;
			this.fullSequenceLoading = true;
			
			this.refreshFullSequence();
			
			for (var i=0, len=modelStart; i<len; i+=2) {
				Eplant.queue.add(function(){
					for (var i=this.i, innerlen=i+2; i<innerlen&&i<modelStart; i++) {
						this.viewer.fullSequenceLoadingNumber++;
						this.viewer.refreshFullSequence();
						var index= i+1;
						var tletters = reverseCodeArray[this.viewer.config.sequenceArr[i]];
						var full = "["+tletters+"]"+index+": ";
						
						this.viewer.mySequence.seq1letterArr.push(this.viewer.config.sequenceArr[i]);
						this.viewer.mySequence.seq3letterArr.push(tletters);
						this.viewer.mySequence.fullseq3letterArr.push(full);
						this.viewer.mySequence[full]={oneLetterCode:this.viewer.config.sequenceArr[i],threeLetterCode:tletters,selected:false};
						var displayText = index+": ["+tletters+"]";
						
						var span = document.createElement("span");
						span.innerHTML=this.viewer.config.sequenceArr[i];
						span.className += 'sequence deselected hintWhite--top hintWhite--success hintWhite-rounded';
						span.setAttribute("data-hintWhite", displayText);
						span.setAttribute("id", full);
						$spanSeq = $spanSeq.add(span);
						/*$spanSeq = $spanSeq.add($( "<span/>", {
							"class" : "sequence deselected hintWhite--top hintWhite--success hintWhite-rounded",
							"id" : full,
							"data-hintWhite" : displayText,
							text : this.viewer.config.sequenceArr[i]
						}));*/
					}
				},{viewer:this, i:i},null,this.info.identifier+"_Loading",0);
			}
			
			Eplant.queue.add(function(){
				$spanSeq = $spanSeq.add($( "<span/>", {
					"class" : "alignment",
					"id" : "",
					text : "["
				}));
			},this,null,this.info.identifier+"_Loading",0);
			
			var lastMatchNumber;
			for (var i=0, len=res.length; i<len; i+=2) {
				Eplant.queue.add(function(){
					for (var i=this.i, innerlen=i+2; i<innerlen&&i<res.length; i++) {
						this.viewer.fullSequenceLoadingNumber++;
						this.viewer.refreshFullSequence();
						var matches = res[i].match(/\[(.*?)\]/);
						var matchNumber = Number(res[i].match(/\](.*?)\:/)[1]);
						if(lastMatchNumber&&matchNumber!=lastMatchNumber+1){
							$spanSeq = $spanSeq.add($( "<span/>", {
								"class" : "alignment",
								"id" : "",
								text : "]"
							}));
							for (var j=lastMatchNumber, jlen=matchNumber-1; j<jlen; j++) {
								var index= j+1;
								var letter ;
								var tletters;
								if(this.viewer.config.sequenceArr){
									var letter = this.viewer.config.sequenceArr[j];
									var tletters = reverseCodeArray[letter];
									
								}
								else{
									var tletters = res[i];
									var letter = codeArray[tletters];
									
								}
								
								var full = "["+tletters+"]"+index+": ";
								
								this.viewer.mySequence.seq1letterArr.push(letter);
								this.viewer.mySequence.seq3letterArr.push(tletters);
								this.viewer.mySequence.fullseq3letterArr.push(full);
								this.viewer.mySequence[full]={oneLetterCode:letter,threeLetterCode:tletters,selected:false};
								var displayText = index+": ["+tletters+"]";
								var span = document.createElement("span");
								span.innerHTML=letter;
								span.className += 'sequence deselected hintWhite--top hintWhite--success hintWhite-rounded';
								span.setAttribute("data-hintWhite", displayText);
								span.setAttribute("id", full);
								$spanSeq = $spanSeq.add(span);
								/*$spanSeq = $spanSeq.add($( "<span/>", {
									"class" : "sequence deselected hintWhite--top hintWhite--success hintWhite-rounded",
									"id" : full,
									"data-hintWhite" : displayText,
									text : this.viewer.config.sequenceArr[j]
								}));*/
							}
							$spanSeq = $spanSeq.add($( "<span/>", {
								"class" : "alignment",
								"id" : "",
								text : "["
							}));
						}
						//keep only aminoacids dropping everything else, like HOH
						if (matches && codeArray[matches[1]]) {
							this.viewer.mySequence.seq1letterArr.push(codeArray[matches[1]]);
							this.viewer.mySequence.seq3letterArr.push(matches[1]);
							this.viewer.mySequence.fullseq3letterArr.push(res[i]);
							this.viewer.mySequence[res[i]]={oneLetterCode:codeArray[matches[1]],threeLetterCode:matches[1],selected:false};
							
							var matches2 = res[i].match(/\:(.?)/); //get chain letter
							if (matches2){
								var chainLetter = matches2[1];
								if(this.viewer.mySequence.chains[chainLetter]){
									this.viewer.mySequence.chains[chainLetter].push(res[i]);
									}else{
									this.viewer.mySequence.chains[chainLetter] = [res[i]];
								}
							}
							var displayText = res[i].replace(matches[0],"")+matches[0];
							
							$spanSeq = $spanSeq.add($( "<span/>", {
								"class" : "sequenceModel deselected hintWhite--top hintWhite--success hintWhite-rounded",
								"id" : res[i],
								"data-hintWhite" : displayText,
								text : codeArray[matches[1]]
							}));
							if(this.viewer.config&&this.viewer.config.gaps&&this.viewer.config.gaps.indexOf(res[i])>-1){
								$spanSeq = $spanSeq.add($( "<span/>", {
									"class" : "alignment",
									"id" : "",
									text : "] ["
								}));
							}
						}
						lastMatchNumber=matchNumber;
					}
				},{viewer:this, i:i},null,this.info.identifier+"_Loading",0);
			}
			Eplant.queue.add(function(){
				$spanSeq = $spanSeq.add($( "<span/>", {
					"class" : "alignment",
					"id" : "",
					text : "]"
				}));
			},this,null,this.info.identifier+"_Loading",0);
			
			var newStartIndex = Number(res[res.length-1].split("]")[1].split(":")[0]);
			for (var i=newStartIndex, len=this.config.sequenceArr.length; i<len;  i+=2) {
				Eplant.queue.add(function(){
					for (var i=this.i, innerlen=i+2; i<innerlen&&i<this.viewer.config.sequenceArr.length; i++) {
						this.viewer.fullSequenceLoadingNumber++;
						this.viewer.refreshFullSequence();
						var index= i+1;
						var tletters = reverseCodeArray[this.viewer.config.sequenceArr[i]];
						var full = "["+tletters+"]"+index+": ";
						
						var displayText = index+": ["+tletters+"]";
						
						this.viewer.mySequence.seq1letterArr.push(this.viewer.config.sequenceArr[i]);
						this.viewer.mySequence.seq3letterArr.push(tletters);
						this.viewer.mySequence.fullseq3letterArr.push(full);
						this.viewer.mySequence[full]={oneLetterCode:this.viewer.config.sequenceArr[i],threeLetterCode:tletters,selected:false};
						var span = document.createElement("span");
						span.innerHTML=this.viewer.config.sequenceArr[i];
						span.className += 'sequence deselected hintWhite--top hintWhite--success hintWhite-rounded';
						span.setAttribute("data-hintWhite", displayText);
						span.setAttribute("id", full);
						$spanSeq = $spanSeq.add(span);
						/*$spanSeq = $spanSeq.add($( "<span/>", {
							"class" : "sequence deselected hintWhite--top hintWhite--success hintWhite-rounded",
							"id" : full,
							"data-hintWhite" : displayText,
							text : this.viewer.config.sequenceArr[i]
						}));*/
					}
				},{viewer:this, i:i},null,this.info.identifier+"_Loading",0);
			}
			
			Eplant.queue.add(function(){
				
				//add space on both sides to show both sequence ends
				var fadeWidth = $('#fadeLeft, #fadeRight').width();
				var $spanExtraSpace = $("<span class='alignment' style='width: 300px;text-align:right' >&#x25cf;</span>");
				var $spanExtraSpacecopy = $("<span class='alignment' style='width: 300px;text-align:left' >&#x25cf;</span>");
				$spanSeq = $spanExtraSpace.add($spanSeq).add($spanExtraSpacecopy);//jquery bug, cant use $spanExtraSpace at beginning and ending
				
				$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).empty().append($spanSeq);
				
			},this,null,this.info.identifier+"_Loading",0);
			Eplant.queue.add(function(){
				//adds chain letter and labels with numbers over the sequence
				var currentChainLetter;
				for (var i = 0, len = this.mySequence.fullseq3letterArr.length; i < len; i++) {
					
					var resIndex;
					//get chars between "]" and ":". It's the index position
					var matches = this.mySequence.fullseq3letterArr[i].match(/\](.*?)\:/);
					if (matches)
					resIndex = matches[1];
					
					var chainLetter;
					//get first char after ":". It's the chain letter
					var matches = this.mySequence.fullseq3letterArr[i].match(/\:(.?)/);
					if (matches)
					chainLetter = matches[1];
					
					/*
						* A chain can start with any index even negative so I keep track of the
						* letter and when it changes I know I'm starting a new chain.
						* PS: Chains not always follow alphabetic order
					* */
					if(!currentChainLetter || currentChainLetter != chainLetter){
						
						var $labelChain = $("<div class='proteinSequence' style='/*z-index:3;*/'> Protein Sequence "+chainLetter+"</div>");//z-index makes the chain keeps over the snp balloon
						this.proteinSequenceDom = $labelChain;
						$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).append($labelChain).addClass("labelnumber");
						$labelChain.position({
							my: "center bottom-20",
							at: "center top",
							of: $(this.pDiv+this.jq(this.mySequence.fullseq3letterArr[i])),
							collision: "none"
						});
						}else if(Number(resIndex) % 10 == 0 ){//add label each 10 residues
						
						var $labelNumber = $("<div style='/*z-index:3;*/'>"+resIndex+"</div>");//z-index makes the number keeps over the snp balloon
						$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).append($labelNumber).addClass("labelnumber");
						$labelNumber.position({
							my: "center bottom",
							at: "center top",
							of: $(this.pDiv+this.jq(this.mySequence.fullseq3letterArr[i])),
							collision: "none"
						});
					}
					currentChainLetter = chainLetter;
				}
				
				//load SNPs if arabidopsis
				if(this.mySequence.agi){
					this.ajaxGetSNPfeatures(this.mySequence.agi);
				}
				
				//avoid left menu overlaps the bottom div
				this.setMenuMaxHeight();
				this.setSliderHandleWidth();
				if(this.config.moleculeView&&this.config.moleculeView.loadFinish){
					this.config.moleculeView.loadFinish();
				}
				this.moleculeOverview.replaceWith(this.fullSquenceOverview);
			},this,null,this.info.identifier+"_Loading",0);
		}
	}
	
	Eplant.Views.MoleculeView.Base.prototype.getPointerCopy= function(color,id,text){
		if(!color) color="#99cc00";
		var pointer = $('<svg id="'+id+'" width="30" height="45" viewBox="0 0 100 150" style="cursor: pointer;">'+
		'<polygon points="30,100 50,150 70,100" style="fill:#99cc00;stroke-width: 0;"></polygon>'+
		'<circle cx="50" cy="75" r="40" fill="#99cc00" stroke-width="0"></circle>'+
		'<text x="50" y="95" font-size="50" font-weight="bolder" fill="#000000" '+
		'style="font-family: Helvetica; " text-anchor="middle">'+text+'</text>'+
		'</svg>');
		$("polygon",pointer).css({"fill":color});
		$("circle",pointer).css({"fill":color});
		return pointer;
		
	}
	
	/**
		*
	*/
	Eplant.Views.MoleculeView.Base.prototype.ajaxGetCDDfeatures= function(fullseq){
		
		//console.log('calling CDD ajax');
		$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).empty().append("<span class='loading'>Loading CDD features</span>");
		
		var u;
		if(this.config.application.cddUrl)//custom url
		u = this.config.application.cddUrl;
		else if(window.location.hostname.indexOf('bar.utoronto.ca') > -1)//running at bar.utoronto.ca server
		u = this.config.application.cddUrlBar;
		else//dev environment
		u = this.config.application.cddUrlBar;	// Araport
		
		this.viewer.Xhrs.getCDDXhr = $.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			type: 'POST',
			dataType: 'json',
			url: u,
			timeout: 25000,
			data: { "url" : this.config.application.cddUrlBar,"FASTAseq": fullseq },
			cache: false,
			success: $.proxy(function(data, textStatus, jqXHR){
				//console.log('CDD fullseq '+fullseq+ "\nurl " + u +'\ncdd result from json:\n'+JSON.stringify(data));
				this.viewer.Xhrs.getCDDXhr = null;
				if(this.config.moleculeView){
					this.config.moleculeView.CDDRawText = JSON.stringify(data);
				}
				
				$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).empty();
				
				if(Object.keys(data).length==0){//empty
					$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).append("<span> No features found</span> <br/>");
					
					}else{
					var numberPattern = /\d+/g;//only numbers
					$.each(data, $.proxy(function(key, value) {
						
						var arIndex = value.match( numberPattern );//hold the indexes
						//console.log('residues indexes for '+key+': '+arIndex);
						for (var i=0, len=arIndex.length; i<len; i++) {
							arIndex[i]=arIndex[i]-1+"";
						}
						//change spaces to _ and removes non letters or non numbers to use as ids
						var keyId = key.replace(/ /g, "_").replace(/[^a-zA-Z0-9-_]/g, '');
						
						$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).append("<span id='"+this.config.CSS.IDs.parentDivId+keyId +"span' class='radioMenu'><input type='radio' id='"+this.config.CSS.IDs.parentDivId+keyId+"' name='"+this.config.CSS.names.rdFeature+"' value='TODO' style='' ><label for='"+this.config.CSS.IDs.parentDivId+keyId+"'>"+ key+/*" (" +value+")*/"</label></span>");
						
						$(this.jq(this.config.CSS.IDs.parentDivId+keyId)).click($.proxy(function(e) {
							this.resetJsmolColors();//remove color from previous selected cdd or pfam
							this.recolorSelected();
							this.setResiduesByIndexes(e, arIndex);
						},this));
					},this));
				}
			},this),
			error: $.proxy(function(xhr, textStatus, errorThrown){
				//console.log('cdd request failed: '+xhr.responseText+'. textStatus: '+textStatus);
				if(textStatus==="abort") {
					$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).empty();
					}else if(textStatus==="timeout") {
					$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).empty().append("<span style='white-space: normal;'>CDD features loading error. Try again?</span><br> <button class='greyButton' id='"+this.config.CSS.IDs.btnCDDtryAgain+"' style='height: 30px;padding: 0 15px;width: auto;'>Try again</button>");
					$(this.pDiv+this.jq(this.config.CSS.IDs.btnCDDtryAgain)).click(function(e) {
						this.ajaxGetCDDfeatures(this.mySequence.seq1letterArr.join(''));
					});
					}else{
					$(this.pDiv+this.jq(this.config.CSS.IDs.CDDdomains)).empty().append("<span style='white-space: normal;'>CDD features loading error. Try again?</span><br> <button class='greyButton' id='"+this.config.CSS.IDs.btnCDDtryAgain+"' style='height: 30px;padding: 0 15px;width: auto;'>Try again</button>");
					$(this.pDiv+this.jq(this.config.CSS.IDs.btnCDDtryAgain)).click(function(e) {
						this.ajaxGetCDDfeatures(this.mySequence.seq1letterArr.join(''));
					});
				}
			},this)
		});
		
	}
	/**
		*
	*/
	Eplant.Views.MoleculeView.Base.prototype.ajaxGetPCBindingSites= function(){
		
		//console.log('calling pfam ajax');
		$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).empty().append("<span class='loading'>Loading Pfam domains</span>");
		
		var u=Eplant.ServiceUrl + 'get_trp_data.php?locus='+this.info.identifier;
		
		this.viewer.Xhrs.getPCBXhr = $.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			type: 'GET',
			dataType: 'json',
			url: u,
			timeout: 25000,
			success: $.proxy(function(data, textStatus, jqXHR ){
				//console.log('pfam fullseq '+fullseq+ "\nurl " + u +'\npfam result from json:\n'+JSON.stringify(data));
				this.viewer.Xhrs.getPCBXhr = null;
				if(data.status==="fail"){
					$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).empty();
					$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).append("<span> No binding sites found</span> <br/>");
				}
				else{
					if(this.config.moleculeView){
						this.config.moleculeView.PfamRawText = JSON.stringify(data);
					}
					$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).empty();
					
					if(Object.keys(data).length==0||!data.result){//empty
						$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).append("<span> No binding sites found</span> <br/>");
					}
					else{
						var value = data.result;
						var numberPattern = /\d+/g;//only numbers
						var arIndex = value.match( numberPattern );//hold the indexes
						//console.log('residues indexes for '+key+': '+arIndex);
						for (var i=0, len=arIndex.length; i<len; i++) {
							arIndex[i]=arIndex[i]-1+"";
						}
						//change spaces to _ and removes non letters or non numbers to use as ids
						var keyId = value.replace(/ /g, "_").replace(/[^a-zA-Z0-9-_]/g, '');
						
						$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).append("<span id='"+this.config.CSS.IDs.parentDivId+keyId +"span' class='radioMenu'><input type='radio' id='"+this.config.CSS.IDs.parentDivId+keyId+"' name='"+this.config.CSS.names.rdFeature+"' value='TODO' style='' ><label for='"+this.config.CSS.IDs.parentDivId+keyId+"'>"+ value+/*" (" +value+")*/"</label></span>");
						
						$(this.jq(this.config.CSS.IDs.parentDivId+keyId)).click($.proxy(function(e) {
							this.resetJsmolColors();//remove color from previous selected cdd or pfam
							this.recolorSelected();
							this.setResiduesByIndexes(e, arIndex);
						},this));
					}
				}
				
				
			},this),
			error: $.proxy(function(xhr, textStatus, errorThrown){
				if(textStatus==="abort"||textStatus==="error") {
					$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).empty();
				}
				else if(textStatus==="timeout") {
					$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).empty().append("<span style='white-space: normal;'>Pfam domain loading error. Try again?</span><br> <button class='greyButton' id='"+this.config.CSS.IDs.btnPCBSTryAgain+"' style='height: 30px;padding: 0 15px;width: auto;'>Try again</button>");
					$(this.pDiv+this.jq(this.config.CSS.IDs.btnPCBSTryAgain)).click($.proxy(function(e) {
						this.ajaxGetPCBindingSites();
					},this));
				}
				else{
					$(this.pDiv+this.jq(this.config.CSS.IDs.PCBindingSites)).empty().append("<span style='white-space: normal;'>Pfam domain loading error. Try again?</span><br> <button class='greyButton' id='"+this.config.CSS.IDs.btnPCBSTryAgain+"' style='height: 30px;padding: 0 15px;width: auto;'>Try again</button>");
					$(this.pDiv+this.jq(this.config.CSS.IDs.btnPCBSTryAgain)).click($.proxy(function(e) {
						this.ajaxGetPCBindingSites();
					},this));
				}
			},this)
		});
		
	};
	Eplant.Views.MoleculeView.Base.prototype.ajaxGetPfamDomains= function(fullseq){
		
		//console.log('calling pfam ajax');
		$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).empty().append("<span class='loading'>Loading Pfam domains</span>");
		
		var u;
		if(this.config.application.pfamUrl)//custom url
		u = this.config.application.pfamUrl;
		else if(window.location.hostname.indexOf('bar.utoronto.ca') > -1)//running at bar.utoronto.ca server
		u = this.config.application.pfamUrlBar;
		else//dev environment
		u = this.config.application.pfamUrlBar; // Araport!
		
		this.viewer.Xhrs.getPfamXhr = $.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			type: 'POST',
			dataType: 'json',
			url: u,
			timeout: 25000,
			data: {"FASTAseq" : fullseq, "url" : this.config.application.pfamUrlBar},
			cache: false,
			success: $.proxy(function(data, textStatus, jqXHR ){
				//console.log('pfam fullseq '+fullseq+ "\nurl " + u +'\npfam result from json:\n'+JSON.stringify(data));
				this.viewer.Xhrs.getPfamXhr=null;
				if(this.config.moleculeView){
					this.config.moleculeView.PfamRawText = JSON.stringify(data);
				}
				$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).empty();
				
				if(Object.keys(data).length==0){//empty
					$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).append("<span> No domains found</span> <br/>");
					}else{
					$.each(data, $.proxy(function(key, value) {
						//console.log( 'key: '+key + ", value:" + JSON.stringify(value) +', PfamAnnot: '+value.PfamAnnot+', startIndex: '+value.startIndex+
						//', endIndex: '+value.endIndex+', Expect: '+value.Expect+', domainName: '+value.domainName );
						
						key = key.replace(/\./g,"");//removes dot from the key
						
						$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).append("<span id='"+this.config.CSS.IDs.parentDivId+key+"span' class='radioMenu'><input type='radio' id='"+this.config.CSS.IDs.parentDivId+key +"' name='"+this.config.CSS.names.rdFeature+"' value='TODO' style=''><label for='"+this.config.CSS.IDs.parentDivId+key +"'>" + value.PfamAnnot+": " + value.startIndex+" - " + value.endIndex+" ("+value.domainName+")</label></span>");
						
						$(this.jq(this.config.CSS.IDs.parentDivId+key)).on("click", $.proxy(function(){
							this.resetJsmolColors();//remove color from previous selected cdd or pfam
							this.recolorSelected();
							this.setColorByRange(value.startIndex, value.endIndex);
						},this));
					},this));
				}
			},this),
			error: $.proxy(function(xhr, textStatus, errorThrown){
				//console.log('Pfam request failed: '+xhr.responseText+'. textStatus: '+textStatus);
				if(textStatus==="abort") {
					$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).empty();
					}else if(textStatus==="timeout") {
					$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).empty().append("<span style='white-space: normal;'>Pfam domain loading error. Try again?</span><br> <button class='greyButton' id='"+this.config.CSS.IDs.btnPfamTryAgain+"' style='height: 30px;padding: 0 15px;width: auto;'>Try again</button>");
					$(this.pDiv+this.jq(this.config.CSS.IDs.btnPfamTryAgain)).click($.proxy(function(e) {
						this.ajaxGetPfamDomains(this.mySequence.seq1letterArr.join(''));
					},this));
					}else{
					$(this.pDiv+this.jq(this.config.CSS.IDs.PfamDomains)).empty().append("<span style='white-space: normal;'>Pfam domain loading error. Try again?</span><br> <button class='greyButton' id='"+this.config.CSS.IDs.btnPfamTryAgain+"' style='height: 30px;padding: 0 15px;width: auto;'>Try again</button>");
					$(this.pDiv+this.jq(this.config.CSS.IDs.btnPfamTryAgain)).click($.proxy(function(e) {
						this.ajaxGetPfamDomains(this.mySequence.seq1letterArr.join(''));
					},this));
				}
			},this)
		});
		
	};
	
	Eplant.Views.MoleculeView.Base.prototype.getPointerCopy= function(color,id,text){
		if(!color) color="#99cc00";
		var pointer = $('<svg id="'+id+'" width="30" height="45" viewBox="0 0 100 150" style="cursor: pointer;">'+
		'<polygon points="30,100 50,150 70,100" style="fill:#99cc00;stroke-width: 0;"></polygon>'+
		'<circle cx="50" cy="75" r="40" fill="#99cc00" stroke-width="0"></circle>'+
		'<text x="50" y="95" font-size="50" font-weight="bolder" fill="#000000" '+
		'style="font-family: Helvetica; " text-anchor="middle">'+text+'</text>'+
		'</svg>');
		$("polygon",pointer).css({"fill":color});
		$("circle",pointer).css({"fill":color});
		return pointer;
		
	}
	/**
		* agi - Arabidopsis Gene ID
		* Load SNPs
		*
		* This method is only for Arabidopsis from BAR project. Here I'm considering all proteins have just one chain.
		* The protein sequence is not complete most of the time but its sequence index should be corret. For example,
		* if the protein starts at aminoacid 10, then the first aminoacid needs to have index 10. This will be used to locate the correct
		* SNP, which is also based in its index, the only diference is snps are 0 index based. Example:
		*
		* "208":"AV"
		* Means at protein position 207 (not 208 because to protein sequence isn't 0 index based) there is a SNP  changing the wild type A to V.
		* Then position 207 at the protein SHOULD have an A aminoacid, otherwise there is something wrong.
	*/
	Eplant.Views.MoleculeView.Base.prototype.ajaxGetSNPfeatures= function(agi){
		
		//console.log('calling SNP ajax');
		
		var snpsMap = {}; // act as a hasmap
		var snpsDetailMap = {}; // act as a hasmap
		
		var reverseCodeArray = {'A':'ALA','R':'ARG','N':'ASN','D':'ASP','C':'CYS','E':'GLU','Q':'GLN','G':'GLY','H':'HIS','I':'ILE',
		'L':'LEU','K':'LYS','M':'MET','F':'PHE','P':'PRO','S':'SER','T':'THR','W':'TRP','Y':'TYR','V':'VAL'};
		//var that = this;
		this.viewer.Xhrs.getSNPXhr=$.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			type: 'GET',
			dataType: 'json',
			url: Eplant.ServiceUrl + 'get_snp_data.php',
			timeout: 25000,
			data: {"agi": agi, "service": 'nssnps'},
			cache: false,
			success: $.proxy(function(data, textStatus, jqXHR){
				//console.log('ajaxGetSNPfeatures result:\n'+JSON.stringify(data));
				this.viewer.Xhrs.getSNPXhr=null;
				if(data.data){
					$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).find('.SNPIndicator').remove();
					if(this.config.moleculeView){
						this.config.moleculeView.SNPRawText = JSON.stringify(data);
					}
					
					var result = data.data;
					
					//adding results to snpsMap
					$.each(result, function(key, value) {
						//console.log('key '+key+ ' - value '+JSON.stringify(value));
						
						/*
							* remember, the protein sequence most of the times are not complete having many gaps.
							* Also the returned snps are 0 index based considering the full aminoacid sequence (starts with 0).
						* */
						$.each(value, function(index, residues) {
							var chars = residues.split("");
							if(snpsDetailMap[index+":"+residues]){
								snpsDetailMap[index+":"+residues].push(key+" "+(Number(index)+1)+ ":"+chars[0]+"&#8594;"+chars[1]);
							}
							else{
								snpsDetailMap[index+":"+residues] = [];
								snpsDetailMap[index+":"+residues].push(key+" "+(Number(index)+1)+ ":"+chars[0]+"&#8594;"+chars[1]);
							}
							
							if(snpsMap[index+":"+residues]){
								snpsMap[index+":"+residues] = snpsMap[index+":"+residues] + 1;
								}else{
								snpsMap[index+":"+residues] = 1;
							}
							
							if(residues.length == 2){
								//console.log("size = 2 ");
								}else{
								//console.log("TODO size not equals 2, something wrong");
							}
							
						});
					});
					
					//console.log('snps '+JSON.stringify(snpsMap));
					
					var scrollWidth;
					for (var key in snpsMap) {
						//console.log(key, snpsMap[key]);
						
						var total = snpsMap[key];
						//key example: "110:ED"
						var value = key.split(":");
						var index = Number(value[0])+1; //+1 because its 0 index based
						var original_aa = value[1].charAt(0);
						var snp_aa = value[1].charAt(1);
						
						var aa = reverseCodeArray[original_aa];
						if(aa){
							//$('[id^=foo]')  -> return everything that starts with foo
							//$('[id^=\\[VAL\\]7]')
							//$('[id^=\\[VAL\\]7\\:\\ ]')
							//try to select element by id like 'id=[GLY35: ]'
							var $element = $(this.pDiv+'[id^=\\['+aa+'\\]'+index + '\\:\\ ]');
							var elementId = '['+aa+']'+index + ': ';
							if($element.length){
								var SNPcolor = this.getRelativeColor(total);
								var relativeSize = this.getRelativeSize(total);
								//if a second (or more) snp exists in the same index don't add. Its content goes only inside tooltip
								var $balloon;
								if( ! $(this.pDiv+this.jq("pin_tooltip_"+index)).length ){
								var balloonHolder = document.createElement('div');
									$balloon = $(this.getPointerCopy(SNPcolor,"pin_tooltip_"+index,snp_aa));//makes a copy
									$(balloonHolder).append($balloon);
									//that.this.config.balloons.push($balloon);
									$(this.pDiv+this.jq(this.config.CSS.IDs.protSeq)).append(balloonHolder);
									$(balloonHolder).position({
										my: "center bottom+10",
										at: "center top",
										of: $element,
										collision: "none"
									});
									$(balloonHolder).css({
										'margin-left': '-4px'
									});
									    
									$balloon.css({
										transform:"scale("+relativeSize+") translateY(-"+(11*(relativeSize-1))+"px)"
									})
									.attr("data-frequency",total)
									.attr("data-target",elementId);
									if(!scrollWidth)scrollWidth = $element.parent()[0].scrollWidth-600;
									var overviewLeft = ($element.position().left-300)/scrollWidth*100+"%";
									var overviewMarker = $( "<span/>", {
										"class" : "SNPIndicator",
										"id" : "",
										text : ""
									})
									.css({
										"left":overviewLeft,
										"background":SNPcolor,
										"height":relativeSize*8+"px"
									})
									.appendTo($(this.pDiv+" .sequenceOverview"));
									
									//that.this.config.overviewMarkers.push(overviewMarker);
								}
								else{
									$balloon = $(this.pDiv+this.jq("pin_tooltip_"+index));
								}
								
								
								var frequencySpan = $('<div style="font-size:18;white-space: nowrap;">Residue '+original_aa+" to "+snp_aa+" - Frequency: "+total+'</div>');
								var ecotypesSpan = this.getEcotypesSpan(snpsDetailMap,key);
								//add tooltip
								var snp3letters = reverseCodeArray[snp_aa];
								
								if($(this.pDiv+this.jq("pin_tooltip_"+index)).qtip('api')){//add snp to existing tooltip
									var txt = $(this.pDiv+this.jq("pin_tooltip_"+index)).qtip('option', 'content.text');
									/*if (typeof txt === "function") {
										txt=txt();
										txt.append("<br>");
										frequencySpan.css({"margin-top":"10px"}).appendTo(txt);
										ecotypesSpan.appendTo(txt);
										$(this.pDiv+this.jq("pin_tooltip_"+index)).qtip('api').set('content.text', $.proxy(function(){
										return this;
										},txt));
										
										}
										else{
										$(this.pDiv+this.jq("pin_tooltip_"+index)).qtip('api').set('content.text', txt+'<br><span style="font-size:18;white-space: nowrap;">Residue '+original_aa+" to "+snp_aa+" - Frequency: "+total+'</span>' );
										
									}*/
									txt.append("<br>");
									frequencySpan.css({"margin-top":"10px"}).appendTo(txt);
									ecotypesSpan.appendTo(txt);
									$(this.pDiv+this.jq("pin_tooltip_"+index)).qtip('api').set('content.text', txt );
								}
								else{//new tooltip
									var SNPInfoHolder = $(document.createElement("div"));
									SNPInfoHolder.append(frequencySpan).append(ecotypesSpan);
									var tooltip = $balloon.qtip({
										
										content: {
											//text: '<span style="font-size:18;white-space: nowrap;">Residue '+original_aa+" to "+snp_aa+" - Frequency: "+index+'</span>',
											text:SNPInfoHolder,
											//attr: 'data-tooltip'
											button: true
										},
										show: {
											event: 'click',
											solo: false //show or hide all others
										},
										hide: {
											//event: 'click',
											event: false,
											//distance: 100,
											fixed: true
										},
										position: {
											my: 'bottom center',  // Position my top left...
											at: 'top center', // at the bottom right of...
											//target: $balloon // my target
											//container: $(this.pDiv+this.jq(this.config.CSS.IDs.divSeqContainer)),
											adjust: {
												scroll: true // Can be ommited (e.g. default behaviour)
											},
											effect: false
										},
										style: {
											classes: 'a_qtip-green qtip-shadow lower-z-index'
											//def : false
										},
										events: {
											render: function(event,api){
												//console.log(api.elements.content.find('span'));
												var target = $('.ecotypesSpan', this);
												target.qtip({
													
													content: {
														text: function(api){
															var tooltipContent = target.data('tooltip-content');
															return $(tooltipContent);
														},
														//attr: 'data-tooltip'
														button: false
													},
													show: {
														//event: 'click',
														solo: false //show or hide all others
													},
													hide: {
														//event: 'click',
														//hide:false,
														delay:200,
														fixed: true, // <--- add this
														//distance: 100,
														//fixed: true
													},
													position: {
														my: 'center right',  // Position my top left...
														at: 'center left', // at the bottom right of...
														//target: $balloon // my target
														//container: $(this.pDiv+this.jq(this.config.CSS.IDs.divSeqContainer)),
														adjust: {
															scroll: true // Can be ommited (e.g. default behaviour)
														},
														effect: false
													},
													style: {
														classes: 'a_qtip-green qtip-shadow lower-z-index'
														//def : false
													}
												})
												
											}
										}
									});
									
									//need to use this to update tooltip position when moving the scroll.
									//http://craigsworks.com/projects/forums/showthread.php?tid=1529
									$(this.pDiv+this.jq(this.config.CSS.IDs.divSeqContainer)).on('scroll', $.proxy(function (event) {
										
										
										var container = document.getElementById(this.config.CSS.IDs.divSeqContainer);
										var scrollPercentage =  (container.scrollWidth-container.clientWidth)/100;
										var scrollLeftSlide = $(container).scrollLeft()/scrollPercentage;
										$('.qtip:visible').qtip('reposition');
										$(this.pDiv+this.jq(this.config.CSS.IDs.seqSlider)).slider('value', scrollLeftSlide);
										//console.log('moving divSeqContainer');
									},this));
								}
							}
						}
					}
					
					
				}
				else if(data.error){
					var msg = data.error; //No data
					//console.log('No SNP information, returned was: '+ msg);
				}
			},this),
			error: $.proxy(function(xhr, textStatus, errorThrown){
				//console.log('error: '+xhr.responseText+'. textStatus: '+textStatus);
			},this)
		});
		
	}
	
	Eplant.Views.MoleculeView.Base.prototype.getRelativeSize= function(frequency){
		
		var ratio =  (Math.abs((Math.round(ZUI.Math.log(frequency/ Eplant.Views.MoleculeView.Params.maxFrequency, 2)+Eplant.Views.MoleculeView.Params.logOffset) * 100) / 100)/Eplant.Views.MoleculeView.Params.logOffset)+1;
		
		return ratio>2?2:ratio;
	}
	
	Eplant.Views.MoleculeView.Base.prototype.refreshFullSequence= function(frequency){
		var label = this.proteinSequenceDom;
		if(label.length>0){
			if(this.fullSequenceLoading){
				
				var percent = Math.round(this.fullSequenceLoadingNumber/this.config.sequenceArr.length*100);
				if(percent>99){
					label.text("Protein Sequence")
					}else{
					label.text("Loading Full Sequence: "+percent+"%")
				}
				
				
			}
			else{
				label.text("Protein Sequence")
			}
		}
	}
	
	Eplant.Views.MoleculeView.Base.prototype.getRelativeColor= function(frequency){
		var midColor = ZUI.Util.getColorComponents(Eplant.midColor);
		var maxColor = ZUI.Util.getColorComponents(Eplant.maxColor);
		/* Get value ratio relative to maximum */
		var ratio =  Math.abs((Math.round(ZUI.Math.log(frequency/ Eplant.Views.MoleculeView.Params.maxFrequency, 2)+Eplant.Views.MoleculeView.Params.logOffset) * 100) / 100)/Eplant.Views.MoleculeView.Params.logOffset;
		var color;
		/* Check whether ratio is invalid */
		if (isNaN(ratio) || !isFinite(ratio)) { // Invalid
			color = '';
		}
		else
		{ // Valid
			if(ratio>1) {
				ratio=1;
				Eplant.Views.MoleculeView.Params.maxFrequency = frequency;
			}
			var red = midColor.red + Math.round((maxColor.red - midColor.red) * ratio);
			var green = midColor.green + Math.round((maxColor.green - midColor.green) * ratio);
			var blue = midColor.blue + Math.round((maxColor.blue - midColor.blue) * ratio);
			color = ZUI.Util.makeColorString(red, green, blue);
		}
		
		return color;
	}
	
	Eplant.Views.MoleculeView.Base.prototype.getEcotypesSpan= function(snpsDetailMap,key) {
		
		var ecotypesSpan = $('<span style="font-size:14px;white-space: nowrap;" class="ecotypesSpan"><img src="app/img/available/world.png" style="width:20px;vertical-align: middle;margin: -2px 5px 0px 2px;"/>View ecotypes with this SNP</span>');
		
		var ecotypesText = '<div style="overflow-y: auto;"><div class="selectable" style="max-height:200px;overflow: auto;font-size: 14px;padding-right: 25px;"><table class="SNPTable">';
		
		for (var i=0, len=snpsDetailMap[key].length; i<len; i++) {
			var text= snpsDetailMap[key][i];
			var serviceProvider = text.split("_")[0];
			var link = null;
			if(serviceProvider.startsWith("SALK")){
				link="http://1001genomes.org/accessions-salk.html";
			}
			else if(serviceProvider.startsWith("MPI")){
				link="http://1001genomes.org/accessions-mpi.html";
			}
			else if(serviceProvider.startsWith("JGI")){
				link="http://1001genomes.org/accessions-legacy.html";
			}
			else if(serviceProvider.startsWith("GMI")){
				link="http://1001genomes.org/accessions-gmi.html";
			}
			
			if(link){
				ecotypesText+="<tr><td><a href="+link+" target='_blank'>"+snpsDetailMap[key][i]+"</a></td></tr>";
				
				}else{
				ecotypesText+="<tr><td>"+snpsDetailMap[key][i]+"</td></tr>";
				
			}
			
		}
		
		ecotypesText+='</table></div></div>';
		$(ecotypesSpan).attr("data-tooltip-content",ecotypesText);
		
		
		return ecotypesSpan;
	}
	
	/**
		* select/unselect residue
	*/
	Eplant.Views.MoleculeView.Base.prototype.setResidue= function(residueSpan) {
		
		//I'm getting the color from the first atom from the residue, I think that's enough
		var resColor = Jmol.evaluateVar( this.myJmolOb, "{"+residueSpan+"}[0].color " );
		
		if(this.mySequence[residueSpan].selected){
			//$(this.jq(strResidue)).switchClass( "selected", "deselected", 2000, "easeInOutQuad" );
			$(this.jq(residueSpan)).removeClass('selected').addClass('deselected');
			Jmol.script(this.myJmolOb, 'select '+ residueSpan +' ; color {'+this.mySequence[residueSpan].previousColor+'};wireframe 0.0; spacefill off;');
			this.mySequence[residueSpan].selected=false;
		}
		else{
			this.mySequence[residueSpan].previousColor=resColor;
			$(this.jq(residueSpan)).removeClass('deselected').addClass('selected');
			Jmol.script(this.myJmolOb, 'select '+ residueSpan +' and (sidechain or alpha); color "#99cc00";wireframe 0.3; spacefill off;');
			this.mySequence[residueSpan].selected=true;
		}
	}
	
	/**
		* put back the colors of selected residues after select cdd or pfam domain.
		* TODO fix this avoiding remove the colors instead coloring again.
	*/
	Eplant.Views.MoleculeView.Base.prototype.recolorSelected= function() {
		
		var seq = this.mySequence.model3letterArr;
		
		for(var i=0, len=seq.length; i<len; i++) {
			if(this.mySequence[seq[i]].selected){
				Jmol.script(this.myJmolOb, 'select '+ seq[i] +' and (sidechain or alpha); color "#99cc00";');
			}
		}
		
	}
	
	/**
		* set color of residues by index
	*/
	Eplant.Views.MoleculeView.Base.prototype.setResiduesByIndexes= function(domainSpan, arrayOfIndexes) {
		
		var commandArr = [];
		
		for (var i = 0; i < arrayOfIndexes.length; i++) {
			$(this.jq(this.mySequence.model3letterArr[arrayOfIndexes[i]])).removeClass('deselected').addClass('blueSelected');
			commandArr.push(this.mySequence.model3letterArr[arrayOfIndexes[i]]);
		}
		
		
		var command = 'select ' + commandArr.join(', ') + ' ; color "#0000FF";'
		
		//upadte opaque translucent
		var val = $(this.pDiv + "input[name="+this.config.CSS.names.color+"]:checked").val();
		command +='select protein or nucleic; color '+val+'; select none;'
		
		Jmol.script(this.myJmolOb, command);
	}
	
	/**
		*
	*/
	Eplant.Views.MoleculeView.Base.prototype.resetJsmolColors= function(){
		var seqContainer = $(this.jq(this.config.CSS.IDs.divSeqContainer));
		$(seqContainer).find(".sequenceModel").removeClass('blueSelected').removeClass('selected').addClass('deselected');
		Jmol.script(this.myJmolOb, this.config.application.resetColorsScript);//
	}
	
	/**
		* set color by range
	*/
	Eplant.Views.MoleculeView.Base.prototype.setColorByRange = function(startIndex, endIndex) {
		
		var jsmolCommand = ''; //holds string command to send to jsmol
		var commandArr = [];
		
		for(var i = startIndex-1; i<=endIndex-1; i++){
			//I'm getting the color from the first atom from the residue, I think that's enough
			//Jmol.evaluateVar( myJmol, "{"+res[i]+" and *.CA}.color " );//get carbon alpha http://chemapps.stolaf.edu/jmol/docs/misc/atomInfo.txt
			//var resColor = Jmol.evaluateVar( this.myJmolOb, "{"+residueSpan+"}[0].color " );
			$(this.jq(this.mySequence.model3letterArr[i])).removeClass('deselected').addClass('blueSelected');
			commandArr.push(this.mySequence.model3letterArr[i]);
		}
		
		jsmolCommand = 'select '+ commandArr.join(', ') + ' ; color "#0000FF"; ';
		
		//update opaque translucent
		var val = $(this.pDiv + "input[name="+this.config.CSS.names.color+"]:checked").val();
		jsmolCommand +='select protein or nucleic; color '+val+'; select none;'
		
		Jmol.script(this.myJmolOb, jsmolCommand);
	}
	
	/**
		* takes care of escaping non valid ID characters and places a "#" at the beginning of the ID string: $( this.jq( "some.id" ) )
		* http://learn.jquery.com/using-jquery-core/faq/how-do-i-select-an-element-by-an-id-that-has-characters-used-in-css-notation/
	*/
	Eplant.Views.MoleculeView.Base.prototype.jq = function( myid ) {
		if(myid)
		return "#" + myid.replace( /(:|\.|\[|\]|,|\s)/g, "\\$1" );
		else
		return "";
	}
	
	/**
		* Reloads current file, will trigger LoadStructCallback callback function
		* @param
		* @return
	*/
	Eplant.Views.MoleculeView.Base.prototype.reloadModel = function(){
		$(this.pDiv+"input:radio").prop("checked", false);//remove checked radios buttons
		
		//to reset to original checked attributes on html (they have hardcoded checked="checked" at html)
		$(this.pDiv+'input[type=radio]').prop('checked', function () {
			return this.getAttribute('checked') == 'checked';
		});
		
		//reset zoom values
		$(this.pDiv+"#zoom-slider").slider("value", 70);
		$(this.pDiv+"#zoomvalue").html($(this.pDiv+"#zoom-slider").slider("value"));
		
		//reset move controls
		this.updown = -5;//check the default script for the starting point
		this.leftright = 5;//check the default script for the starting point
		
		Jmol.script(this.myJmolOb, 'load;');//load again the same structure
		
	}
	
	/**
		* put here functions and variables you want to be public
	*/
	
})();

// -----------------------------------------

//var oMolViewer;
