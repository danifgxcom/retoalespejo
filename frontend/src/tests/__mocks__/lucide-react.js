const React = require('react');
module.exports = new Proxy({}, {
  get: (target, key) => {
    if (key === '__esModule') return true;
    return (props) => React.createElement('span', { 'data-testid': key, ...props });
  }
});
