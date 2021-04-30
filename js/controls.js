/* ********** CUSTOM LEAFLET UI CONTROL DEFINITIONS ********** */

const constraintsDataFormat = {
    'count': { 'label': 'Districtings Returned: ', 'value': 0 },
    'avg-compactness': { 'label': 'Average Compactness: ', 'type': '', 'value': 0 },
    'avg-maj-min': { 'label': 'Average Majority-Minority Districts: ', 'value': 0 },
    'population-diff': { 'label': 'Average Population Difference: ', 'type': '', 'value': 0 },
}

/**
 * 
 */
L.Control.Center = L.Control.extend({
    onAdd: function (map) {
        var img = L.DomUtil.create('img', 'sideBtn');
        img.src = './center.png';
        img.innerHTML = "<span class='tooltiptext'>re-center map</span>";

        L.DomEvent.on(img, 'click', function (ev) {
            recenter();
        });

        return img;


    },
    onRemove: function (map) { }
});

/**
 * 
 * @param {*} opts 
 */
L.control.center = function (opts) {
    return new L.Control.Center(opts);
}

/**
 * Creates the Back button control
 */
L.Control.BackButton = L.Control.extend({
    onAdd: function (map) {
        var button = L.DomUtil.create('div', 'mapButton');
        button.innerHTML = '<h4>Back</h4>'

        L.DomEvent.on(button, 'click', function (ev) {
            backToCountry();
        });
        return button;
    },
    onRemove: function (map) { }
});

/**
 * Factory function for the backButton control
 * @param {Object} opts Leaflet options object 
 */
L.control.backButton = function (opts) {
    return new L.Control.BackButton(opts);
}

window.dicTab = new DistrictingsTab();

/**
 * Creates the Menu control
 */
L.Control.Menu = L.Control.extend({
    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'menu');

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        var nav = createTabNav(div, "menuNav");

        this.constraintsData = constraintsDataFormat;

        createTab(nav, "Jobs", jobsTab(this.state), 'jobs', true)//Jobs Tab
        createTab(nav, "Constraints", constraintsTab(this.state, this), "constraints", false, true); //Constraints Tab
        createTab(nav, "Constrain Results", constraintsSummaryTab(this.constraintsData), 'constraintsSummary', false, true)//Summary Tab
        createTab(nav, "Measures", measuresTab(this.state), "measures", false, true); //Measures Tab
        createTab(nav, "Top Districtings", window.dicTab.div, "districts", false, true); //Districtings Tab

        $(document).ready(function () {
            $('#constraintsSummary-tab').hide(); //Hide the physical tab, content accesssed through buttons
        });

        return div;
    },
    onRemove: function (map) { },
    setState: function (state) {
        this.state = state //Keep track of the current state selected
    },
    setConstraintsData: function (data) {
        // console.log(data)
        this.constraintsData = data;
        Object.keys(data).forEach(function (key) {
            $("#" + key + "ConSummaryLabel").html(data[key].label)
            var value = $("#" + key + "ConSummaryValue")
            value.html(data[key].value)
            if (data[key].type) {
                value.append(" <i>[" + data[key].type + "]</i>");
            }
        });
    }
});

/**
 * Factory function for the menu control
 * @param {Object} opts Leaflet options object
 */
L.control.menu = function (opts) {
    return new L.Control.Menu(opts);
}

/**
 * Creates the States control
 */
L.Control.States = L.Control.extend({
    onAdd: function (map) {

        var div = L.DomUtil.create('div', 'dropdown');
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        var constraints = htmlElement(div, 'div', 'd-grid gap-1');

        createAccordian(div, 'statesAccordion', 'Select a state to display', constraints)
        var buttons = {};
        statesObj.forEach((state) => createButton(constraints, 'button', state.name, 'btn btn-primary'));
        //buttons['AL'] = createButton(constraints, 'button', 'Alabama', 'btn btn-primary');
        //buttons['AR'] = createButton(constraints, 'button', 'Arizona', 'btn btn-primary submitBtn');
        //buttons['MI'] = createButton(constraints, 'button', 'Michigan', 'btn btn-primary submitBtn');

        Object.keys(buttons).forEach(function (key) {
            var obj = statesObj[key];

            buttons[key]['onclick'] = () => { zoomToState(obj.state, obj) }
            buttons[key]['onmouseover'] = () => { obj.state.setStyle(highLightStyle) }
            buttons[key]['onmouseout'] = () => { obj.state.setStyle(statesStyle) }

        });

        return div;
    },
    onRemove: function (map) { },
    setState: function (state) {
        this.state = state
    }
});

