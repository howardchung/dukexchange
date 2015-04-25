var React = require('react/addons');
var PropTypes = React.PropTypes;
var update = React.addons.update;
var ListingGrid = require('./listing-grid.jsx');
var Filterer = require('./filterer.jsx');
var _ = require('underscore');
var $ = require('jquery');

var fetch = function(params, cb) {
  var paramsString = $.param(params);
  $.getJSON('/listings/browse.json?' + paramsString, function(data) {
    cb(data);
  });
};
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
      selected: {},
      numPagesRetrieved: 1
    };
  },
  getDefaultProps: function() {
    return {
      useFilterer: true
    }
  },
  componentDidMount: function() {
    window.addEventListener('scroll', this.checkScrollBottom);
  },
  getListings: function() {
    var _that = this;
    fetch(this.state.selected, function(data) {
      _that.setState({listings: data});
    });
  },
  getMore: _.debounce(function() {
    var _that = this;
    var lastId = _.last(this.state.listings)._id;
    fetch(_.extend({after: lastId}, this.state.selected), function(data) {
      _that.setState({
        listings: update(_that.state.listings, {$push: data}),
        numPagesRetrieved: _that.state.numPagesRetrieved + 1
      });
    });
  }, 500, true),
  onFieldSelect: _.debounce(function(attr, val) {
    var updatedVal = {};
    updatedVal[attr] = {$set: val};
    this.setState({
      selected: update(this.state.selected, updatedVal)
    });
    this.getListings();
  }, 500),
  checkScrollBottom: function() {
    if (this.state.numPagesRetrieved < 3) {
      var threshold = 300;
      var bottom = $(window).scrollTop() + $(window).height() >= $(document).height() - threshold;
      if (bottom) {
        this.getMore();
      }
    }
  },
  render: function() {
    var getMore = (
      <a className='btn btn-default grid-get-more' onClick={this.getMore}>Get More</a>
    );
    var filterer;
    if (this.props.useFilterer) {
      filterer = (
        <Filterer
          attributes={this.props.attributes}
          onFieldSelect={this.onFieldSelect}
          />
      );
    }
    return (
      <div className="browser">
        {this.props.useFilterer ? filterer : null}
        <ListingGrid listings={this.state.listings} />
        {this.state.numPagesRetrieved >= 3 ? getMore : null}
      </div>
    );
  }
});

module.exports = Browser;
