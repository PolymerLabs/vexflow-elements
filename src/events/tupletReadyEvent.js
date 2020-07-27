// ## Description
// 
// This file implements `TupletReadyEvent`, the event that vf-tuplet dispatches 
// to its parent (vf-voice) when it has finished creating its tuplet.

export default class TupletReadyEvent extends Event {
  static eventName = 'vf-tuplet-ready';

  constructor() {
    super(TupletReadyEvent.eventName, { bubbles: true });
  }
}