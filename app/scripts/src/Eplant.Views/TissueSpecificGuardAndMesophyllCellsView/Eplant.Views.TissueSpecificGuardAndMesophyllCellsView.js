(function() {

/**
 * Eplant.Views.ExperimentalView class
 * Coded by Hans Yu
 * UI designed by Jamie Waese
 *
 * ePlant View for browsing gene expression data of plant tissues during development as eFP.
 *
 * @constructor
 * @augments Eplant.Experimental.EFPView
 * @param {Eplant.GeneticElement} geneticElement The GeneticElement associated with this view.
 */
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView = function(geneticElement) {
	// Get constructor
	var constructor = Eplant.Views.TissueSpecificGuardAndMesophyllCellsView;

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
	
	/* Call eFP constructor */ 
	var efpSvgURL = 'app/data/experiment/efps/TissueSpecificGuardAndMesophyllCells/' + geneticElement.species.scientificName.replace(" ", "_") + '.svg';
	var efpXmlURL = 'app/data/experiment/efps/TissueSpecificGuardAndMesophyllCells/' + geneticElement.species.scientificName.replace(" ", "_") + '.xml';
	Eplant.BaseViews.EFPView.call(this, geneticElement, efpSvgURL,efpXmlURL, {
	}); 

};
ZUI.Util.inheritClass(Eplant.BaseViews.EFPView, Eplant.Views.TissueSpecificGuardAndMesophyllCellsView);	// Inherit parent prototype

Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.viewName = "TissueSpecificGuardAndMesophyllCellsView";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.displayName = "Tissue Specific Guard And Mesophyll Cells eFP";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.hierarchy = "genetic element";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.magnification = 35;
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.description = "Tissue Specific Guard And Mesophyll Cells eFP";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.citation = "";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.activeIconImageURL = "";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.availableIconImageURL = "";
Eplant.Views.TissueSpecificGuardAndMesophyllCellsView.unavailableIconImageURL = "";


})();
