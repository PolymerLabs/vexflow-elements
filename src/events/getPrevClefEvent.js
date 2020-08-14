/**
 * This file implements `GetPrevClefEvent`, the event that vf-stave elements 
 * dispatch in order to get the clef of the analogous stave in the previous 
 * system. 
 */
export default class GetPrevClefEvent extends Event {
  static eventName = 'get-previous-clef';

  /**
   * The index of the stave that dispatches this event within its parent system.
   * @type {number}
   * @private
   */
  _staveIndex;

  constructor() {
    super(GetPrevClefEvent.eventName, { bubbles: true });
  }
  
  /**
   * Setter to detect when the Factory instance is set. Once the Factory is set,
   * vf-stave can start creating components. 
   * 
   * @param {Vex.Flow.Factory} value - The Factory instance that the overall 
   *                                   component is using, set by the parent 
   *                                   vf-score.
   */
  set staveIndex(value) {
    this._staveIndex = value;
  }

  /**
   * @type {number}
  */
  get staveIndex() {
    return this._staveIndex;
  }
}