/**
 * Factory function for the states control
 * @param {Object} opts Leaflet options object
 */
L.control.states = function (opts) {
    return new L.Control.States(opts);
}

/**
 * Creates precinct TileLayer 
 */
L.GridLayer.Precincts = L.GridLayer.extend({
    createTile: function (coords, done) {
        var error;

        var leafTile = L.DomUtil.create('canvas', 'leaflet-tile');

        var size = this.getTileSize();
        leafTile.width = size.x;
        leafTile.height = size.y;

        var ctx = leafTile.getContext('2d');
        var tile = this.tileIndex.getTile(coords.z, coords.x, coords.y);
        if (!tile) {
            return leafTile;
        }
        ctx.clearRect(0, 0, leafTile.width, leafTile.height);
        var features = tile.features;
        ctx.strokeStyle = 'grey';
        pad = 0
        for (var i = 0; i < features.length; i++) {
            var feature = features[i],
                type = feature.type;
            ctx.beginPath();

            for (var j = 0; j < feature.geometry.length; j++) {
                var geom = feature.geometry[j];

                if (type === 1) {
                    ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
                    continue;
                }

                for (var k = 0; k < geom.length; k++) {
                    var p = geom[k];
                    var extent = 4096;

                    var x = p[0] / extent * 256;
                    var y = p[1] / extent * 256;
                    if (k) ctx.lineTo(x + pad, y + pad);
                    else ctx.moveTo(x + pad, y + pad);
                }
            }

            ctx.stroke();
        }
        setTimeout(function () {
            done(error, tile);
        }, 1000);
        return leafTile;
    },
    setTileIndex(tileIndex) {
        this.tileIndex = tileIndex
    }
});

/**
 * Factory function for precincts Tile Layer
 * @param {Object} opts Leaflet options object
 */
L.gridLayer.precincts = function (opts) {
    return new L.GridLayer.Precincts(opts);
}

/* **********   SPECIFIC BUILDER FUNCTIONS W/ LEAFLET  ********** */

function jobsTab(state) {
    var jobs;

    var container = L.DomUtil.create('div');

    getJobsSummary(state).then(response => {
        jobs = response;
        var headerDiv = htmlElement(container, 'div', 'center tabContentTitle mb-3');
        createTextElement(headerDiv, 'h5', 'Select a Job', 'h5');


        var bodyDiv = htmlElement(container, 'div');
        var list = createListGroup(bodyDiv);
        list.id = 'jobList';
        list.classList.add('list-group-flush');

        jobs.forEach(function (job) {
            list.appendChild(jobListItem(job));
        });
    })

    return container;
}

function jobListItem(job) {
    var container = L.DomUtil.create('div');

    var headerDiv = htmlElement(container, "div", 'd-flex w-100 justify-content-between');
    createTextElement(headerDiv, "h5", "Job " + job.id, "mb-1 center");

    var content = htmlElement(container, 'div', 'container');
    createTextElement(content, 'p', 'Rounds: ' + job.rounds);
    createTextElement(content, 'p', 'Cooling-Period: ' + job.coolingPeriod);
    createTextElement(content, 'p', 'Districtings: ' + job.numDistrictings);

    var footer = htmlElement(container, 'div', 'd-grid gap-2');
    var selectBtn = createButton(footer, 'button', 'Select', 'btn btn-primary', 'select-' + job.name);

    L.DomEvent.on(selectBtn, 'click', function (ev) { selectJob(job) });

    return createListItem(container, false, false);
}

/**
 * Creates the content for the 'params' tab
 * @return {Element} div container of the content
 */
