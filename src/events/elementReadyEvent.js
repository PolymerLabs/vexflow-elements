// ## Description
// 
// This file implements `ElementReadyEvent`, the event that child elements
// dispatch to their parent element when they have finished creating its elements.

export default class ElementReadyEvent extends Event {
  static staveReadyEventName = 'vf-stave-ready';
  static systemReadyEventName = 'vf-system-ready';
  static voiceReadyEventName = 'vf-voice-ready';

  constructor(eventName) {
    super(eventName, { bubbles: true });
  }
}