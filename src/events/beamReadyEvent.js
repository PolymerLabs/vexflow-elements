// ## Description
// 
// This file implements `BeamReadyEvent`, the event that vf-tuplet dispatches 
// to its parent (vf-voice) when it has finished creating its notes and beam.

export default class BeamReadyEvent extends Event {
  static eventName = 'vf-beam-ready';

  constructor() {
    super(BeamReadyEvent.eventName, { bubbles: true });
  }
}