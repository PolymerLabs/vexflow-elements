/**
 * This file implements `GetPrevTimeSig`, the event that vf-stave elements 
 * dispatch in order to get the time signature of the analogous stave in the previous 
 * system. 
 */
export default class GetPrevTimeSigEvent extends Event {
  static eventName = 'get-previous-time-sig';

  constructor() {
    super(GetPrevTimeSigEvent.eventName, { bubbles: true });
  }
}
