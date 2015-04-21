var React = require('react/addons');
var PropTypes = React.PropTypes;
var update = React.addons.update;
var ListingGrid = require('./listing-grid.jsx');
var Filterer = require('./filterer.jsx');
var _ = require('underscore');
var $ = require('jquery');

var Browser = React.createClass({
  displayName: 'Browser',
  propTypes: {
    listings: PropTypes.arrayOf(PropTypes.shape({
      images: PropTypes.arrayOf(PropTypes.string),
      _id: PropTypes.string,
      title: PropTypes.string
    })).isRequired
  },
  getInitialState: function() {
    return {
      listings: this.props.listings,
      selected: {}
    };
  },
  getListings: function() {
    var _that = this;
    var paramsString = $.param(this.state.selected);
    $.getJSON('/listings/browse.json?' + paramsString, function(data) {
      _that.setState({listings: data});
    });
  },
  onFieldSelect: _.debounce(function(attr, val) {
    var updatedVal = {};
    updatedVal[attr] = {$set: val};
    this.setState({
      selected: update(this.state.selected, updatedVal)
    });
    this.getListings();
  }, 500),
  render: function() {
    return (
      <div className="browser">
        <Filterer
          attributes={this.props.attributes}
          onFieldSelect={this.onFieldSelect}
          />
        <ListingGrid listings={this.state.listings} />
      </div>
    );
  }
});

module.exports = Browser;
