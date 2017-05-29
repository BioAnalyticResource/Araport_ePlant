(function () {

	Eplant.Views.InteractionView.ChromosomeDialog = function (chrNum, data, x, y) {
		this.chrNum = chrNum;
		this.data = data;
		this.x = x;
		this.y = y;

		this.domContainer = null;
		this.dialog = null;
		this.geneIds = null;
		this.getGene = null;
		this.showIds = false;
		this.createDOM();
		this.createDialog();
	}

	/**
	 * Creates and opens the dialog.
	 */
	Eplant.Views.InteractionView.ChromosomeDialog.prototype.createDialog = function() {
		var options = {};
		options.content = this.domContainer;
		options.window = 'top'; 
		options.top = this.y;
		options.left = this.x;
		options.opacity = 0.6;
		options.window = 'top'; 
		options.fixed= false; 
		options.drag= true;
		options.resize= true;
		options.padding= '10px';
		options.close= $.proxy(function() {
			this.remove();
		}, this)
		this.dialog = window.top.art.dialog(options);
	};

	/**
	 * Create DOM for Chromosome dialog
	 * @return {void}
	 */
	Eplant.Views.InteractionView.ChromosomeDialog.prototype.createDOM = function () {
		// DOM container
		this.domContainer = document.createElement('div');
		$(this.domContainer).css({ 'max-height': '350px' });

		// DOM data container
		var container = document.createElement('div');
		$(container).width(350);
		$(container).css({
			'padding': '5px',
			'max-height': '130px',
			'overflow': 'auto'
		});
		
		// Table
		var table = document.createElement('table');
		$(table).css({ 'width': '350px' });
		// Title
		var titleRow = document.createElement('tr');
		var titleLabel = document.createElement('td');
		$(titleLabel).css({ 'vertical-align': 'top', width: 100 });
		$(titleLabel).html('<label>Chromosome ' + this.chrNum + ':</label>');
		$(titleRow).append(titleLabel);

		var titleContent = document.createElement('td');
		$(titleContent).html(this.data.length + ' Protein-DNA Interactions.');
		$(titleRow).append(titleContent);
		$(table).append(titleRow);

		// Identifiers
		this.geneIds = document.createElement('tr');
		var idLabel = document.createElement('td');
		$(idLabel).css({ 'vertical-align': 'top', width: 100 });
		$(idLabel).html('<label>Identifiers:</label>');
		$(this.geneIds).append(idLabel);

		var idContent = document.createElement('td');
		var geneString = this.data.join(', ');
		$(idContent).html(geneString);
		$(this.geneIds).append(idContent);
		$(table).append(this.geneIds);
		$(this.geneIds).hide();

		// Button container
		var buttonContainer = document.createElement('div');
		$(buttonContainer).css({ 'padding': '5px' });

		this.getGene = document.createElement('input');
		$(this.getGene).attr('type', 'button');
		$(this.getGene).css({ 'width': '200px' });
		$(this.getGene).addClass('button greenButton');
		$(this.getGene).val('Show Interactions');
		// Show genes on click
		$(this.getGene).click(function () { 
			$(this.geneIds).show();
			$(this.getGene).hide();
			this.showIds = true;
		}.bind(this));
		$(buttonContainer).append(this.getGene);

		$(this.domContainer).append(table);
		$(this.domContainer).append(buttonContainer);
	};

	/**
		* Closes the GeneticElementDialog.
	*/
	Eplant.Views.InteractionView.ChromosomeDialog.prototype.close = function() {
		if(this.dialog){
			this.dialog.close();
		}
	};
	
	/**
		* Cleans up the GeneticElementDialog.
	*/
	Eplant.Views.InteractionView.ChromosomeDialog.prototype.remove = function() {
		/* Clean up DOM elements */
		$(this.domContainer).remove();
	};
}());
