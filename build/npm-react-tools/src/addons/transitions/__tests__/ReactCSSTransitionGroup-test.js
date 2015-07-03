/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactCSSTransitionGroup;
var mocks;

// Most of the real functionality is covered in other unit tests, this just
// makes sure we're wired up correctly.
describe('ReactCSSTransitionGroup', function() {
  var container;

  beforeEach(function() {
    React = require('React');
    ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');
    mocks = require('mocks');

    container = document.createElement('div');
    spyOn(console, 'warn');
  });

  it('should warn after time with no transitionend', function() {
    var a = React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);

    setTimeout.mock.calls.length = 0;

    React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('two');
    expect(a.getDOMNode().childNodes[1].id).toBe('one');

    // For some reason jst is adding extra setTimeout()s and grunt test isn't,
    // so we need to do this disgusting hack.
    for (var i = 0 ; i < setTimeout.mock.calls.length; i++) {
      if (setTimeout.mock.calls[i][1] === 5000) {
        setTimeout.mock.calls[i][0]();
        break;
      }
    }

    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(console.warn.argsForCall.length).toBe(1);
  });

  it('should keep both sets of DOM nodes around', function() {
    var a = React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('two');
    expect(a.getDOMNode().childNodes[1].id).toBe('one');
  });

  it('should switch transitionLeave from false to true', function() {
    var a = React.render(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={false}>
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.render(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={false}>
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.render(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={true}>
        <span key="three" id="three" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('three');
    expect(a.getDOMNode().childNodes[1].id).toBe('two');
  });

  it('should work with no children', function() {
    React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
      </ReactCSSTransitionGroup>,
      container
    );
  });

  it('should work with a null child', function() {
    React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        {[null]}
      </ReactCSSTransitionGroup>,
      container
    );
  });

  it('should transition from one to null', function() {
    var a = React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        {null}
      </ReactCSSTransitionGroup>,
      container
    );
    // (Here, we expect the original child to stick around but test that no
    // exception is thrown)
    expect(a.getDOMNode().childNodes.length).toBe(1);
    expect(a.getDOMNode().childNodes[0].id).toBe('one');
  });

  it('should transition from false to one', function() {
    var a = React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        {false}
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(0);
    React.render(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    expect(a.getDOMNode().childNodes[0].id).toBe('one');
  });

  it('should handle entering/leaving several elements at once', function() {
    var log = [];
    var cb;

    var Child = React.createClass({
      componentDidMount: function() {
        log.push('didMount'+this.props.id);
      },
      componentWillEnter: function(cb) {
        log.push('willEnter'+this.props.id);
        cb();
      },
      componentDidEnter: function() {
        log.push('didEnter'+this.props.id);
      },
      componentWillLeave: function(cb) {
        log.push('willLeave'+this.props.id);
        cb();
      },
      componentDidLeave: function() {
        log.push('didLeave'+this.props.id);
      },
      componentWillUnmount: function() {
        log.push('willUnmount'+this.props.id);
      },
      render: function() {
        return <span />;
      }
    });

    var Component = React.createClass({
      getInitialState: function() {
        return {count: 1};
      },
      render: function() {
        var children = [];
        for (var i = 0; i < this.state.count; i++) {
          children.push(<Child key={i} id={i} />);
        }
        return <ReactTransitionGroup>{children}</ReactTransitionGroup>;
      }
    });

    var instance = React.render(<Component />, container);
    expect(log).toEqual(['didMount0']);
    log = [];

    instance.setState({count: 3});
    expect(log).toEqual([
      'didMount1', 'didMount2', 'willEnter1', 'didEnter1', 
      'willEnter2', 'didEnter2'
    ]);
    log = [];

    instance.setState({count: 0});
    expect(log).toEqual([
      'willLeave0', 'didLeave0', 'willLeave1', 'didLeave1', 
      'willLeave2', 'didLeave2', 'willUnmount0', 'willUnmount1', 'willUnmount2'
    ]);
  });
});
