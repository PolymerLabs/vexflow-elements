/**
 * Event that child elements dispatch when they have been added to the DOM so
 * that they can get the Factory instance to be used by all elements of the 
 * overall component. 
 * `vf-score` listens to this event and sets the vf property of the event target.
 */
export default class ElementAddedEvent extends Event {
  static eventName = 'vf-element-added';

  constructor() {
    super(ElementAddedEvent.eventName, { bubbles: true });
  }
}