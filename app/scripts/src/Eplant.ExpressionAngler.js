(function() {
	
	/**
		* Eplant.View class
		* By Hans Yu
		* 
		* Base class for all ePlant views.
		*
		* @constructor
		* @augments ZUI.View
		* @param {String} name Name of the View visible to the user.
		* @param {String} hierarchy Description of the level of hierarchy.
		* 	Can be "ePlant", "species", or "genetic element".
		* @param {Number} magnification Arbitrary magnification value of the View.
		* 	This is evaluated relative to the magnification value of other Views.
		* 	Whole number value is used to determine the magnification level of the View.
		* 	Decimal number value is used to determine the position of the View relative 
		* 	to another with the same Magnification level.
		* @param {String} description Description of the View visible to the user.
		* @param {String} citation Citation template of the View.
		* @param {String} activeIconImageURL URL of the active icon image.
		* @param {String} availableIconImageURL URL of the available icon image.
		* @param {String} unavailableIconImageURL URL of the unavailable icon image.
	*/
	Eplant.ExpressionAngler = function(URL, mainIdentifier,resultCount) {
		if(Eplant.expressionXhrLink||Eplant.expressionXhrService) return;
		Eplant.currentEAQuery = URL;
		if(resultCount){
			resultCount = parseInt(resultCount, 10);	
		}
		
		
		Eplant.showEALoadingDialog();
		
		// Data for Expression Angler Post request 
		var eaRegEx = /(.*)\?(agi_id=.*)/gmi;
		var eaMatch = eaRegEx.exec(URL);
	
		// Fix for EA pointed out by reviews	
		requestData = "request={\"url\":\"" + encodeURIComponent(eaMatch[2]) + "\"}";
		
		Eplant.expressionXhrService = $.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			url: eaMatch[1],
			data: requestData, 
			type: "post",
			success: $.proxy(function( data ) {
				var doc = $.parseHTML(data)
				var tempLinkEle = $('b:contains("View data set as text")', doc);
				if(tempLinkEle.length>0){
					
					var tempFileLink = tempLinkEle.parent().attr('href').replace(/..\/.+_/i,'');
					var dataId = tempFileLink.replace(/.txt/i,'');
					var tempDistributionLink = tempFileLink.replace("ExpressionAngler","pcc_histogram");

					Eplant.expressionXhrLink = $.ajax({
						beforeSend: function(request) {
							request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
						},
						url: ExpressionAnglerUrl + 'getData.php?id=' + dataId,
						type: 'get',
						success: $.proxy(function( res) {
							$.ajax({
									beforeSend: function(request) {
									request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
								},
								url: ExpressionAnglerUrl + 'getHistogram.php?id=' + dataId,
								type: 'get',
								success: $.proxy(function(distribution) {
									var jsondis = $.parseJSON( distribution.replace(/bin/g,'"bin"').replace(/val/g,'"val"'));
								},this)
							});
							var list = Eplant.processEAList(res,mainIdentifier,resultCount);
							Eplant.closeEADialog();
							this.showFoundGenes(list,mainIdentifier,URL,resultCount);
						},this)
					});		
				}
				else{
					var dom = $('<div/>', {
					});
					dom.css({'text-align':'center'});
					var p = $('<div/>', {
						html: '<h4 style="font-weight:bold;font-size:25px">Results</h4> <br> Expression Angler found 0 matches. <br>'
						}).css({
						'max-height': '400px',
						'overflow': 'auto'
					});
					$(dom).append(p);
					Eplant.closeEADialog();
					Eplant.expressionAnglerResultDialog = DialogManager.artDialogDynamic(dom[0],{
						close:Eplant.cancelXhr
					});				
				}
			},this)
		});
	};
	
	Eplant.showEALoadingDialog = function() {
		var dom = $('<div/>', {
		});
		dom.css({'text-align':'center'});
		var p = $('<div/>', {
			text: 'Loading, click cancel to stop loading.'
		}).css({'padding':'10px'});
		var propgressBar = $('<div/>', {
			'class': 'progressBar'
		});
		var propgressLabel = $('<div/>', {
			'class': 'progressLabel'
		});
		var warning = $('<div/>', {
			text: 'Still loading. Try limiting the r-value range so it returns fewer results.'
		}).css({'padding':'10px','display':'none'});
		
		var cancelButton = $('<input/>', {
			type: 'button',
			value: "Cancel",
			'class':'button greenButton'
		});
		cancelButton.css({'margin-top':'10px'});
		cancelButton.on('click',$.proxy(function(){
			Eplant.cancelXhr();
			Eplant.closeEADialog();
		},Eplant));
		$(dom).append(p).append(propgressBar.append(propgressLabel)).append(warning).append(cancelButton);
		Eplant.expressionAnglerLoadingDialog = DialogManager.artDialogDynamic(dom[0],{
			close:Eplant.cancelXhr
		});
		var $progressbar = $( ".progressBar",dom ),
		$progressLabel = $( ".progressLabel",dom );
		
		$progressbar.progressbar({
			value: false,
			change: function() {
				$progressLabel.text( $progressbar.progressbar( "value" ) + "%" );
			},
			complete: function() {
				$progressLabel.text( "Still Loading" ).css({'margin-left':'-40px'});;
				warning.show();
			}
		});
		
		function progress() {
			var val = $progressbar.progressbar( "value" ) || 0;
			
			$progressbar.progressbar( "value", val + 4 );
			
			if ( val < 99 ) {
				setTimeout( progress, 1000 );
			}
		}
		
		setTimeout( progress, 1000 );
	};
	
	Eplant.processEAList = function(res,mainIdentifier,resultCount){
		var allTextLines = res.split(/\r\n|\n/);
		var headers = allTextLines[0].split(/\t/);
		var lines = [];
		
		for (var i=1; i<allTextLines.length; i++) {
			var data = allTextLines[i].split(/\t/);
			if (data.length == headers.length) {
				
				var tarr = [];
				for (var j=0; j<2; j++) {
					tarr.push(data[j]);
				}
				if(/^[a-z0-9]+$/i.test(tarr[0])){//&&!tarr[0].toUpperCase().contains(mainIdentifier.toUpperCase())){
					lines.push(tarr);
				}
			}
		}
		var list = [];
		/*if(mainIdentifier&&lines[0][0].toUpperCase()===mainIdentifier.toUpperCase()){
			var term = lines[0][0];
			var rv = lines[0][1].split('|')[0];
			
			list.push({
			term:term,
			rValue:rv
			});
			
		}*/
		for(var i = 0;i<lines.length;i++){
			if(lines[i][0]){
				//if(!mainIdentifier||lines[i][0].toUpperCase()!==mainIdentifier.toUpperCase()){
				var term = lines[i][0];
				var rv = lines[i][1].split('|')[0];
				if(term.indexOf("00000") <= -1&&$.grep(list, function(e){ return e.term == term; }).length===0){
					list.push({
						term:term,
						rValue:rv
					});
				}
				
				
			}
			
			
		}
		
		
		//var count = parseInt(unescape(URL.replace(new RegExp("^(?:.*[&\\?]" + escape('match_count').replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1")));	
		if(resultCount){
			var sliceCount = Math.abs(resultCount);
			list= list.slice(0, (mainIdentifier)?sliceCount+1:sliceCount);
		}
		
		return list;
	};
	
	
	Eplant.loadMoreEAGenes = function() {
		var getQueryString = function ( field, url ) {
			var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
			var string = reg.exec(url);
			return string ? string[1] : null;
		};
		
		var resultCount = getQueryString("match_count",Eplant.currentEAQuery);
		if(resultCount){
			resultCount = parseInt(resultCount, 10);
			if(resultCount>0){
				resultCount += 5;
			}
			else{
				resultCount -= 5;
			}
			Eplant.currentEAQuery = Eplant.currentEAQuery.replace(/(match_count=)[^\&]+/, '$1' + resultCount);
		}
		
		Eplant.showEALoadingDialog();
		
		var eaRegEx = /(.*)\?(agi_id=.*)/gmi;
		var eaMatch = eaRegEx.exec(Eplant.currentEAQuery);
		
		Eplant.expressionXhrService = $.ajax({
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
			},
			url: eaMatch[1],
			data: eaMatch[2], 
			type: "post",
			success: $.proxy(function( data ) {
				var doc = $.parseHTML(data)
				var tempLinkEle = $('b:contains("View data set as text")', doc);
				if(tempLinkEle.length>0){
					
					var tempFileLink = tempLinkEle.parent().attr('href').replace(/..\/.+_/i,'');
					var dataId = tempFileLink.replace(/.txt/i,'');
					var tempDistributionLink = tempFileLink.replace("ExpressionAngler","pcc_histogram");

					Eplant.expressionXhrLink = $.ajax({
						beforeSend: function(request) {
							request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
						},
						url: ExpressionAnglerUrl + 'getData.php?id=' + dataId,
						type: 'get',
						success: $.proxy(function( res) {
							$.ajax({
									beforeSend: function(request) {
									request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
								},
								url: ExpressionAnglerUrl + 'getHistogram.php?id=' + dataId,
								type: 'get',
								success: $.proxy(function(distribution) {
									var jsondis = $.parseJSON( distribution.replace(/bin/g,'"bin"').replace(/val/g,'"val"'));
								},this)
							});
							var list = Eplant.processEAList(res,mainIdentifier,resultCount);
							Eplant.closeEADialog();
							this.showFoundGenes(list,mainIdentifier,URL,resultCount);
						},this)
					});		
				} else {
					var dom = $('<div/>', {
					});
					dom.css({'text-align':'center'});
					var p = $('<div/>', {
						html: '<h4 style="font-weight:bold;font-size:25px">Results</h4> <br> Expression Angler found 0 matches. <br>'
						}).css({
						'max-height': '400px',
						'overflow': 'auto'
					});
					$(dom).append(p);
					Eplant.closeEADialog();
					Eplant.expressionAnglerResultDialog = DialogManager.artDialogDynamic(dom[0],{
						close:Eplant.cancelXhr
					});
				
				}
			},this)
		});
	};

	Eplant.showFoundGenes = function(list,mainIdentifier,URL,resultCount) {
		var dom = $('<div/>', {
		});
		$(dom).attr("id","expressionAnglerDialog");
		dom.css({'text-align':'center','width': '300px'});
		var text = mainIdentifier?'Expression Angler found '+(list.length-1)+' matches with similar expression patterns to '+mainIdentifier
		:'Expression Angler found '+list.length+' matches.';
		var pHead = $('<div/>', {
			html: '<h4 style="font-size:25px">Results</h4><br> '+text+' <br>Select which genes you would like to download:<br>'
			}).css({
			'max-height': '400px',
			'overflow': 'auto'
		});
		$(dom).append(pHead);
		if(list.length>0){
			var selectAllButton = $('<input/>', {
				type: 'button',
				value: "Select all",
				'class':'button'
			});
			selectAllButton.css({'margin-top':'10px',width:'220px'});
			selectAllButton.on('click', function(){
				if($(':checked',dom).length == $(':checkbox',dom).length){
					$(':checkbox',dom).prop('checked',false);
					$(this).val("Select all");
				}
				else{
					$(':checkbox',dom).prop('checked',true);
					$(this).val("Deselect all");
				}
				
				
			});
			$(dom).append(selectAllButton);
			var p = $('<div/>', {
				}).css({
				'max-height': '400px',
				'overflow': 'auto'
			});
			$(dom).append(p);
			
			var table = document.createElement('table');
			$(table).addClass("expressionAnglerGenesTable");
			$(p).append(table);
			$(table).append('<tr><th></th><th>Gene</th><th>R-Value</th></tr>');
			if(parseInt(list[0].rValue,10)>=1)
			{
				$(table).append('<tr><td><input type="checkbox" name="found gene '+0+'" value="'+0+'" style="margin: 0;margin-right: 10px;" checked></td><td>'+list[0].term+'</td><td>'+list[0].rValue+'</td></tr>');
			}
			else{
				$(table).append('<tr><td><input type="checkbox" name="found gene '+0+'" value="'+0+'" style="margin: 0;margin-right: 10px;" ></td><td>'+list[0].term+'</td><td>'+list[0].rValue+'</td></tr>');
			}
			
			for(var i = 1; i<list.length;i++){
				$(table).append('<tr><td><input type="checkbox" name="found gene '+i+'" value="'+i+'" style="margin: 0;margin-right: 10px;" ></td><td>'+list[i].term+'</td><td>'+list[i].rValue+'</td></tr>');
			}
			//p.append('<pre style="font-weight:bold">    Gene      &#9;  r-value<br></pre>');
			/*if(parseInt(list[0].rValue,10)>=1)
				{
				p.append('<pre><input type="checkbox" name="found gene '+0+'" value="'+0+'" style="margin: 0;margin-right: 10px;" checked>'+list[0].term+' &#9;'+list[0].rValue+' &#9;<br></pre>');
				}
				else{
				p.append('<pre><input type="checkbox" name="found gene '+0+'" value="'+0+'" style="margin: 0;margin-right: 10px;" >'+list[0].term+' &#9;'+list[0].rValue+' &#9;<br></pre>');
				}
				
				for(var i = 1; i<list.length;i++){
				p.append('<pre><input type="checkbox" name="found gene '+i+'" value="'+i+'" style="margin: 0;margin-right: 10px;">'+list[i].term+' &#9;'+list[i].rValue+' &#9;<br></pre>');
			}*/
			
			/*var cancelButton = $('<input/>', {
				type: 'button',
				value: "cancel",
				'class':'button greyButton'
				});
				cancelButton.css({'margin-top':'10px'});
				cancelButton.on('click',$.proxy(function(){
				if(this.expressionXhrLink) {
				this.expressionXhrLink.abort();
				this.expressionXhrLink = null;
				
				}
				if(this.expressionXhrService) {
				this.expressionXhrService.abort();
				this.expressionXhrService = null;
				}
				if(Eplant.expressionAnglerResultDialog) Eplant.expressionAnglerResultDialog.close();
			},Eplant));*/
			var moreGeneButton = $('<input/>', {
				type: 'button',
				value: "Get five more genes",
				'class':'button'
			});
			moreGeneButton.css({'margin-top':'10px',width:'220px'});
			moreGeneButton.on('click',$.proxy(function(){
				if(Eplant.expressionAnglerResultDialog) Eplant.expressionAnglerResultDialog.close();
				if(resultCount){
					if(resultCount>0){
						resultCount += 5;
					}
					else{
						resultCount -= 5;
					}
					
					URL = URL.replace(/(match_count=)[^\&]+/, '$1' + resultCount);
				}
				Eplant.ExpressionAngler(URL, this.mainIdentifier, resultCount);
			},{resultCount:resultCount,mainIdentifier:mainIdentifier,EA:this}));
			$(dom).append(moreGeneButton);
			
			var continueButton = $('<input/>', {
				type: 'button',
				value: "Get data for selected genes",
				'class':'greenButton'
			});
			continueButton.css({'margin-top':'10px',width:'220px'});
			continueButton.on('click',$.proxy(function(){
				var selectedList = [];
				$('input[type=checkbox]',p).each($.proxy(function(index,input){
					if(input.checked){
						selectedList.push(this.list[index]);
					}
					
				},this));
				if(selectedList.length===0){
					alert("No genes selected.");
				}
				else{
					$("#displayButtonHolder").show();
					this.EA.loadExpressionAnglerGenes(selectedList,this.mainIdentifier);
					Eplant.closeEADialog();
					
				}
				
			},{list:list,mainIdentifier:mainIdentifier,EA:this}));
			$(dom).append(continueButton);
			
		}
		else{
			
		}
		
		Eplant.expressionAnglerResultDialog = DialogManager.artDialogDynamic(dom[0],{
			close:Eplant.cancelXhr
		});
	};
	
	Eplant.closeEADialog= function() {
		if(Eplant.expressionAnglerLoadingDialog) {
			Eplant.expressionAnglerLoadingDialog.close();
			Eplant.expressionAnglerLoadingDialog = null;
		}
		if(Eplant.expressionAnglerResultDialog) {
			Eplant.expressionAnglerResultDialog.close();
			Eplant.expressionAnglerResultDialog = null;
		}
		
		
	};
	
	Eplant.cancelXhr= function() {
		if(Eplant.expressionXhrLink) {
			Eplant.expressionXhrLink.abort();
			Eplant.expressionXhrLink = null;
		}
		if(Eplant.expressionXhrService) {
			Eplant.expressionXhrService.abort();
			Eplant.expressionXhrService = null;
		}
	};
	
	Eplant.loadNextExpressionAnglerGenes  = function(mainIdentifier, excludeNum, loadNum) {
		
	};
	
	Eplant.loadExpressionAnglerGenes = function(list,mainIdentifier) {
		var numToLoad = list.length;
		if(mainIdentifier){
			var mainGeneticElement=Eplant.activeSpecies.getGeneticElementByIdentifier(mainIdentifier);
		}
		if(mainIdentifier){
			for(var i = 0;i<list.length;i++){
				var term = list[i].term;
				var rValue = list[i].rValue;
				var relationOptions = {
					isRelated:true,
					relatedGene:mainIdentifier,
					isUsingCustomBait:false,
					rValueToRelatedGene:rValue
				};

				Eplant.activeSpecies.loadGeneticElementByIdentifier(term, 
				{
					
					alwaysCallback:	$.proxy(function(geneticElement, identifier) {
						if(--numToLoad<=0)
						{
							Eplant.updateGeneticElementPanel();
							
						}
					},this),
					relationOptions:relationOptions
				});
			}
		}
		else{
			
			for(var i = 0;i<list.length;i++){
				var term = list[i].term;
				var rValue = list[i].rValue;
				var relationOptions = {
					isRelated:true,
					relatedGene:null,
					isUsingCustomBait:true,
					rValueToRelatedGene:rValue
				};
				Eplant.activeSpecies.loadGeneticElementByIdentifier(term, 
				{
					
					alwaysCallback:	$.proxy(function(geneticElement, identifier) {
						if(--numToLoad<=0)
						{
							Eplant.updateGeneticElementPanel();
							
						}
					},this),
					relationOptions:relationOptions
				});
			}
			
		}
	};
	
	
	// generate serach query
	
	Eplant.ExpressionAngler.generateStandardSearchQuery =function(viewName,view,group,excluded) {
		var mapUrl = "app/data/lookUp.json";
		var allTissuesLookUpJson = "app/data/AllTissuesLookUp.json";
		$.getJSON(allTissuesLookUpJson, $.proxy(
		function(allTissuesLookUp) {
			$.getJSON(mapUrl, $.proxy(
			
			function(response) {
				var activeViewLookUp = response[viewName];
				var allTissuesInDb = allTissuesLookUp[activeViewLookUp.database];
				var valid = false;
				var search = "";
				var URL = "//bar.utoronto.ca/ntools/cgi-bin/ntools_expression_angler.cgi?";
				var agiID = "";
				var agiIDOnly = "";
				var customOrId = "";  
				var defaultDB = "&database="+activeViewLookUp.database;
				var lowerRcutoff = "";
				var upperRcutoff = "";
				var match_count = "";
				var matchCountNum = "";
				//var db = "+%5b"+sampleDBs[activeView]+"%5d";
				//var db = "+%5bAtGenExpress_Plus_PID:14671301%5d";
				agiID = "agi_id="+$('#user_agi').val();
				// either set agiID or set custom bait = yes
				
				customOrId = "&use_custom_bait=yes"
				
				
				
				match_count = "&match_count="+5;
				matchCountNum =5;
				
				
				
				
				// start building the search
				search = URL+agiID+customOrId+lowerRcutoff+upperRcutoff+match_count;
				
				
				var appendToEnd = "";
				
				var activeTissues;
				var allTissuesQueries = [];
				
				
				var addToQueries = function(viewName){
					activeViewLookUp = response[viewName];
					var groups= view.groups;
					for (var i=0; i<groups.length; i++){
						
						var samples = groups[i].samples;
						for (var j=0; j<samples.length; j++){
							var sample = activeViewLookUp.sampleMap[samples[j].name];
							var value = samples[j].value;
							// now prepend "&custom_bait=" to value
							
							// if use custom bait mode is on, convert "excluded" values to 1
							
							
							
							// if use custom bait mode is on, convert "excluded" values to 1
							if (group.id !== groups[i].id) {
								if(excluded||typeof value === 'undefined'||value==="excluded"){
									value = "-";
								}
								else{
									value = 1;
								}
								
							}
							else{
								value =100;
							}
							
							var tissueQuery = {
								"tissue":sample,
								"value":value
							};
							allTissuesQueries.push(tissueQuery);
						}
						
					}
					allTissuesQueries= $.grep(allTissuesQueries, function(v, k){
						return $.inArray(v ,allTissuesQueries) === k;
					});
				}
				
				addToQueries(viewName);
				
				
				for (var i=0; i<allTissuesInDb.length; i++){
					var result = $.grep(allTissuesQueries, function(e){ return e.tissue === allTissuesInDb[i]; });
					if (result.length == 0) {
						// not found
						search += "&custom_bait=-";
					} 
					else{
						var validRes = $.grep(result, function(e){ return e.value!=="-"});
						//var tissue = "&expts="+result[0].tissue;//samples[0]+db;
						// if value isn't null, add sample and value to search query
						
						// add each sample name to the search query
						//search += tissue;
						// add value to the search query
						
						/*if(result[0].value!=="-" &&parseInt(result[0].value)>1){
							valid = true;
						}*/
						if(validRes.length>0){
							if(parseInt(validRes[0].value)>1){
								search += "&expts="+result[0].tissue+ "&custom_bait="+validRes[0].value;
								valid = true;
							}
							else{
								search += "&expts="+result[0].tissue+ "&custom_bait="+validRes[0].value;
							}
						}
						else{
							search += "&expts="+result[0].tissue+ "&custom_bait="+result[0].value;
						}
						
						
					// multiple items found
					}
					
				}
				
				
				
				search +=appendToEnd+defaultDB;
				// postSearchQuery(search);
				if(valid){
					Eplant.ExpressionAngler(search,agiIDOnly,matchCountNum);
				}
				else{
					var errorInfo='The tissue pattern selected cannot be found using Expression Angler.';
					var dialog = window.top.art.dialog({
						content: errorInfo,
						width: 600,
						minHeight: 0,
						resizable: false,
						draggable: false,
						lock: true
					});
				}
			},this));
		},this));
	}
})();
