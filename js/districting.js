/**
 * Parses GeoJSON object to create list item
 * @param {Object} geoJSON geoJSON object representing the district
 * @return {Element} List Item element to add to list
 */
class Districting {
	constructor(geoJSON, dicTab) {
		// maybe one day dicTab won't be global...
		this.dicTab = dicTab
		this.geoJSON = geoJSON

		// create list item
		var id = geoJSON.features[0].properties.CDSESSN;
	    var div = L.DomUtil.create('div');
	    var headerDiv = htmlElement(div, "div", 'd-flex w-100 justify-content-between');
	    createTextElement(headerDiv, "h5", id, "mb-1");
	    this.check = L.DomUtil.create("input", "form-check-input", headerDiv);
	    this.check.type = "checkbox";
	    var contentDiv = htmlElement(div, "div", 'd-flex w-100 justify-content-between');
	    createTextElement(contentDiv, "p", "Score: " + this.getScore().toFixed(2), "");
	    var link = createTextElement(contentDiv,'a','<em>more info</em>','modal-link')
	    this.listItem = createListItem(div, false, false);

	    // District List for Info Tab
	    var listgroupContainer = L.DomUtil.create('div');
	    this.districtList = createListGroup(listgroupContainer);
	    this.districtList.classList.add('list-group-flush');

	    this.featureGroup = new L.LayerGroup();
	    L.geoJson(geoJSON, {
	        onEachFeature: this.processDistrict
	    });


	    //Info Page
	    var infoContainer = L.DomUtil.create('div');
	    this.infoContainer = infoContainer
	    var infoHeader = htmlElement(infoContainer, 'div','d-flex w-100 justify-content-between');
	    createTextElement(infoHeader, 'h5', id, 'h5');

	    var checkDiv = htmlElement(infoHeader, 'div');
	    createLabel(checkDiv, '<i>show</i>&nbsp',id+'InfoCheck','small');
	    this.infoCheck = L.DomUtil.create("input", "form-check-input custom-check", checkDiv);
	    this.infoCheck.id = id+"InfoCheck"
	    this.infoCheck.type = "checkbox";

	    var infoBody = htmlElement(infoContainer, 'div');

	    createAccordian(infoBody, "Dist" + id, "Districts", listgroupContainer);

		var stats = htmlElement(infoBody,'div','container');
		var statsListContainer = L.DomUtil.create('div')
		this.statsList = createListGroup(statsListContainer)
		createAccordian(infoBody, "stats" + id, "Objective Function Breakdown", statsListContainer)
	    div = L.DomUtil.create('div', 'd-flex w-100 justify-content-between');
		createTextElement(div, 'p', 'Measure', 'stat-col score')
		createTextElement(div, 'p', 'Value', 'stat-col')
		createTextElement(div, 'p', 'Weight', 'stat-col')
		createTextElement(div, 'p', 'Contrib', 'stat-col')
		let statItem = createListItem(div, true, false)
		this.statsList.appendChild(statItem)
		// populate stats list
		for (let score in this.geoJSON['scores']) {
	    	var div = L.DomUtil.create('div', 'd-flex w-100 justify-content-between');
			createTextElement(div, 'p', score, 'stat-col score')
			let s = this.geoJSON.scores[score]
			createTextElement(div, 'p', s, 'stat-col')
			createTextElement(div, 'p', this.dicTab.weights[score], 'stat-col')
			createTextElement(div, 'p', s*this.dicTab.weights[score], 'stat-col')
			let statItem = createListItem(div, true, false)
			this.statsList.appendChild(statItem)
		}
	    div = L.DomUtil.create('div', 'd-flex w-100 justify-content-between');
		createTextElement(div, 'p', 'Total', 'stat-col score')
		createTextElement(div, 'p', '', 'stat-col')
		createTextElement(div, 'p', '', 'stat-col')
		createTextElement(div, 'p', this.getScore().toFixed(2), 'stat-col')
		statItem = createListItem(div, true, false)
		this.statsList.appendChild(statItem)
	    
		var infoFooter = htmlElement(infoContainer, 'div', 'd-grid gap-2');
	    var back = createButton(infoFooter, 'button', 'Back', 'btn btn-secondary btn-lg ');

	    L.DomEvent.on(this.check, 'click', this.checkClicked);

	    L.DomEvent.on(this.infoCheck, 'click', this.checkClicked);

	    L.DomEvent.on(link, 'click', this.dicTab.showDistrictInfo.bind(this.dicTab, this))
	    // 	function (ev) {
	    //     showDistrictInfo(infoContainer, featureGroup);
	    // });

	    L.DomEvent.on(back, 'click', this.dicTab.showDistrictList.bind(this.dicTab, this))
	    // function (ev) {
	    //     showDistrictList(infoContainer, featureGroup);
	    // });
	}

	getScore = () => {
		let score = 0
		let weights = this.dicTab.weights
		for (let s in weights) {
			score += this.geoJSON['scores'][s] * weights[s]
		}
		return score
	}

	checkClicked = (ev) => {
		this.toggleDisplay(ev.target.checked)
	}

	// display is boolean
	toggleDisplay = (display) => {
		this.check.checked = display
		this.infoCheck.checked = display
		if (display) {
			this.dicTab.displayDistricting(this)
		} else {
			this.dicTab.unselectDistricting()
		}
	}

	processDistrict = (feature, layer) => {
		// add feature to map in our featureGroup
		var featureJson = L.geoJson(feature);
        featureJson.addTo(this.featureGroup);


        var id = "CD" + feature.properties.CDSESSN + feature.properties["CD" + feature.properties.CDSESSN + "FP"]
	    var div = L.DomUtil.create('div', 'd-flex w-100 justify-content-between');
	    div.id = id;
	    //var div = htmlElement(div, "div", 'd-flex w-100 justify-content-between',id);
	    var p = createTextElement(div, 'p', "District " + feature.properties["CD" + feature.properties.CDSESSN + "FP"])
	    addDistrictHightlight(featureJson, div);
	    var item = createListItem(div, true, false);

        this.districtList.appendChild(item)
	}
}
