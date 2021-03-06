"use strict";
var testcase = require('nodeunit').testCase;
var jsdom = require("../..");

class EventMonitor {
  constructor() {
    this.atEvents = [];
    this.bubbledEvents = [];
    this.capturedEvents = [];
    this.allEvents = [];

    this.handleEvent = function (event) {
      this.allEvents.push(event);

      switch (event.eventPhase) {
        case event.CAPTURING_PHASE:
          this.capturedEvents.push(event);
          break;
        case event.AT_TARGET:
          this.atEvents.push(event);
          break;
        case event.BUBBLING_PHASE:
          this.bubbledEvents.push(event);
          break;
        default:
          throw new Error("Unspecified event phase");
      }
    }.bind(this);
  }
}

var _setUp = function() {
  var doc = require('../level1/core/files/hc_staff.xml').hc_staff();
  var monitor = this.monitor = new EventMonitor();
  this.win = doc.defaultView;
  this.title = doc.getElementsByTagName("title").item(0);
  this.body = doc.getElementsByTagName("body").item(0);
  this.plist = doc.getElementsByTagName("p").item(0);
  this.event = doc.createEvent("Events");
  this._handleEvent = function(type) { return(function(event) { event[type](); monitor.handleEvent(event) }); }
}
var _tearDown = function(xs) {
  xs = ['monitor', 'title', 'body', 'plist', 'event', '_handleEvent'].concat(xs ? xs : []);
  var self = this;
  xs.forEach(function(x){
    self[x] = undefined;
    delete(self[x]);
  })
}

// A document is created using implementation.createDocument and cast to a DocumentEvent interface.
// @author Curt Arnold
// @see http://www.w3.org/TR/DOM-Level-2-Events/events#Events-DocumentEvent
exports['DocumentEvent interface'] = function (test) {
  var doc = require('../level1/core/files/hc_staff.xml').hc_staff();
  test.ok((doc.createEvent instanceof Function), "should have createEvent function");
  test.done();
}

// A document is created using implementation.createDocument and cast to a EventTarget interface.
// @author Curt Arnold
// @see http://www.w3.org/TR/DOM-Level-2-Events/events#Events-EventTarget
exports['EventTarget interface'] = function (test) {
  var doc = require('../level1/core/files/hc_staff.xml').hc_staff();
  test.ok((doc instanceof doc.defaultView.EventTarget), 'should be an instance of EventTarget');
  test.done();
}

// An object implementing the Event interface is created by using DocumentEvent.createEvent method with an eventType
// @author Curt Arnold
// @see http://www.w3.org/TR/DOM-Level-2-Events/events#Events-DocumentEvent-createEvent
exports['create event with each event type'] = function(test){
  var doc = require('../level1/core/files/hc_staff.xml').hc_staff(),
      event_types = {'Events': doc.defaultView.Event,
                     'MutationEvents': doc.defaultView.MutationEvent,
                     'UIEvents': doc.defaultView.UIEvent,
                     'MouseEvents': doc.defaultView.MouseEvent ,
                     'HTMLEvents': doc.defaultView.Event};
  test.expect(10);
  for (var type in event_types) {
    var event = doc.createEvent(type);
    test.notEqual(event, null, "should not be null for " + type);
    test.ok((event instanceof event_types[type]),"should be instanceof " + type);
  }
  test.done();
}

// @see https://dom.spec.whatwg.org/#interface-event
exports['event interface eventInit parameter'] = function (test) {
  var doc = jsdom.jsdom();

  testEventConstructor(doc.defaultView.Event);
  testEventConstructor(doc.defaultView.UIEvent);
  testEventConstructor(doc.defaultView.MouseEvent);
  test.throws(function () {
    new doc.defaultView.MutationEvent('myevent');
  }, TypeError);

  test.done();

  function testEventConstructor(Constructor) {
    test.throws(function () {
      new Constructor('myevent', 'not a dictionary');
    }, TypeError);

    var event = new Constructor('myevent');
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, false);

    event = new Constructor('myevent', null);
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, false);

    event = new Constructor('myevent', { bubbles: true });
    test.equal(event.bubbles, true);
    test.equal(event.cancelable, false);

    event = new Constructor('myevent', { cancelable: true });
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, true);

    event = new Constructor('myevent', { bubbles: true, cancelable: true });
    test.equal(event.bubbles, true);
    test.equal(event.cancelable, true);

    event = new Constructor('myevent', {});
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, false);

    event = new Constructor('myevent', { bubbles: null, cancelable: null });
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, false);

    event = new Constructor('myevent', { bubbles: 0, cancelable: 0 });
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, false);

    // values > 0 are considered true
    event = new Constructor('myevent', { bubbles: 1, cancelable: 1 });
    test.equal(event.bubbles, true);
    test.equal(event.cancelable, true);

    // values > 0 are considered true
    event = new Constructor('myevent', { bubbles: 10, cancelable: 10 });
    test.equal(event.bubbles, true);
    test.equal(event.cancelable, true);

    // empty string is considered false
    event = new Constructor('myevent', { bubbles: "", cancelable: "" });
    test.equal(event.bubbles, false);
    test.equal(event.cancelable, false);

    // non empty string is considered true
    event = new Constructor('myevent', { bubbles: "false", cancelable: "false" });
    test.equal(event.bubbles, true);
    test.equal(event.cancelable, true);

    // non empty string is considered true
    event = new Constructor('myevent', { bubbles: "true", cancelable: "true" });
    test.equal(event.bubbles, true);
    test.equal(event.cancelable, true);
  }
}