function constraintsTab(state, menu) {

    var div = L.DomUtil.create('div');  //Main Container

    var headerDiv = htmlElement(div, 'div', 'center tabContentTitle mb-3');
    createTextElement(headerDiv, 'h5', 'Job Subset Constraints', 'h5');

    var constraints = htmlElement(div, 'div', 'container');

    //Constraints Sliders
    createSlider(constraints, 'compactness-constraint', 'Compactness', 0, 1, 0.1,'Comp');
    createSlider(constraints, 'majmin-constraint', 'Majority-Minority Districts (>=)', 0, 10, 1,'Maj-Min');
    createSlider(constraints, 'population-constraint', 'Population Difference (<=%)', 0, 3, 0.1,"Pop-Diff");

    //Incumbents Protection Menu
    var incumbentsDiv = htmlElement(constraints, 'div', 'container')
    createLabel(incumbentsDiv, 'Incumbent Protection: &emsp;&emsp;', 'incumbentsLink')
    var incumbents = createTextElement(incumbentsDiv, 'a', 'Set Protections', 'modal-link', 'incumbentsLink');
    incumbents.setAttribute('data-bs-toggle', 'modal');
    incumbents.setAttribute('data-bs-target', '#incumbentsModal');

    var incumbentsList = incumbentsContent(state);
    var incumbentsModal = modalDialog('incumbentsModal', 'Protect Incumbents', incumbentsList);
    $('body').append(incumbentsModal);

    //Compactness and Population Options menu
    var compactnessRadioLabels = [
        { 'label': 'Graph Compactness', 'value': 'graph', 'checked': true },
        { 'label': 'Population Fatness', 'value': 'fatness' },
        { 'label': 'Polsby-Popper', 'value': 'polsby' }
    ];
    var populationRadioLabels = [
        { 'label': 'Total Population', 'value': 'total', 'checked': true },
        { 'label': 'Voting Age Population (TVAP)', 'value': 'tvap', 'disabled': true },
        { 'label': 'Citizen Voting Age Population', 'value': 'cvap', 'disabled': true }
    ]

    var optionsContainer = L.DomUtil.create('div');
    createRadioGroup(optionsContainer, compactnessRadioLabels, "Compactness Measure", "compactnessRadio");
    createRadioGroup(optionsContainer, populationRadioLabels, "Population Constraint-Type", "populationRadio");
    createAccordian(constraints, 'compactnessAccordion', '<i>options</i>', optionsContainer);

    //Submit Buttons
    var subDiv = htmlElement(div, 'div', 'd-grid gap-2 col-6 mx-auto submitBtn')
    var subBtn = createButton(subDiv, 'button', 'Submit', 'btn btn-primary btn-lg', 'submitButton');

    //Event Handler
    L.DomEvent.on(subBtn, 'click', function (ev) {
        var data = {}
        data['compactness'] = document.getElementById('compactness-constraint').value;
        data['majMin'] = document.getElementById('majmin-constraint').value;
        data['popDiff'] = document.getElementById('population-constraint').value;
        data['cmpMeasure'] = document.querySelector('input[name="compactnessRadio"]:checked').value;
        data['popType'] = document.querySelector('input[name="populationRadio"]:checked').value;
        var incumbentData = {};
        statesObj[state]['senators'].forEach(function (senator) {
            incumbentData[senator.name] = document.getElementById(senator.name).checked;
        });
        statesObj[state]['reps'].forEach(function (rep) {
            incumbentData[rep.name] = document.getElementById(rep.name).checked;
        });
        data['incumbentProt'] = JSON.stringify(incumbentData);
        
        submitConstraints(data, menu);
    });

    return div;
}

