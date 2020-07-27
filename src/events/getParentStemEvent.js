// ## Description
// 
// This file implements `GetParentStemEvent`, the event that vf-tuplet elements 
// dispatch in order to get the stem direction of their parent voice. 

export default class GetParentStemEvent extends Event {
  static eventName = 'get-parent-stem';

  constructor() {
    super(GetParentStemEvent.eventName, { bubbles: true });
  }
}