// @author Curt Arnold
// @see http://www.w3.org/TR/DOM-Level-2-Events/events#Events-EventTarget-dispatchEvent
// @see http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-17189187
exports['dispatch event'] = testcase({
  setUp: function(cb){
    this.doc = require('../level1/core/files/hc_staff.xml').hc_staff();
    cb();
  },

  tearDown: function(cb){
    _tearDown.call(this, 'doc');
    cb();
  },

  'a null reference passed to dispatchEvent': function (test) {
    var doc = this.doc;
    test.throws(function(){ doc.dispatchEvent(null) }, TypeError, 'should throw an exception');
    // TODO: figure out the best way to test (exception.code == 0) and (exception.message == 'Null event')
    test.done();
  },

  'a created but not initialized event passed to dispatchEvent': function (test) {
    var doc = this.doc,
        event_types = ['Events', 'MutationEvents', 'UIEvents', 'MouseEvents', 'HTMLEvents'];
    test.expect(event_types.length);
    event_types.forEach(function(type){
      test.throws(function(){ doc.dispatchEvent(doc.createEvent(type)) }, doc.defaultView.DOMException, 'should throw an exception for ' + type);
    })
    test.done();
  },

  // An EventListener registered on the target node with capture false, should receive any event fired on that node.
  'EventListener with capture false': function (test) {
    var monitor = new EventMonitor();
    this.doc.addEventListener("foo", monitor.handleEvent, false);
    var event = this.doc.createEvent("Events");
    event.initEvent("foo",true,false);
    test.expect(7);
    test.strictEqual(event.eventPhase, 0);
    test.strictEqual(event.currentTarget, null);
    this.doc.dispatchEvent(event);
    test.equal(monitor.atEvents.length, 1, 'should receive atEvent');
    test.equal(monitor.bubbledEvents.length, 0, 'should not receive at bubble phase');
    test.equal(monitor.capturedEvents.length, 0, 'should not receive at capture phase');
    test.strictEqual(event.eventPhase, 0);
    test.strictEqual(event.currentTarget, null);
    test.done();
  },

  // An EventListener registered on the target node with capture true, should receive any event fired on that node.
  'EventListener with capture true': function (test) {
    var monitor = new EventMonitor();
    this.doc.addEventListener("foo", monitor.handleEvent, true);
    var event = this.doc.createEvent("Events");
    event.initEvent("foo",true,false);
    test.expect(7);
    test.strictEqual(event.eventPhase, 0);
    test.strictEqual(event.currentTarget, null);
    this.doc.dispatchEvent(event);
    test.equal(monitor.atEvents.length, 1, 'should receive atEvent');
    test.equal(monitor.bubbledEvents.length, 0, 'should not receive at bubble phase');
    test.equal(monitor.capturedEvents.length, 0, 'should not receive at capture phase');
    test.strictEqual(event.eventPhase, 0);
    test.strictEqual(event.currentTarget, null);
    test.done();
  },

  // The same monitor is registered twice and an event is dispatched.  The monitor should receive only one handleEvent call.
  'EventListener is registered twice': function (test) {
    var monitor = new EventMonitor();
    this.doc.addEventListener("foo", monitor.handleEvent, false);
    this.doc.addEventListener("foo", monitor.handleEvent, false);
    var event = this.doc.createEvent("Events");
    event.initEvent("foo",true,false);
    this.doc.dispatchEvent(event);
    test.expect(3);
    test.equal(monitor.atEvents.length, 1, 'should receive atEvent only once');
    test.equal(monitor.bubbledEvents.length, 0, 'should not receive at bubble phase');
    test.equal(monitor.capturedEvents.length, 0, 'should not receive at capture phase');
    test.done();
  },

  // The same monitor is registered twice, removed once, and an event is dispatched. The monitor should receive only no handleEvent calls.
  'EventListener is registered twice, removed once': function (test) {
    var monitor = new EventMonitor();
    this.doc.addEventListener("foo", monitor.handleEvent, false);
    this.doc.addEventListener("foo", monitor.handleEvent, false);
    this.doc.removeEventListener("foo", monitor.handleEvent, false);
    var event = this.doc.createEvent("Events");
    event.initEvent("foo",true,false);
    this.doc.dispatchEvent(event);
    test.equal(monitor.allEvents.length, 0, 'should not receive any handleEvent calls');
    test.done();
  },

  // A monitor is added, multiple calls to removeEventListener are made with similar but not identical arguments, and an event is dispatched.
  // The monitor should receive handleEvent calls.
  'EventListener is registered, other listeners (similar but not identical) are removed': function (test) {
    var monitor = new EventMonitor();
    var other = {handleEvent: function(){}}
    this.doc.addEventListener("foo", monitor.handleEvent, false);
    this.doc.removeEventListener("foo", monitor.handleEvent, true);
    this.doc.removeEventListener("food", monitor.handleEvent, false);
    this.doc.removeEventListener("foo", other.handleEvent, false);
    var event = this.doc.createEvent("Events");
    event.initEvent("foo",true,false);
    this.doc.dispatchEvent(event);
    test.equal(monitor.allEvents.length, 1, 'should still receive the handleEvent call');
    test.done();
  },

  // Two listeners are registered on the same target, each of which will remove both itself and the other on the first event.  Only one should see the event since event listeners can never be invoked after being removed.
  'two EventListeners which both handle by unregistering itself and the other': function (test) {
    // setup
    var es = [];
    var ls = [];
    var EventListener1 = function() { ls.push(this); }
    var EventListener2 = function() { ls.push(this); }
    EventListener1.prototype.handleEvent = function(event) { _handleEvent(event); }
    EventListener2.prototype.handleEvent = function(event) { _handleEvent(event); }
    var _handleEvent = function(event) {
      es.push(event);
      ls.forEach(function(l){
        event.currentTarget.removeEventListener("foo", l.handleEvent, false);
      })
    }
    // test
    var listener1 = new EventListener1();
    var listener2 = new EventListener2();
    this.doc.addEventListener("foo", listener1.handleEvent, false);
    this.doc.addEventListener("foo", listener2.handleEvent, false);
    var event = this.doc.createEvent("Events");
    event.initEvent("foo",true,false);
    this.doc.dispatchEvent(event);
    test.equal(es.length, 1, 'should only be handled by one EventListener');
    test.done();
  }
})

