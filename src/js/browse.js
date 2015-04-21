var React = require('react');
var Browser = require('./browser/browser.jsx');
var el = document.getElementById('browse-grid');
var listings = JSON.parse(el.getAttribute('data-listings'));
var attributes = JSON.parse(el.getAttribute('data-attributes'));
React.render(React.createElement(Browser, {listings: listings, attributes: attributes}), el);
