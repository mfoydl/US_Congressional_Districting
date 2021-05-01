/**
 * GET Request for list of states available
 * @returns List of valid states
 */
function getStates(){
    return $.get(
        "http://localhost:8080/rockies/api/states/all"
    );
}

/**
 * GET request for state-outline geometry
 * @param {String} state 
 * @returns State-outline GeoJSON object for requested state
 */
function getStateOutline(state){
    return $.get(
        "http://localhost:8080/rockies/api/states/state",
        {state: state}
    );
}

/**
 * GET request for state county geometry
 * @param {String} state 
 * @returns County outline GeoJSON object for request state
 */
function getCounties(state){
    return $.get(
        "http://localhost:8080/rockies/api/states/counties",
        { state: state }
    );
}

/**
 * GET request for state precinct (voting district) Geometry
 * @param {String} state 
 * @returns 
 */
function getPrecincts(state){
    return $.get(
        "http://localhost:8080/rockies/api/states/precincts",
        { state: state }
    );
}

/**
 * Get all available jobs for a state
 * @param {String} state 
 * @returns List of job objects
 */
function getJobsSummary(state){
    return $.get(
        "http://localhost:8080/rockies/api/jobs/all",
        {state: state}
    );
}

/**
 * Send constraints and return summary
 * @param {Object} constraints 
 * @returns Summary results
 */
function constrainJob(constraints){
    console.log(constraints)
    return $.post(
        "http://localhost:8080/rockies/api/jobs/constraints",
        constraints
    );
}

/**
 * Posts job to be saved to session
 * @param {Object} job 
 * @returns job that was posted
 */
function setJob(job) {
    return $.post(
        "http://localhost:8080/rockies/api/jobs/current-job",
        job
    );
}

/**
 * 
 * @param {*} state 
 * @param {*} weights 
 * @returns 
 */
function retrieveDistricts(state, weights) {
    var stuff = $.get(
        "http://localhost:8080/rockies/api/fjobs/show",
        { id: 10 }
    )
    return stuff;
}

/**
 * 
 * @param {*} state 
 * @returns 
 */
function getIncumbents(state){
    return $.post(
        "http://localhost:8080/rockies/api/states/incumbents",
        {state:state}
    )
}