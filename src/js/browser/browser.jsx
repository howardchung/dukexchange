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

// https://github.com/youbastard/jquery.getQueryParameters/blob/master/qp.js
var getQueryParameters = function () {
  return document.location.search
    .replace(/(^\?)/,'')
    .split("&")
    .map(function(n){
      return n=n.split("="),this[n[0]]=n[1],this;
    }.bind({}))[0]
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
      selected: getQueryParameters(),
      numPagesRetrieved: 1,
      gotEmpty: false
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
      if (data.length > 0) {
        _that.setState({
          listings: data,
          numPagesRetrieved: _that.state.numPagesRetrieved + 1,
          gotEmpty: false
        });
      } else {
        _that.setState({
          listings: data,
          gotEmpty: true
        });
      }
    });
  },
  getMore: _.debounce(function() {
    var _that = this;
    var lastId = _.last(this.state.listings)._id;
    fetch(_.extend({after: lastId}, this.state.selected), function(data) {
      if (data.length > 0) {
        _that.setState({
          listings: update(_that.state.listings, {$push: data}),
          numPagesRetrieved: _that.state.numPagesRetrieved + 1
        });
      } else {
        _that.setState({
          gotEmpty: true
        });
      }
    });
  }, 500, true),
  onFieldSelect: _.debounce(function(attr, val) {
    var updatedVal = {};
    updatedVal[attr] = {$set: val};
    this.setState({
      selected: update(this.state.selected, updatedVal),
      gotEmpty: false,
      numPagesRetrieved: 0
    });
    this.getListings();
  }, 500),
  checkScrollBottom: function() {
    if (!this.state.gotEmpty) {
      var threshold = 400;
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
    var noMore = (
      <div className='grid-no-more'>no more to show</div>
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
        {!this.state.gotEmpty && this.state.numPagesRetrieved > 3 ? getMore : noMore}
      </div>
    );
  }
});

module.exports = Browser;
