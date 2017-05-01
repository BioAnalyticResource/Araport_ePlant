(function() {
	
	/**
		* Eplant.Views.WorldView class
		* Coded by Hans Yu
		* UI designed by Jamie Waese
		*
		* ePlant View for browsing gene expression data of plant tissues during development as eFP.
		*
		* @constructor
		* @augments Eplant.BaseViews.EFPViewJson
		* @param {Eplant.GeneticElement} geneticElement The GeneticElement associated with this view.
	*/
	if(typeof(google)!="undefined"){
		Eplant.Views.WorldView = function(geneticElement) {
			// Get constructor
			var constructor = Eplant.Views.WorldView;
			
			// Call parent constructor
			Eplant.View.call(this,
			constructor.displayName,				// Name of the View visible to the user
			constructor.viewName,
			constructor.hierarchy,			// Hierarchy of the View
			constructor.magnification,			// Magnification level of the View
			constructor.description,			// Description of the View visible to the user
			constructor.citation,			// Citation template of the View
			constructor.activeIconImageURL,		// URL for the active icon image
			constructor.availableIconImageURL,		// URL for the available icon image
			constructor.unavailableIconImageURL	// URL for the unavailable icon image
			);
			
			this.domContainer =Eplant.Views.WorldView.domContainer;
			
			// Call eFP constructor
			var efpURL = 'app/data/world/' + geneticElement.species.scientificName.replace(' ', '_') + '.json';
			Eplant.BaseViews.EFPViewJson.call(this, geneticElement, efpURL, {
			});
			
			/* Attributes */
			this.zooming=false;
			this.markerIcon = null;		// Marker icon definition
			this.viewGlobalConfigs = {
				isMaskOn:false, // Whether masking is on
				maskThreshold:1, // Masking threshold
				compareEFPView : null, // EFP view for comparing to
				maskColor :  "#B4B4B4", // Mask color
				errorColor : "#FFFFFF", // Error color
				mode : "absolute", // EFP mode
				left: 0,
				top:0,
				width:'auto',
				height:'auto',
				zoom:2,
				center: new google.maps.LatLng(25, 0)
				
			};
			
		};
		ZUI.Util.inheritClass(Eplant.BaseViews.EFPViewJson, Eplant.Views.WorldView);	// Inherit parent prototype
		
		/* Define ePlant View properties */
		Eplant.Views.WorldView.viewName = "WorldView";
		Eplant.Views.WorldView.displayName = "World eFP";		// Name of the View visible to the user
		Eplant.Views.WorldView.hierarchy = "genetic element";	// Hierarchy of the View
		Eplant.Views.WorldView.magnification = 10;			// Magnification level of the View
		Eplant.Views.WorldView.description = "World eFP viewer";	// Description of the View visible to the user
		Eplant.Views.WorldView.citaiton = "";			// Citation template of the View
		Eplant.Views.WorldView.activeIconImageURL = "app/img/active/world.png";		// URL for the active icon image
		Eplant.Views.WorldView.availableIconImageURL = "app/img/available/world.png";		// URL for the available icon image
		Eplant.Views.WorldView.unavailableIconImageURL = "app/img/unavailable/world.png";	// URL for the unavailable icon image
		Eplant.Views.WorldView.viewType = "zui";
		/* Static constants */
		Eplant.Views.WorldView.map = null;			// GoogleMaps object
		Eplant.Views.WorldView.domContainer = null;	// DOM container for GoogleMaps
		
		
		Eplant.Views.WorldView.initialize = function() {
			/* Get GoogleMaps DOM container */
			//Eplant.Views.WorldView.domContainer = document.getElementById("map_container");
			Eplant.Views.WorldView.domContainer = document.getElementById("World_container");
			/*$(Eplant.Views.WorldView.domContainer).css({
				width:'100%',
				height:'100%',
				position:'absolute',
				left:0,
				top:0,
				opacity:0.99
			});*/
			$(Eplant.Views.WorldView.domContainer).css({"visibility": "hidden"});
			//$(Eplant.Views.WorldView.domContainer).insertBefore(ZUI.canvas);
			/* Create GoogleMaps object */
			
			var mapTypeIds = ['roadmap', 'satellite', 'hybrid', 'terrain', 'OSM'];
			
			Eplant.Views.WorldView.map = new google.maps.Map(Eplant.Views.WorldView.domContainer, {
				center: new google.maps.LatLng(25, 0),
				zoom: 2,
				streetViewControl: false,
				
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				//mode: 'html4',
				mapTypeControlOptions: {
				// Remove map options
				mapTypeIds: []
				},
				zoomControl: false
			});
			
			// Store map as local variable
			var map = Eplant.Views.WorldView.map;
			
			google.maps.event.addListener(map, 'zoom_changed', function() {
				Eplant.Views.WorldView.map.zooming = false;
			});
			
			// Get map control div to reposition upon loading
			google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
				// Check default map view checkbox
				$('#mapDropdownCheckMap').show();
				// Add divider
				var rule = document.createElement('HR');
				$(rule).attr('class', 'mapControlDropdownItem');
				var satelliteButton = $('#mapDropdownCheckSatellite').parents().eq(3);
				$(rule).insertAfter(satelliteButton);
				$(rule).hide();
			});
			
			// Get tile source
			var tileSrc = 'https://bar.utoronto.ca/eplant/src/Eplant.Views/WorldView/Tiles/';
			// Create annual precipitation layer
			var precipLayer = Eplant.Views.WorldView.createOverlay(
			tileSrc + 'AnnualPrecip/Annual_Precipitation');
			var precipOverlay = new google.maps.ImageMapType(precipLayer);
			// Create historical max temperature layer
			var minLayer = Eplant.Views.WorldView.createOverlay(
			tileSrc + 'HistMin/Historical_Min_Temp_of_coldest_Month');
			var minOverlay = new google.maps.ImageMapType(minLayer);
			// Create historical min temperature layer
			var maxLayer = Eplant.Views.WorldView.createOverlay(
			tileSrc + 'HistMax/Historical_Max_temp_of_warmest_month');
			var maxOverlay = new google.maps.ImageMapType(maxLayer);
			
			// Create climate overlay dropdown button
			var dropdownDOM = Eplant.Views.WorldView.createDropdown();
			
			// Create legend
			Eplant.Views.WorldView.createOverlayLegend();
			Eplant.Views.WorldView.createOverlayStatus();
			
			// Create custom map control buttons
			Eplant.Views.WorldView.createDropdownButton('Map', null, dropdownDOM, 'Map', 'top');
			Eplant.Views.WorldView.createDropdownButton('Satellite', null, dropdownDOM,
			'Satellite', 'bottom');
			Eplant.Views.WorldView.createDropdownButton('Annual Precipitation',
			precipOverlay, dropdownDOM, 'Precip', 'top');
			Eplant.Views.WorldView.createDropdownButton('Historical Max Temp.',
			maxOverlay, dropdownDOM, 'Max');
			Eplant.Views.WorldView.createDropdownButton('Historical Min Temp.',
			minOverlay, dropdownDOM, 'Min', 'bottom');
		};
		
		/**
			* Returns appropriate images tiles when given coordiantes and a zoom level.
			* Normalizes the coordinates to standard Google Maps API coords.
			*
			* @param {String} imgLoc The location where the image tiles are located
			* @param {Object} coord Contains the x and y coordinates of the map
			* @param {Number} zoom The zoom level of the map
			*
			* @returns {void}
		*/
		Eplant.Views.WorldView.getTile = function (imgLoc, coord, zoom) {
			// Check zoom level for max zoom level (8)
			if (zoom > 8) {
				return null;
			}
			
			// Normalizes coordinates. Taken from Google Maps API demo
			var y = coord.y;
			var x = coord.x;
			
			// tile range in one direction range is dependent on zoom level
			// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
			// Bitwise shift operation equivalent to 2^zoom
			var tileRange = 1 << zoom;
			
			// don't repeat across y-axis (vertically)
			if (y < 0 || y >= tileRange) {
				return null;
			}
			// repeat across x axis
			if (x < 0 || x >= tileRange) {
				x = (x % tileRange + tileRange) % tileRange;
			}
			
			return imgLoc + '&zoom=' + zoom + '&x=' + x + '&y=' + y + '.png';
		};
		
		/**
			* Creates a google maps image overlay
			*
			* @param {String} imgLoc The location of the map overlay image tiles
			* @return {Object} Returns a google maps overlay
		*/
		Eplant.Views.WorldView.createOverlay = function (imgLoc) {
			// Function for normalizing coordinates
			var getTile = Eplant.Views.WorldView.getTile;
			// Preset image location
			var getTileLoc = getTile.bind(this, imgLoc);
			// Create overlay settings
			var overlay = {
				getTileUrl: function(coord, zoom) {
					return getTileLoc(coord, zoom);
				},
				tileSize: new google.maps.Size(256, 256),
				isPng: true,
				opacity: 0.7
			};
			return overlay;
		};
		
		/**
			* Create the dropdown containing the options used to activate overlays.
			* The button is added as part of the google maps control API.
			*
			* @return {void}
		*/
		Eplant.Views.WorldView.createDropdown = function () {
			// Set CSS for the button
			var controlUI = document.createElement('div');
			controlUI.style.backgroundColor = '#fff';
			controlUI.style.border = '2px solid #fff';
			controlUI.style.borderRadius = '3px';
			controlUI.style.textAlign = 'center';
			controlUI.style.width = '130px';
			controlUI.style.marginTop = '50px';
			controlUI.style.boxShadow = 'rgba(0, 0, 0, 0.298039) 0px 1px 4px -1px';
			controlUI.title = 'Hover to view climate overlays';
			
			// Set CSS for the control interior.
			var controlText = document.createElement('label');
			controlText.style.color = 'rgb(25,25,25)';
			controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
			controlText.style.fontSize = '11px';
			controlText.style.lineHeight = '33px';
			controlText.style.marginLeft = '5px';
			controlText.innerHTML = 'Climate overlays';
			controlText.style.verticalAlign = 'middle';
			controlUI.appendChild(controlText);
			
			
			// Create wrapper div
			var controlDiv = document.createElement('div');
			controlDiv.style.zIndex = '1';
			$(controlDiv).attr('id', 'climateDropdown');
			
			var timer = null;
			// Setup the mouse enter event to show dropdown menu
			controlDiv.addEventListener('mouseenter', function() {
				// Check if an existing closedown timer exists
				if (timer) {
					// Reset timer
					clearTimeout(timer);
				}
				// Search for dropdown items
				var dropdowns = $('.mapControlDropdownItem');
				// Show all items
				for (var n = 0; n < dropdowns.length; n = n + 1) {
					$(dropdowns[n]).show();
				}
				
			});
			// Setup the mouse leave event to hide dropdown menu
			controlDiv.addEventListener('mouseleave', function() {
				// Closedown timer
				timer = setTimeout(function () {
					// Search for dropdown items
					var dropdowns = $('.mapControlDropdownItem');
					// Hide all items
					for (var n = 0; n < dropdowns.length; n = n + 1) {
						$(dropdowns[n]).hide();
					}
				}, 750);
			});
			
			controlDiv.appendChild(controlUI);
			
			// Append control div to google maps
			var map = Eplant.Views.WorldView.map;
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv);
			
			return controlDiv;
		};
		
		/**
			* Create a HTML button for use in the climate overlay dropdown.
			*
			* @param {String} name The name to be used as the label for this button
			* @param {Object} overlay The overlay which is triggered by this button
			* @param {HTMLElement} parent The parent div which the button is to be appended to
			* @param {String} id The overlay name to be used as part of ids
			* @param {String} orientation The orientation of the buttons border radius'
			*
			* @returns {void}
		*/
		Eplant.Views.WorldView.createDropdownButton = function (name, overlay, parent, id,
		orientation) {
			// Create dropdown box
			var buttonDOM = Eplant.Views.WorldView.createDropdownButtonDOM(name, orientation);
			// Create checkbox
			var checkBox = Eplant.Views.WorldView.createCheckbox(overlay, id);
		  	$(buttonDOM).prepend(checkBox);
			
			// Setup the click event to toggle layout and checkbox
			buttonDOM.addEventListener('click', function() {
				if (overlay === null) {
					Eplant.Views.WorldView.mapDropdownEventHandler(checkBox);
					} else {
					Eplant.Views.WorldView.overlayDropdownEventHandler(checkBox, id, overlay);
				}
			});
			
			// Create wrapper div for future class selection
			var controlDiv = document.createElement('div');
			controlDiv.className = 'mapControlDropdownItem';
			$(controlDiv).hide();
			controlDiv.appendChild(buttonDOM);
			// Append to dropdown wrapper div
			parent.appendChild(controlDiv);
		};
		
		/**
			* Creates the HTML elements for a dropdown button.
			* @param {String} name The name of the button and associated layout
			* @param {String} orientation The area to place the border radiuses
			* @return {HTMLElement} Returns a HTML element dropdown button
		*/
		Eplant.Views.WorldView.createDropdownButtonDOM = function (name, orientation) {
			// Create the dropdown button outer element
			var buttonOuter = document.createElement('div');
			$(buttonOuter).css({
				'background-color': '#fff',
				'border': '2px solid #fff',
				'line-height': '33px',
				'text-align': 'left',
				'title': 'Click to toggle ' + name + ' overlay',
				'top': '86px',
				'width': '140px'
			});
			
			if (orientation === 'top') {
				buttonOuter.style.borderTopRightRadius = '3px';
				buttonOuter.style.borderTopLeftRadius = '3px';
				} else if (orientation === 'bottom') {
				buttonOuter.style.borderBottomLeftRadius = '3px';
				buttonOuter.style.borderBottomRightRadius = '3px';
			}
			
			// Create the text for the dropdown button
			var buttonText = document.createElement('label');
			buttonText.innerHTML = name;
			$(buttonText).css({
				'color': 'rgb(25,25,25)',
				'font-family': 'Roboto,Arial,sans-serif',
				'font-size': '11px',
				'line-height': '33px',
				'margin-left': '5px',
				'vertical-align': 'middle'
			});
			
			buttonOuter.appendChild(buttonText);
			return buttonOuter;
		};
		
		/**
			* Wrapper function for creating a checkbox depending on the type of overlay associated.
			*
			* @param {String} overlay The type of overlay or null to determine between map and overlay
			* @param {String} legendId The id of the legend used to create the checkbox id
			* @return {void}
		*/
		Eplant.Views.WorldView.createCheckbox = function (overlay, legendId) {
			var checkBoxId = null;
			var checkBoxClass = null;
			if (overlay === null) {
				checkBoxId = 'mapDropdownCheck' + legendId;
				checkBoxClass = 'mapDropdownCheck';
				} else {
				checkBoxId = 'overlayDropdownCheck' + legendId.substring(13);
				checkBoxClass = 'overlayDropdownCheck';
			}
			
			var checkBox = Eplant.Views.WorldView.createCheckboxDOM(checkBoxClass, checkBoxId);
			return checkBox;
		};
		
		/**
			* Creates the HTML Elements associated with a checkbox. Style matches the Google maps
			* checkbox.
			*
			* @param {String} className The class of the checkbox
			* @param {String} id The id of the checkbox
			* @returns {HTMLElement} Returns an HTML container of the checkbox
		*/
		Eplant.Views.WorldView.createCheckboxDOM = function (className, id) {
			// Creates box
			var checkbox = document.createElement('span');
			$(checkbox).attr('role', 'checkbox');
			$(checkbox).css({
				'background-color': 'rgb(255, 255, 255)',
				'border': '1px solid rgb(198, 198, 198)',
				'border-radius': '1px',
				'box-sizing': 'border-box',
				'display': 'inline-block',
				'height': '13px',
				'margin-left': '5px',
				'position': 'relative',
				'vertical-align': 'middle',
				'width': '13px'
			});
			// Creates wrapping container for check
			var checkContainer = document.createElement('div');
			$(checkContainer).css({
				'height': '11px',
				'left': '1px',
				'overflow': 'hidden',
				'position': 'absolute',
				'top': '-2px',
				'width': '13px'
			});
			// Creates check symbol
			var checkImg = document.createElement('img');
			$(checkImg).attr('src', 'https://maps.gstatic.com/mapfiles/mv/imgs8.png');
			$(checkImg).attr('draggable', false);
			$(checkImg).css({
				'-webkit-user-select': 'none',
				'border': '0px',
				'display': 'none',
				'height': '74px',
				'left': '-52px',
				'margin': '0px',
				'max-width': 'none',
				'padding': '0px',
				'position': 'absolute',
				'top': '-49px',
				'width': '68px'
			});
			// Assign selectors for use in toggling
			$(checkImg).attr('id', id);
			$(checkImg).attr('class', className);
			
			checkContainer.appendChild(checkImg);
			checkbox.appendChild(checkContainer);
			
			return checkbox;
		};
		
		/**
			* Handles events which are triggered by clicking on a dropdown overlay button.
			* Deactivates any existant overlays, shows selected overlay, and shows legend.
			*
			* @param {HTMLElement} checkBox The associated checkbox
			* @param {String} id The id of the associated items
			* @param {Object} overlay The associated google maps overlay
			* @return {void}
		*/
		Eplant.Views.WorldView.overlayDropdownEventHandler = function (checkBox, id, overlay) {
			// Set map
			var map = Eplant.Views.WorldView.map;
			// Get check associated with this button
			var check = $(checkBox).children().children();
			// Get all checkboxes
			var checks = $('.overlayDropdownCheck');
			
			// Check if any checkboxes are active
			var overlayActive = false;
			for (var n = 0; n < checks.length; n = n + 1) {
				if ($(checks[n]).is(':visible')) {
					overlayActive = true;
				}
			}
			// Get legend image
			var legendImg = $('#overlayLegend' + id);
			var statusDOM = $('#activeStatus' + id);
			// Disable overlay if previously active checkbox is selected
			if ($(check).is(':visible')) {
				$(check).hide();
				overlayActive = false;
				map.overlayMapTypes.clear();
				$(legendImg).hide();
				$(statusDOM).hide();
				$('#activeStatus').hide();
				// Handle if overlay other than current one is already checked
				} else if (overlayActive) {
				// Reset overlay
				map.overlayMapTypes.clear();
				// Get all legends
				var legends = $('.mapOverlayLegend');
				// Get all statuses
				var statuses = $('.overlayStatus');
				// Reset all elements
				for (var k = 0; k < checks.length; k = k + 1) {
					$(checks[k]).hide();
					// Hide legends
					$(legends[k]).hide();
					$(statuses[k]).hide();
				}
				$(check).show();
				map.overlayMapTypes.insertAt(0, overlay);
				$(legendImg).show();
				$(statusDOM).show();
				// Handle if no checkboxes are active
				} else {
				map.overlayMapTypes.clear();
				$(check).show();
				map.overlayMapTypes.insertAt(0, overlay);
				$(legendImg).show();
				$(statusDOM).show();
				$('#activeStatus').show();
			}
		};
		
		/**
			* Handles events which are triggered by clicking on a dropdown map button.
			* Switches the active map to the selected one.
			*
			* @param {HTMLElement} checkBox The associated checkbox
			* @return {void}
		*/
		Eplant.Views.WorldView.mapDropdownEventHandler = function (checkBox) {
			// Get check associated with this button
			var check = $(checkBox).children().children();
			
			// Handle if selected view is not active
			if (check[0].style.display === 'none') {
				// Change to selected view
				if (check[0].id === 'mapDropdownCheckSatellite') {
					// Change to Satellite
					Eplant.Views.WorldView.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
					} else {
					// Change to Map
					Eplant.Views.WorldView.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				}
				
				var checks = $('.mapDropdownCheck');
				for (var n = 0; n < checks.length; n = n + 1) {
					// Reset all checks
					$(checks[n]).hide();
					$(check).show();
				}
			}
		};
		
		/**
			* Creates the status bar which shows which overlay is active
			* @return {void}
		*/
		Eplant.Views.WorldView.createOverlayStatus = function () {
			var container = document.createElement('div');
			
			var topLabel = document.createElement('label');
			topLabel.id = 'activeStatus';
			$(topLabel).css({
				'color': '#000',
				'display': 'none',
				'font-size': '12px',
				'left': '10px',
				'position': 'absolute',
				'top': '57px',
				'width': '100px'
			});
			topLabel.innerHTML = 'Active Overlay:';
			container.appendChild(topLabel);
			
			var precipLabel = document.createElement('label');
			precipLabel.id = 'activeStatusPrecip';
			precipLabel.className = 'overlayStatus';
			$(precipLabel).css({
				'color': '#000',
				'display': 'none',
				'font-size': '12px',
				'left': '100px',
				'position': 'absolute',
				'top': '57px',
				'width': '200px'
			})
			precipLabel.innerHTML = 'Annual Precipitation';
			container.appendChild(precipLabel);
			
			var maxLabel = document.createElement('label');
			maxLabel.id = 'activeStatusMax';
			maxLabel.className = 'overlayStatus';
			$(maxLabel).css({
				'color': '#000',
				'display': 'none',
				'font-size': '12px',
				'left': '100px',
				'position': 'absolute',
				'top': '57px',
				'width': '200px'
			});
			maxLabel.innerHTML = 'Max. Temp. of Warmest Month';
			container.appendChild(maxLabel);
			
			var minLabel = document.createElement('label');
			minLabel.id = 'activeStatusMin';
			minLabel.className = 'overlayStatus';
			$(minLabel).css({
				'color': '#000',
				'display': 'none',
				'font-size': '12px',
				'left': '100px',
				'position': 'absolute',
				'top': '57px',
				'width': '200px'
			});
			minLabel.innerHTML = 'Min. Temp. of Coldest Month';
			container.appendChild(minLabel);
			
			var map = Eplant.Views.WorldView.map;
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(container);
		}
		
		
		/**
			* Create a HTML DOM container in which legends for overlays will be contained.
			*
			* @return {HTMLElement} Returns the HTML image of the legend
		*/
		Eplant.Views.WorldView.createOverlayLegend = function () {
			// Create div to contain legends
			var imgDiv = document.createElement('div');
			// Set id for use in visibility toggle
			imgDiv.id = 'overlayLegendContainer';
			// Set css styles
			imgDiv.style.zIndex = '0';
			imgDiv.style.marginTop = '20%';
			// Store world view for simplicity
			var worldView = Eplant.Views.WorldView;
			// Image source location
			var src = 'app/img/';
			// Create legend DOM elements
			var precip = worldView.createLegendDOM(['Annual', 'Precipitation'],
			src + 'climateLegend.png', 'overlayLegendPrecip', '10577 mm', '13 mm');
			imgDiv.appendChild(precip);
			var max = worldView.createLegendDOM(['Maximum', 'Temperature'],
			src + 'climateLegendFlip.png', 'overlayLegendMax', '31.9 \xB0C', '-27.8 \xB0C');
			imgDiv.appendChild(max);
			var min = worldView.createLegendDOM(['Minimum', 'Temperature'],
			src + 'climateLegendFlip.png', 'overlayLegendMin', '31.9 \xB0C', '-27.8 \xB0C');
			imgDiv.appendChild(min);
			// Push container div onto google maps
			worldView.map.controls[google.maps.ControlPosition.LEFT_CENTER].push(imgDiv);
			
			return imgDiv;
		};
		
		/**
			* Creates the HTML elements which represent the overlay legend
			* @param  {Array} title The title of legend, which goes over the scale
			* @param  {String} src   The source of the legend scale image
			* @param  {String} id    The HTML id of the new legend
			* @param  {String} max   The maximum measurement on the scale
			* @param  {String} min   The minimum measurement on the scale
			* @return {HTMLElement} Returns the legend HTML element
		*/
		Eplant.Views.WorldView.createLegendDOM = function (title, src, id, max, min) {
			// Create wrapper container
			var container = document.createElement('div');
			container.id = id;
			container.className = 'mapOverlayLegend';
			$(container).hide();
			
			// Create top label
			var topLabel = document.createElement('label');
			$(topLabel).css({
				'color': '#000',
				'font-size': '12px',
				'left': '17px',
				'position': 'absolute',
				'top': '-175px',
				'width': '200px'
			})
			topLabel.innerHTML = title[0];
			
			container.appendChild(topLabel);
			
			// Create bottom label
			var bottomLabel = document.createElement('label');
			$(bottomLabel).css({
				'color': '#000',
				'font-size': '12px',
				'left': '17px',
				'position': 'absolute',
				'top': '-160px',
				'width': '200px'
			})
			bottomLabel.innerHTML = title[1];
			
			container.appendChild(bottomLabel);
			
			// Create legend scale image
			var legImg = document.createElement('img');
			legImg.src = src;
			// Set CSS Rules
			$(legImg).css({
				'left': '20px',
				'height': '180px',
				'position': 'absolute',
				'top': '-140px',
				'width': '16px'
			});
			container.appendChild(legImg);
			
			// Create max measurement lavel
			var maxUnit = document.createElement('label');
			$(maxUnit).css({
				'color': '#000',
				'font-size': '10px',
				'left': '40px',
				'position': 'absolute',
				'top': '-143px',
				'width': '100px'
			});
			maxUnit.innerHTML = max;
			container.appendChild(maxUnit);
			// Create minimum measurement label
			var minUnit = document.createElement('label');
			$(minUnit).css({
				'color': '#000',
				'font-size': '10px',
				'left': '40px',
				'position': 'absolute',
				'top': '24px',
				'width': '100px'
			});
			minUnit.innerHTML = min;
			container.appendChild(minUnit);
			
			return container;
		};
		
		Eplant.Views.WorldView.prototype.downloadRawData = function() {
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
				downloadString+=this.name+": "+this.geneticElement.identifier+"\n";
				downloadString+="URL: "+Eplant.urlForCurrentState()+"\n";
				downloadString+="JSON data: \n";
				downloadString+=this.rawSampleData;
				var blob = new Blob([downloadString], {type: "text/plain;charset=utf-8"});
				saveAs(blob, this.name+"-"+this.geneticElement.identifier+".txt");
			}
		};
		
		/**
			* Active callback method.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.active = function() {
			/* Call parent method */
			Eplant.BaseViews.EFPViewJson.prototype.active.call(this);
			
			$('#getImageIcon').hide();
			/* Show map */
			$(Eplant.Views.WorldView.domContainer).css({"visibility": "visible"});
			//$(Eplant.Views.WorldView.domContainer).insertBefore(ZUI.canvas);
			
			//hacky, resize to fix the issue
			//google.maps.event.trigger(Eplant.Views.WorldView.map, 'resize');
			/* Reset map zoom and position 
				
				if(Eplant.globalViewConfigs[this.name].center){
				Eplant.Views.WorldView.map.setCenter(new google.maps.LatLng(
				Eplant.globalViewConfigs[this.name].center.k,
				Eplant.globalViewConfigs[this.name].center.D));
				}
				else{
				Eplant.Views.WorldView.map.setCenter(new google.maps.LatLng(25,0));
				}
				if(Eplant.globalViewConfigs[this.name].zoom){
				Eplant.Views.WorldView.map.setZoom(Eplant.globalViewConfigs[this.name].zoom);
				}
				else{
				Eplant.Views.WorldView.map.setZoom(2);
			}*/
			
			/* Insert markers */
			for (var n = 0; n < this.groups.length; n++) {
				var group = this.groups[n];
				group.marker.setMap(Eplant.Views.WorldView.map);
			}
			$(Eplant.Views.WorldView.domContainer).append(this.labelDom);
			
		};
		
		Eplant.Views.WorldView.prototype.afterActive = function() {
			Eplant.View.prototype.afterActive.call(this);
			
			/*Eplant.Views.WorldView.map.setCenter(new google.maps.LatLng(25, 0));
				
			Eplant.Views.WorldView.map.setZoom(2);*/
			
			
		};
		
		/**
			* Inactive callback method.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.inactive = function() {
			/* Call parent method */
			Eplant.BaseViews.EFPViewJson.prototype.inactive.call(this);
			
			$('#getImageIcon').show();
			/* Hide map */
			$(Eplant.Views.WorldView.domContainer).css({"visibility": "hidden"});
			//$(Eplant.Views.WorldView.domContainer).detach();
			/* Remove markers */
			for (var n = 0; n < this.groups.length; n++) {
				var group = this.groups[n];
				group.marker.setMap(null);
			}
			
		};
		
		/**
			* Default applyGlobalConfigs callback method.
			*
			* @override
		*/
		
		/*Eplant.Views.WorldView.prototype.applyGlobalConfigs = function() {
			Eplant.View.prototype.applyGlobalConfigs.call(this);
			if(Eplant.globalViewConfigs[this.name].center){
			Eplant.Views.WorldView.map.setCenter(new google.maps.LatLng(
			Eplant.globalViewConfigs[this.name].center.k,
			Eplant.globalViewConfigs[this.name].center.D));
			}
			if(Eplant.globalViewConfigs[this.name].zoom){
			var zoom = Eplant.globalViewConfigs[this.name].zoom;
			Eplant.Views.WorldView.map.setZoom(zoom);
			}
		};*/
		
		/**
			* Default saveGlobalConfigs callback method.
			*
			* @override
		*/
		
		/*Eplant.Views.WorldView.prototype.saveGlobalConfigs = function() {
			Eplant.View.prototype.saveGlobalConfigs.call(this);
			var center = Eplant.Views.WorldView.map.getCenter();
			Eplant.globalViewConfigs[this.name].center = center;
			var zoom = Eplant.Views.WorldView.map.getZoom();
			Eplant.globalViewConfigs[this.name].zoom = zoom===0?0.01:zoom;
			
		};*/
		
		/**
			* Draw callback method.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.draw = function() {
			/* Call parent method */
			Eplant.View.prototype.draw.call(this);
			
			/* Draw tags */
			for (var n = 0; n < this.tagVOs.length; n++) {
				var tagVO = this.tagVOs[n];
				tagVO.draw();
			}
		};
		
		/**
			* Clean up view.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.remove = function() {
			/* Call parent method */
			Eplant.View.prototype.remove.call(this);
			
			/* Remove ViewObjects */
			for (var n = 0; n < this.tagVOs.length; n++) {
				var tagVO = this.tagVOs[n];
				tagVO.remove();
			}
			
			/* Remove legend */
			this.legend.remove();
			
			/* Remove EventListeners */
			ZUI.removeEventListener(this.updateAnnotationTagsEventListener);
		};
		
		/**
			* MouseMove callback method.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.mouseMove = function() {
		};
		
		/**
			* MouseWheel callback method.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.mouseWheel = function() {
		};
		
		Eplant.Views.WorldView.prototype.getTooltipContent = function(group) {
			var tooltipContent = "";
			if (this.mode == "absolute") {
				tooltipContent = group.id + 
				"<br>Mean: " + (+parseFloat(group.mean).toFixed(2)) + 
				"<br>Standard error: " + (+parseFloat(group.stdev).toFixed(2)) + 
				"<br>Sample size: " + group.n;
			}
			else if (this.mode == "relative") {
				tooltipContent = group.id + 
				"<br>Log2 value: " + (+parseFloat(ZUI.Math.log(group.mean / group.ctrlMean, 2)).toFixed(2)) + 
				"<br>Fold difference: " + (+parseFloat(group.mean / group.ctrlMean).toFixed(2));
			}
			else if (this.mode == "compare") {
				var index = this.groups.indexOf(group);
				var compareGroup = this.compareEFPView.groups[index];
				tooltipContent = group.id + 
				"<br>Log2 value: " + (+parseFloat(ZUI.Math.log(group.mean / compareGroup.group.mean, 2)).toFixed(2)) + 
				"<br>Fold difference: " + (+parseFloat(group.mean / compareGroup.group.mean).toFixed(2));
			}
			return tooltipContent;
		};
		
		/**
			* Loads eFP definition and data.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.loadData = function() {
			
			var mouse = {x: 0, y: 0};
			
			document.addEventListener('mousemove', function(e){ 
				mouse.x = e.clientX || e.pageX; 
				mouse.y = e.clientY || e.pageY 
			}, false);
			
			/* Get eFP definition */
			$.getJSON(this.efpURL, $.proxy(function(response) {
				/* Get web service URL */
				this.webService = response.webService;

				/* Override for Araport */
				this.webService = Eplant.ServiceUrl + 'worldefp.cgi';
				
				/* Get marker shape */
				this.markerIcon = response.marker;
				
				/* Prepare array for samples loading */
				var samples = [];
				
				/* Create groups */
				this.groups = [];
				for (var n = 0; n < response.groups.length; n++) {
					/* Get group data */
					var groupData = response.groups[n];
					Eplant.queue.add(function(){
						/* Create group object */
						var group = {
							id: this.groupData.id,
							samples: [],
							ctrlSamples: [],
							source: this.groupData.source,
							color: Eplant.Color.White,
							isHighlight: false,
							position: {
								lat: this.groupData.position.lat,
								lng: this.groupData.position.lng
							},
							tooltip: null
						};
						
						/* Prepare wrapper object for proxy */
						var wrapper = {
							group: group,
							eFPView: this.view
						};
						
						/* Create marker */
						group.marker = new google.maps.Marker({
							position: new google.maps.LatLng(group.position.lat, group.position.lng),
							icon: this.view.getMarkerIcon(group.color)
						});
						group.marker.data = group;
						
						/* Bind mouseover event for marker */
						google.maps.event.addListener(group.marker, "mouseover", $.proxy(function(event) {
							
							var tooltipContent=this.eFPView.getTooltipContent(group);
							group.tooltip = new Eplant.Tooltip({
								content: tooltipContent,
								x:mouse.x,
								y:mouse.y+20
							});
							
						}, wrapper));
						
						google.maps.event.addListener(group.marker, "mousemove", $.proxy(function(event) {
							if (group.tooltip) {
								group.tooltip.changeTooltipPosition(						
								{clientX:mouse.x,
								clientY:mouse.y+20});
							}
							
							
						}, wrapper));
						
						/* Bind mouseout event for marker */
						google.maps.event.addListener(group.marker, "mouseout", $.proxy(function() {
							if (group.tooltip) {
								group.tooltip.close();
								group.tooltip = null;
							}
						}, wrapper));
						
						
						google.maps.event.addListener(group.marker, "click", $.proxy(function( event ) {
							var tooltipContent=this.eFPView.getTooltipContent(group);
							var div = document.createElement("div");
							var info = document.createElement("div");
							$(info).html(tooltipContent);
							$(div).append(info);
							
							var EAViewName = Eplant.expressionAnglerViewNameMap[this.eFPView.viewName];
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
								if(this.eFPView.linkDialog)this.eFPView.linkDialog.close();
								Eplant.ExpressionAngler.generateStandardSearchQuery(EAViewName,this.eFPView,group,100);
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
									if(this.eFPView.linkDialog)this.eFPView.linkDialog.close();
									Eplant.ExpressionAngler.generateStandardSearchQuery(EAViewName,this.eFPView,group);
								},this));
							}
							if(group.link)
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
									window.open(group.link, '_blank');
								},this));
							}
							if(Eplant.citations[Eplant.activeSpecies.scientificName][this.eFPView.name]){
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
								},this.eFPView));
							}
							if(this.eFPView.rawSampleData){
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
									
								},this.eFPView));
							}
							
							
							if(group.ePlantLink && this.eFPView.geneticElement.views[group.ePlantLink])
							{		
								$(div).append(document.createElement("br"));
								var a2 = $('<a></a>',{
									text: 'Zoom to '+group.ePlantLink+' viewer',
									'class': ''
									}).appendTo(div).css({
									'font-size': '13px',
									'margin-top': '5px',
									color:'#99cc00'
								});
								$(a2).click($.proxy(function() {
									Eplant.changeActiveView(this.eFPView.geneticElement.views[group.ePlantLink]);
									if(this.eFPView.linkDialog)this.eFPView.linkDialog.close();
								},this));
							}
							
							this.eFPView.linkDialog = DialogManager.artDialogDynamic(div);
							
							
						},wrapper));
						
						/* Prepare samples */
						for (var m = 0; m < this.groupData.samples.length; m++) {
							var sample = {
								name: this.groupData.samples[m],
								value: null
							};
							samples.push(sample);
							group.samples.push(sample);
						}
						
						/* Asher: The new style of control */
						if (this.groupData.ctrlSamples !== undefined) {
							for (var m = 0; m < this.groupData.ctrlSamples.length; m++) {
								var sample = {
									name: this.groupData.ctrlSamples[m],
									value: null
								};
								
								/* Add to the sample array */
								samples.push(sample);
								group.ctrlSamples.push(sample);
							}
						}
						
						/* Append group to array */
						this.view.groups.push(group);
					},{view:this,groupData:groupData},null,this.geneticElement.identifier+"_Loading");
				}
				
				Eplant.queue.add(function(){
					/* Insert markers to map if this view is active */
					if (ZUI.activeView == this) {
						for (var n = 0; n < this.groups.length; n++) {
							var group = this.groups[n];
							group.marker.setMap(Eplant.Views.WorldView.map);
							
						}
					}
					
					/* Get sample values */
					/* Get sample names */
					var sampleNames = [];
					for (var n = 0; n < samples.length; n++) {
						sampleNames.push(samples[n].name);
					}
					/* Prepare wrapper for proxy */
					var wrapper = {
						samples: samples,
						eFPView: this
					};
					/* Query */
					$.ajax({
						beforeSend: function(request) {
							request.setRequestHeader('Authorization', 'Bearer ' + Agave.token.accessToken);
						},
						dataType: "json",
						type: "get",
						url: this.webService + "?id=" + this.geneticElement.identifier + "&samples=" + JSON.stringify(sampleNames), 
						success: $.proxy(function(response) {

							var haveNulls = false;
							var numNulls = 0;
							for (var m = 0; m < response.length; m++) {
								if(response[m].value===null||response[m].value==="None"){
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
								this.eFPView.rawSampleData= JSON.stringify(response);
								/* Match results with samples and copy values to samples */
								for (var n = 0; n < this.samples.length; n++) {
									for (var m = 0; m < response.length; m++) {
										if (this.samples[n].name == response[m].name) {
											this.samples[n].value = Number(response[m].value);
											break;
										}
									}
								}
								
								/* Process values */
								this.eFPView.processValues();
								
								/* Update eFP */
								this.eFPView.updateDisplay();
								//Eplant.queue.add(this.eFPView.updateDisplay, this.eFPView);
								
								/* Finish loading */
								this.eFPView.loadFinish();
								
							}
							//Eplant.queue.add(this.eFPView.loadFinish, this.eFPView);
						
						}, wrapper)
					});
				},this,null,this.geneticElement.identifier+"_Loading");
				
			}, this));
		};
		
		/**
			* Updates eFP.
			*
			* @override
		*/
		Eplant.Views.WorldView.prototype.updateDisplay = function() {
			/* Return if data are not loaded */
			if (!this.isLoadedData) {
				return;
			}
			
			/* Update eFP */
			if (Eplant.viewColorMode == "absolute") {
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
					if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.viewName!="CellView"){
						max= this.geneticElement.species.max;//experimentViewMax;
					}
					else{
						max = this.geneticElement.species.geneticViewMax[this.viewName];
					}
					break;
					case "customAbsolute" :
					max = Eplant.customGlobalMax;
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
					
					/* Get value ratio relative to maximum */
					var ratio = group.mean / max;
					
					/* Check whether ratio is invalid */
					if (isNaN(ratio) || !isFinite(ratio)) {		// Invalid
						group.color = this.errorColor;
					}
					else {		// Valid
						var red = minColor.red + Math.round((maxColor.red - minColor.red) * ratio);
						var green = minColor.green + Math.round((maxColor.green - minColor.green) * ratio);
						var blue = minColor.blue + Math.round((maxColor.blue - minColor.blue) * ratio);
						group.color = ZUI.Util.makeColorString(red, green, blue);
					}
					
					/* Set color of ViewObject */
					group.marker.setIcon(this.getMarkerIcon(group.color));
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
					if(/*Eplant.experimentColorMode==="all"&&this.magnification===35*/this.viewName!="CellView"){
						extremum= this.geneticElement.species.extremum;//experimentViewExtremum;
					}
					else{
						extremum = this.geneticElement.species.geneticViewExtremum[this.viewName];
					}
					
					break;
					case "customAbsolute" :
					extremum = Eplant.customGlobalExtremum;
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
					
					/* Get log2 value relative to control */
					var log2Value = ZUI.Math.log(group.mean / group.ctrlMean, 2);
					
					/* Get log2 value ratio relative to extremum */
					var ratio = log2Value / extremum;
					
					/* Check whether ratio is invalid */
					if (isNaN(ratio) || !isFinite(ratio)) {		// Invalid
						group.color = this.errorColor;
					}
					else {		// Valid
						var color1, color2;
						if (ratio < 0) {
							color1 = midColor;
							color2 = minColor;
							ratio *= -1;
						}
						else {
							color1 = midColor;
							color2 = maxColor;
						}
						var red = color1.red + Math.round((color2.red - color1.red) * ratio);
						var green = color1.green + Math.round((color2.green - color1.green) * ratio);
						var blue = color1.blue + Math.round((color2.blue - color1.blue) * ratio);
						group.color = ZUI.Util.makeColorString(red, green, blue);
					}
					
					/* Set color of ViewObject */
					group.marker.setIcon(this.getMarkerIcon(group.color));
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
					if (isNaN(ratio) || !isFinite(ratio)) {		// Invalid
						group.color = this.errorColor;
					}
					else {		// Valid
						var color1, color2;
						if (ratio < 0) {
							color1 = midColor;
							color2 = minColor;
							ratio *= -1;
						}
						else {
							color1 = midColor;
							color2 = maxColor;
						}
						var red = color1.red + Math.round((color2.red - color1.red) * ratio);
						var green = color1.green + Math.round((color2.green - color1.green) * ratio);
						var blue = color1.blue + Math.round((color2.blue - color1.blue) * ratio);
						group.color = ZUI.Util.makeColorString(red, green, blue);
					}
					
					/* Set color of ViewObject */
					group.marker.setIcon(this.getMarkerIcon(group.color));
				}
			}
			
			/* Apply masking */
			if (Eplant.isMaskOn) {
				for (var n = 0; n < this.groups.length; n++) {
					var group = this.groups[n];
					if (isNaN(group.sterror) || group.sterror >= group.mean * Eplant.maskThreshold) {
						group.color = this.maskColor;
						group.marker.setIcon(this.getMarkerIcon(group.color));
					}
				}
			}
			
			/* Update legend */
			this.legend.update();
		};
		
		/**
			* Returns the data URL of an icon image.
			*
			* @param {String} color Color of the icon image.
			* @return {DOMString} Data URL of the icon image.
		*/
		Eplant.Views.WorldView.prototype.getMarkerIcon = function(color) {
			var _color = color;
			if (_color[0] == "#") _color = _color.substring(1);
			if (this.markerIcon) {
				var canvas = document.createElement("canvas");
				canvas.width = this.markerIcon.width;
				canvas.height = this.markerIcon.height;
				var context = canvas.getContext("2d");
				context.beginPath();
				for (var n = 0; n < this.markerIcon.paths.length; n++) {
					var instructions = ZUI.Parser.pathToObj(this.markerIcon.paths[n]);
					for (var m = 0; m < instructions.length; m++) {
						var instruction = instructions[m];
						context[instruction.instruction].apply(context, instruction.args);
					}
				}
				context.strokeStyle = "none";
				//context.stroke();
				context.fillStyle = color;
				context.fill();
				
				return canvas.toDataURL("image/png");
			}
			else {
				return "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + _color;
			}
		};
		
		/**
			* Grabs the View's screen.
			*
			* @override
			* @return {DOMString}
		*/
		Eplant.Views.WorldView.prototype.getViewScreen = function() {
			return null;
		};
		
		/**
			* Returns the enter-out animation configuration.
			*
			* @override
			* @return {Object} The default enter-out animation configuration.
		*/
		Eplant.Views.WorldView.prototype.getEnterOutAnimationConfig = function() {
			/* Get default configuration */
			var config = Eplant.View.prototype.getEnterOutAnimationConfig.call(this);
			
			/* Modify configuration */
			config.begin = function() {
				Eplant.Views.WorldView.map.setCenter(new google.maps.LatLng(25, 0));
				Eplant.Views.WorldView.map.setZoom(21);
			};
			config.draw = function(elapsedTime, remainingTime, view, data) {
				var zoom = Math.round((21 - 2) * remainingTime / (elapsedTime + remainingTime) + 2);
				Eplant.Views.WorldView.map.setZoom(zoom);
			};
			config.end = function() {
				Eplant.Views.WorldView.map.setZoom(2);
			};
			
			/* Return configuration */
			return config;
		};
		
		/**
			* Returns the exit-in animation configuration.
			*
			* @override
			* @return {Object} The default exit-in animation configuration.
		*/
		Eplant.Views.WorldView.prototype.getExitInAnimationConfig = function() {
			/* Get default configuration */
			var config = Eplant.View.prototype.getExitInAnimationConfig.call(this);
			
			/* Modify configuration */
			config.data = {
				sourceZoom: Eplant.Views.WorldView.map.getZoom()
			};
			config.draw = function(elapsedTime, remainingTime, view, data) {
				var zoom = Math.round((21 - data.sourceZoom) * elapsedTime / (elapsedTime + remainingTime) + data.sourceZoom);
				Eplant.Views.WorldView.map.setZoom(zoom);
			};
			config.end = function() {
				Eplant.Views.WorldView.map.setZoom(21);
			};
			
			/* Return configuration */
			return config;
		};
		
		Eplant.Views.WorldView.prototype.zoomIn = function() {
			
			if(!Eplant.Views.WorldView.map.zooming){
				Eplant.Views.WorldView.map.zooming=true;
				Eplant.Views.WorldView.map.setZoom(Eplant.Views.WorldView.map.getZoom()+1);
			}
			
		};
		
		Eplant.Views.WorldView.prototype.zoomOut = function() {
			if(!Eplant.Views.WorldView.map.zooming){
				Eplant.Views.WorldView.map.zooming=true;
				Eplant.Views.WorldView.map.setZoom(Eplant.Views.WorldView.map.getZoom()-1);
			}
			
		};
	}
	else{
		$(document.getElementById("World_container")).css({"visibility": "hidden"});	
		
	}
})();