// The Event.initEvent method is called for event returned by DocumentEvent.createEvent("Events") and DocumentEvent.createEvent("MutationEvents")
// The state is checked to see if it reflects the parameters.
// @author Curt Arnold
// @see http://www.w3.org/TR/DOM-Level-2-Events/events#Events-Event-initEvent
exports['init event'] = testcase({
  setUp: function(cb){
    var doc = require('../level1/core/files/hc_staff.xml').hc_staff();
    this._events = ['Events', 'MutationEvents'].map(function(t){ return(doc.createEvent(t)); })
    cb();
  },

  tearDown: function(cb){
    _tearDown.call(this, '_events');
    cb();
  },

  'set state from params, bubble no cancel': function (test) {
    test.expect(8);
    this._events.forEach(function(event){
      test.notEqual(event, null, 'event should not be null for ' + event.eventType);
      event.initEvent('rotate', true, false);
      test.equal(event.type, 'rotate', 'event type should be \"rotate\" for ' + event.eventType);
      test.equal(event.bubbles, true, 'event should bubble for ' + event.eventType);
      test.equal(event.cancelable, false, 'event should not be cancelable for ' + event.eventType);
    })
    test.done();
  },

  'set state from params, cancel no bubble': function (test) {
    test.expect(8);
    this._events.forEach(function(event){
      test.notEqual(event, null, 'event should not be null for' + event.eventType);
      event.initEvent('rotate', false, true);
      test.equal(event.type, 'rotate', 'event type should be \"rotate\" for ' + event.eventType);
      test.equal(event.bubbles, false, 'event should not bubble for ' + event.eventType);
      test.equal(event.cancelable, true, 'event should be cancelable for ' + event.eventType);
    })
    test.done();
  },

  'initEvent called multiple times, final time is definitive': function (test) {
    test.expect(14);
    this._events.forEach(function(event){
      test.notEqual(event, null, 'event should not be null for ' + event.eventType);
      // rotate
      event.initEvent("rotate", true, true);
      test.equal(event.type, 'rotate', 'event type should be \"rotate\" for ' + event.eventType);
      test.equal(event.bubbles, true, 'event should bubble for ' + event.eventType);
      test.equal(event.cancelable, true, 'event should be cancelable for ' + event.eventType);
      // shear
      event.initEvent("shear", false, false);
      test.equal(event.type, 'shear', 'event type should be \"shear\" for ' + event.eventType);
      test.equal(event.bubbles, false, 'event should not bubble for ' + event.eventType);
      test.equal(event.cancelable, false, 'event should not be cancelable for ' + event.eventType);
    })
    test.done();
  },
})

