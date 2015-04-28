var React = require('react');
var PropTypes = React.PropTypes;

var ListingGrid = React.createClass({
  displayName: 'ListingGrid',
  propTypes: {
    listings: PropTypes.arrayOf(PropTypes.shape({
      images: PropTypes.arrayOf(PropTypes.string),
      _id: PropTypes.string,
      title: PropTypes.string
    })).isRequired
  },
  render: function() {
    var listingEls = this.props.listings.map(function(listing) {
      var listingStyle = {
        backgroundImage: "url('/images/" + listing.images[0] + "')"
      };
      return (
        <li className="grid-listing-item" key={listing._id}>
          <a href={'/listings/' + listing._id}>
            <div
              className="grid-listing-image"
              style={listingStyle}>
              <div className="grid-listing-detail">
                <p>{listing.title} (${listing.price})</p>
              </div>
            </div>
          </a>
        </li>
      );
    });
    return (
      <ul className="grid-listing">
        {listingEls}
      </ul>
    );
  }
});

module.exports = ListingGrid;
