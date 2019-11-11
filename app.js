'use strict';
//API parameters
const URL = "https://developer.nps.gov/api/v1/parks";
const APIKEY = 'Iw0LNGbdnefTjvz3Qly6Ef5eU7fSvsgPxT8JNadI';
const MAX_LIMIT = 100;

const SEARCH_RESULT_LIST = $('ol');
const SEARCH_HEADER = $('header');
const FORM = $('form');
const NEXT = $('#next');
const PREV = $('#prev');

//perform search
async function search(q, states, limit, start) {
  SEARCH_HEADER.text('Searching...')
  if(isNaN(limit) || limit < 1)
    limit = 10;
  else if(limit > MAX_LIMIT)
    limit = MAX_LIMIT;
  const query = buildQuery(q, states, limit, start);
  const results = await fetchResults(query);
  if(results != null) {
    NEXT.hide();
    PREV.hide();
    NEXT.off('click');
    PREV.off('click');
    const total = parseInt(results.total);
    displayResults(results.data, start, total);
    //handle next/prev links
    if(limit < total) {
      if(start + limit < total) {
        NEXT.show();
        NEXT.one('click', () => {
          PREV.off('click');
          search(q, states, limit, start+limit);
        });
      }
      if(start > limit) {
        PREV.show();
        PREV.one('click', () => {
          NEXT.off('click');
          search(q, states, limit, start-limit);
        });
      }
    }
  }
}

//generate query string
function buildQuery(q, states, limit, start) {
  const queryParams = [];
  queryParams.push('api_key=' + APIKEY);
  queryParams.push('limit=' + limit);
  queryParams.push('sort=fullName');
  queryParams.push('fields=addresses');

  if(q.replace(/\s/g, '').length > 0) {
    queryParams.push('q=' + q);
  }
  if(states.length > 0) {
    const statesParam = states.join(',');
    queryParams.push('stateCode=' + statesParam);
  }
  queryParams.push('start=' + start);

  const query = queryParams.join('&');
  return query;
}

//call NPS API
async function fetchResults(query) {
  try {
    const url = URL + '?' + query;
    const results = await fetch(url);
    if(!results.ok)
      throw new Error(results.statusText);
    else {
      const resultsJSON = await results.json();
      return resultsJSON;
    }
  } catch(err) {
    SEARCH_RESULT_LIST.text(err);
  }
  return null;
}

//write search results to page
function displayResults(results, start, total) {
  SEARCH_RESULT_LIST.empty();
  SEARCH_HEADER.text(`Displaying results ${start} - ${start+results.length-1} of ${total}`);
  SEARCH_RESULT_LIST.attr('start', start);
  results.forEach((park) => {
    //get park physical address
    const addressObj = park.addresses.find(_addressObj => _addressObj.type == 'Physical');
    SEARCH_RESULT_LIST.append(`
      <li>
        <a href="${park.url}" target="_blank">${park.fullName}</a>
        <p>${park.description}</p>
        ${addressObj != undefined
          ? `<p>${addressObj.line1}, ${addressObj.city}, ${addressObj.stateCode} ${addressObj.postalCode}</p>` 
          : '<br>'}
      </li>`);
  })
}

//process submitted form input
async function handleSubmit(event) {
  NEXT.off('click');
  PREV.off('click');
  NEXT.hide();
  PREV.hide();
  SEARCH_RESULT_LIST.empty();
  //clean input
  const q = $('#query').val();
  const alphanumericQ = q.replace(/[^0-9a-zA-Z ]/g, '');
  const noSpacesQ = alphanumericQ.replace(/\s/g, '');
  
  const states = $('#states').val();

  const limit = parseInt($('#limit').val());
  
  if(noSpacesQ.length > 0 || states.length > 0)
    await search(alphanumericQ, states, limit, 1);
  else
    SEARCH_HEADER.text('Please specify a search string and/or states');

  FORM.one('submit', handleSubmit);
}

$(() => {
  $('.select2').select2({data: STATES_LIST});
  FORM.on('submit', event => event.preventDefault());
  FORM.one('submit', handleSubmit);
  PREV.hide();
  NEXT.hide();
});