exports['capture event'] = testcase({
  setUp: function(cb){
    _setUp.call(this);
    this.event.initEvent("foo",true,false);
    cb();
  },

  tearDown: function(cb){
    _tearDown.call(this);
    cb();
  },

  'all capturing listeners in a direct line from dispatched node will receive the event': function(test) {
    this.plist.addEventListener("foo", this.monitor.handleEvent, true);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.firstChild.dispatchEvent(this.event);
    test.expect(3);
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 0, 'should not have any bubbled events');
    test.equal(this.monitor.capturedEvents.length, 1, 'should have captured 1 event');
    test.done();
  },

  'only capture listeners in a direct line from target to the document node should receive the event': function(test) {
    var self = this;
    this.title.addEventListener("foo", this.monitor.handleEvent, true);
    this.plist.addEventListener("foo", function(event) { event.preventDefault(); self.monitor.handleEvent(event) }, false);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    var return_val = this.plist.firstChild.dispatchEvent(this.event);
    test.expect(4);
    test.equal(return_val, true, 'dispatchEvent should return *true*');
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 1, 'should have bubbled 1 event');
    test.equal(this.monitor.capturedEvents.length, 0, 'should not have captured any events');
    test.done();
  }
})

exports['bubble event'] = testcase({
  setUp: function(cb){
    _setUp.call(this);
    this.event.initEvent("foo",true,false);
    cb();
  },

  tearDown: function(cb){
    _tearDown.call(this);
    cb();
  },

  'all non-capturing listeners in a direct line from dispatched node will receive a bubbling event': function(test) {
    this.win.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.firstChild.dispatchEvent(this.event);
    test.expect(3);
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 2, 'should have 2 bubbled events');
    test.equal(this.monitor.capturedEvents.length, 0, 'should not have any captured events');
    test.done();
  },

  'only bubble listeners in a direct line from target to the document node should receive the event': function(test) {
    this.win.addEventListener("foo", this.monitor.handleEvent, false);
    this.title.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.addEventListener("foo", this._handleEvent('preventDefault'), true);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    var return_val = this.plist.firstChild.dispatchEvent(this.event);
    test.expect(4);
    test.equal(return_val, true, 'dispatchEvent should return *true*');
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 1, 'should have 1 bubbled event');
    test.equal(this.monitor.capturedEvents.length, 1, 'should have captured 1 event');
    test.done();
  },

  'if an event does not bubble, bubble listeners should not receive the event': function(test) {
    this.win.addEventListener("foo", this.monitor.handleEvent, false);
    this.body.addEventListener("foo", this.monitor.handleEvent, true);
    this.plist.addEventListener("foo", this._handleEvent('preventDefault'), false);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    this.event.initEvent("foo",false,false);
    var return_val = this.plist.firstChild.dispatchEvent(this.event);
    test.expect(4);
    test.equal(return_val, true, 'dispatchEvent should return *true*');
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 0, 'should not have any bubbled events');
    test.equal(this.monitor.capturedEvents.length, 1, 'should have captured 1 event');
    test.done();
  }
})