function constraintsSummaryTab(data, menu) {
    var container = L.DomUtil.create('div'); //Contianer div

    //Header Elements
    var headerDiv = htmlElement(container, 'div', 'center tabContentTitle mb-3');;
    createTextElement(headerDiv, 'h5', 'Constraints Results', 'h5');// Page title

    var body = htmlElement(container, 'div', 'data-table',); //Content container
    Object.keys(data).forEach(function (key) {
        var row = htmlElement(body, 'div', 'row');
        createTextElement(row, 'p', data[key].label + data[key].value, 'col', key + "ConSummaryLabel");
        var value = createTextElement(row, 'p', data[key].value, 'col', key + "ConSummaryValue");
        if (data[key].type) {
            value.innerHTML += "(" + data[key].type + ")";
        }
    });

    //Footer elements
    var footer = htmlElement(container, 'div', 'row');
    var left = htmlElement(footer, 'div', 'col d-grid gap-2');
    var right = htmlElement(footer, 'div', 'col d-grid gap-2');
    var back = createButton(left, 'button', 'Back', 'btn btn-secondary btn-lg');
    var next = createButton(right, 'button', 'Next', 'btn btn-primary btn-lg');

    L.DomEvent.on(back, 'click', function (ev) { switchTabContent('constraints-tab', 'constraints'); disableTab('measures'); disableTab('districts') })
    L.DomEvent.on(next, 'click', function (ev) { switchTabs('measures') });

    return container;
}

function measuresTab(state) {
    var div = L.DomUtil.create('div');
    var headerDiv = htmlElement(div, 'div', 'center tabContentTitle mb-3');
    createTextElement(headerDiv, 'h5', 'Objective Function Weights', 'h5');

    var measures = htmlElement(div, 'div', 'container');

    var table = L.DomUtil.create('table', 'table table-sm slider-table align-middle', measures);
    var body = L.DomUtil.create('tbody', '', table);

    createSlider(body, 'population-equality', 'Population Equality', 0, 1.0, 0.1,'Pop-Eq');
    createSlider(body, 'avgerage-deviation', 'Deviation from Average Districting', 0, 1, 0.1, 'Avg-Dev');
    createSlider(body, 'enacted-deviation', 'Deviation from Enacted Plan', 0, 1, 0.1, 'Enacacted-Dev');
    createSlider(body, 'compactness', 'Compactness', 0, 1, 0.1, 'Comp');
    createSlider(body, 'political-fairness', 'Political Fairness', 0, 1, 0.1, 'Pol-Fairness');
    createSlider(body, 'split-counties', 'Split Counties', 0, 1, 0.1, 'Split');
    //createSwitch(measures, 'split-counties', "Allow Split Counties");


    var subDiv = htmlElement(div, 'div', 'd-grid gap-2 col-6 mx-auto submitBtn')
    var subBtn = createButton(subDiv, 'button', 'Submit', 'btn btn-primary btn-lg', 'submitButton');

    // use default values of 0.5 for now
    let weights = {
        "compactness": 0.5,
        "popEquality": 0.5,
        "splitCounties": 0.5,
        "devFromAvg": 0.5,
        "devFromEnactedArea": 0.5,
        "devFromEnactedPop": 0.5,
        "fairness": 0.5,
		"majmin": 0.5,
    }
    L.DomEvent.on(subBtn, 'click', function (ev) { submitMeasures(state, weights) })
    return div;
}


function incumbentsContent(state) {

    var div = L.DomUtil.create('div');

    // Send incumbents request if not available
    if (!('senators' in statesObj[state])){
        incumbents = getIncumbents(state);
        statesObj[state].sentators = incumbents.senators
        statesObj[state].reps = incumbents.reps
    }

    createTextElement(div, 'p', "Senators", "h5");
    statesObj[state]['senators'].forEach(function (senator) {
        let elem = createSwitch(div, senator.name, senator.name + " <em>[" + senator.party + "]</em>");
        elem.classList.add(senator.party);
        elem.classList.add('grayed');
        elem.setAttribute('checked', 'true');
        L.DomEvent.on(elem, 'click', function (ev) {
            if (this.getAttribute('checked') === 'true') {
                this.setAttribute('checked', 'false');
            } else {
                this.setAttribute('checked', 'true');
            }
        })
    });
    createTextElement(div, 'p', "Representative", "h5");
    statesObj[state]['reps'].forEach(function (rep) {
        let elem = createSwitch(div, rep.name, rep.name + " -<em> " + rep.district + ' District ' + " [" + rep.party + "]</em>");
        elem.classList.add(rep.party);
        elem.classList.add('grayed');
        elem.setAttribute('checked', 'true');
        L.DomEvent.on(elem, 'click', function (ev) {
            if (this.getAttribute('checked') === 'true') {
                this.setAttribute('checked', 'false');
            } else {
                this.setAttribute('checked', 'true');
            }
        });
    });

    return div;
}


