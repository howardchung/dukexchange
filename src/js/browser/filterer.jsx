var React = require('react');
var PropTypes = React.PropTypes;

var Filterer = React.createClass({
  displayName: 'Filterer',
  propTypes: {
    attributes: PropTypes.object.isRequired,
    onFieldSelect: PropTypes.func.isRequired
  },
  onChange: function(attr, e) {
    this.props.onFieldSelect(attr, e.target.value);
  },
  render: function() {
    var attrs = this.props.attributes;
    var _that = this;
    var dropdowns = Object.keys(attrs).map(function(attr) {
      var options = attrs[attr].map(function(opt) {
        return (
          <option value={opt} key={opt}>{opt}</option>
        );
      });
      options.unshift(<option key='' />)
      return (
        <div className="form-group" key={attr}>
          <label htmlFor={attr}>{attr}</label>
          <select
              className="form-control"
              id={attr}
              ref='selector'
              onChange={_that.onChange.bind(_that, attr)}>
            {options}
          </select>
        </div>
      );
    });
    return (
      <div className="filterer">
        {dropdowns}
      </div>
    );
  }
});

module.exports = Filterer;