exports['stop propagation'] = testcase({
  setUp: function(cb){
    _setUp.call(this);
    this.event.initEvent("foo",true,false);
    cb();
  },

  tearDown: function(cb){
    _tearDown.call(this);
    cb();
  },

  'should prevent the target from receiving the event': function(test) {
    this.win.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.addEventListener("foo", this._handleEvent('stopPropagation'), true);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.firstChild.dispatchEvent(this.event);
    test.expect(3);
    test.equal(this.monitor.atEvents.length, 0, 'should be at 0 events');
    test.equal(this.monitor.bubbledEvents.length, 0, 'should have no bubbled events');
    test.equal(this.monitor.capturedEvents.length, 1, 'should have 1 captured event');
    test.done();
  },

  'should prevent all listeners from receiving the event': function(test) {
    this.win.addEventListener("foo", this.monitor.handleEvent, false);
    this.body.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.addEventListener("foo", this._handleEvent('stopPropagation'), false);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.firstChild.dispatchEvent(this.event);
    test.expect(3);
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 1, 'should have 1 bubbled event');
    test.equal(this.monitor.capturedEvents.length, 0, 'should have no captured events');
    test.done();
  },

  'stopPropagation should not prevent listeners on the same element from receiving the event': function(test) {
    this.win.addEventListener("foo", this.monitor.handleEvent, false);
    this.body.addEventListener("foo", this.monitor.handleEvent, false);
    this.plist.addEventListener("foo", this._handleEvent('stopPropagation'), true);
    this.plist.addEventListener("foo", this._handleEvent('stopPropagation'), false);
    this.plist.addEventListener("foo",  this.monitor.handleEvent, true);
    this.plist.addEventListener("foo",  this.monitor.handleEvent, false);
    this.plist.dispatchEvent(this.event);
    test.expect(3);
    test.equal(this.monitor.atEvents.length, 4, 'should be at 4 events');
    test.equal(this.monitor.bubbledEvents.length, 0, 'should have no bubbled events');
    test.equal(this.monitor.capturedEvents.length, 0, 'should have no captured events');
    test.done();
  }
})

exports['prevent default'] = testcase({
  setUp: function(cb){
    _setUp.call(this);
    this.event.initEvent("foo",true,true);
    cb();
  },

  tearDown: function(cb){
    _tearDown.call(this);
    cb();
  },

  'the defaultPrevented flag is set when the event is prevented': function(test) {
    this.title.addEventListener("foo", function(event) { event.preventDefault();}, false);
    var return_val = this.title.dispatchEvent(this.event);
    test.equal(this.event.defaultPrevented, true, 'the defaultPrevented flag should be true when the event is prevented');
    test.done();
  },

  'the defaultPrevented flag is not set when the event is not prevented': function(test) {
    this.title.addEventListener("foo", this.monitor.handleEvent, false);
    var return_val = this.title.dispatchEvent(this.event);
    test.equal(this.event.defaultPrevented, false, 'the defaultPrevented flag should be false when the event is not prevented');
    test.done();
  },

  'a cancelable event can have its default event disabled': function(test) {
    this.body.addEventListener("foo", this.monitor.handleEvent, true);
    this.plist.addEventListener("foo", this._handleEvent('preventDefault'), false);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    var return_val = this.plist.firstChild.dispatchEvent(this.event);
    test.expect(4);
    test.equal(return_val, false, 'dispatchEvent should return *false*');
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 1, 'should have bubbled 1 event');
    test.equal(this.monitor.capturedEvents.length, 1, 'should have captured 1 event');
    test.done();
  },

  'a non-cancelable event cannot have its default event disabled': function(test) {
    this.body.addEventListener("foo", this.monitor.handleEvent, true);
    this.plist.addEventListener("foo", this._handleEvent('preventDefault'), false);
    this.plist.firstChild.addEventListener("foo", this.monitor.handleEvent, false);
    this.event.initEvent("foo",true,false);
    var return_val = this.plist.firstChild.dispatchEvent(this.event);
    test.expect(4);
    test.equal(return_val, true, 'dispatchEvent should return *true*');
    test.equal(this.monitor.atEvents.length, 1, 'should be at 1 event');
    test.equal(this.monitor.bubbledEvents.length, 1, 'should have bubbled 1 event');
    test.equal(this.monitor.capturedEvents.length, 1, 'should have captured 1 event');
    test.done();
  }
})

exports["remove listener in handler"] = t => {
  const document = jsdom.jsdom();
  let h1 = 0, h2 = 0;

  document.addEventListener("click", function handler1() {
    // Event handler that removes itself
    h1++;
    document.removeEventListener("click", handler1);
  });
  document.addEventListener("click", () => h2++);

  const ev = document.createEvent("MouseEvents");
  ev.initEvent("click", true, true);

  document.dispatchEvent(ev);
  t.strictEqual(h1, 1, "handler1 must be called once");
  t.strictEqual(h2, 1, "handler2 must be called once");

  document.dispatchEvent(ev);
  t.strictEqual(h1, 1, "handler1 must be called once");
  t.strictEqual(h2, 2, "handler2 must be called twice");
  t.done();
};