/* *************************************** */
/* ********** HANDLER FUNCTIONS ********** */
/* *************************************** */

/**
 * Gathers form data from the parameters tab to be sent as request
 * Clears current districts list
 * Adds new dsitricts list to the UI
 * Called from listener set up in measuresTab
 */
function submitMeasures(state, weights) {
    dicTab = window.dicTab
    dicTab.clearList()

    retrieveDistricts(state, weights).then(response => {
        response['scores'] = {
            "compactness": 0.1,
            "popEquality": 0.8,
            "splitCounties": 1,
            "devFromAvg": 0.9,
            "devFromEnactedArea": 0.4,
            "devFromEnactedPop": 0.7,
            "fairness": 0.3,
            "majmin": 1
        }
        console.log(response)
        var districts = [response];
        dicTab.setDistricts(districts, weights);
        switchTabs('districts');
        //hideAll(districtLayer);
        districtLayer.clearLayers();
        
    });

    // districts.forEach(function (item) {
    //     list.append(districtListItem(item));
    // });
}

function addDistrictHightlight(district, div) {
    L.DomEvent.on(div, 'mouseover', function (ev) { highlightDistrict(district) });
    L.DomEvent.on(div, 'mouseout', function (ev) { resetDistrictHighlight(district, districtStyle) });
    addHighlight(district, districtStyle);
    district.on({
        mouseover: function () { div.parentNode.classList.add('highlighted') },
        mouseout: function(){div.parentNode.classList.remove('highlighted')}
    });
}

function selectJob(job) {
    setJob(job).then(response => {
        // console.log(response);
        disableTab('measures')
        disableTab('districts')
        switchTabs('constraints');
        //hideAll(districtLayer);
        districtLayer.clearLayers();
    });
}

function submitConstraints(constraints, menu) {
    constrainJob(constraints).then(response => {
        // TODO: structure response to be same as stuff
        var stuff = {
            'count': { 'label': 'Districtings Returned: ', 'value': '1,000' },
            'avg-compactness': { 'label': 'Avg. Compactness: ', 'type': 'Polsby-Popper', 'value': '.92' },
            'avg-maj-min': { 'label': 'Avg. Majority-Minority Districts: ', 'value': '2' },
            'population-diff': { 'label': 'Avg. Population Difference: ', 'type': 'Total Population', 'value': '1.2%' },
        };
        console.log(response);
        menu.setConstraintsData(stuff);
        switchTabContent('constraints-tab', 'constraintsSummary');
        //hideAll(districtLayer);
        districtLayer.clearLayers();
    })
}


/* ************************************** */
/* ********** HELPER FUNCTIONS ********** */
/* ************************************** */


/**
 * Clears the List Group of districtings on the districts tab on the menu
 */
// function clearDistricts() {
//     $("#districtList").empty();
// }

function switchTabs(id) {
    enableTab(id);
    $(".nav-link.active,.tab-pane.active").attr({ 'aria-selected': 'false' }).removeClass('active show');
    $("#" + id + "-tab").addClass('active').attr({ 'aria-selected': 'true' });;
    $("#" + id).addClass('active show').attr({ 'aria-selected': 'true' });

    //$("#" + id + "-tab").attr({ 'aria-selected': 'true' });
}

function switchTabContent(tabid, contentid) {
    $(".tab-pane.active").attr({ 'aria-selected': 'false' }).removeClass('active show');
    $("#" + contentid).addClass('active show').attr({ 'aria-selected': 'true' });

    $("#" + tabid).attr({ "data-bs-target": "#" + contentid });
    $("#" + tabid).attr({ "aria-controls": contentid });
    $("#" + contentid).attr({ "aria-labelledby": tabid + "-tab" });


}

function enableTab(id) {
    var tab = $("#" + id + '-tab');
    tab.attr({ 'aria-disabled': 'false' });
    tab.removeClass('disabled')
}

function disableTab(id) {
    var tab = $("#" + id + '-tab');
    tab.attr({ 'aria-disabled': 'true' });
    tab.addClass('disabled')
}




